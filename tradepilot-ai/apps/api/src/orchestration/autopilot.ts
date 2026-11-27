import { OpportunityStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { searchCjProducts } from "../connectors/cj.js";
import { getEbaySoldComps } from "../connectors/sold-comps.js";
import { getGoogleTrends } from "../connectors/trends.js";
import { calculateProfit } from "../services/profit.js";
import { generateWithFallback, providerStatus } from "../ai-gateway/index.js";

export interface AutopilotConfig {
    enabled: boolean;
    intervalMinutes: number;
    minNetProfit: number;
    minRoiPercent: number;
    defaultShippingEstimate: number;
    returnsReservePercent: number;
    autoPromoteApproved: boolean;
    seedKeywords: string[];
    targetMarkets: Array<{
        country: string;
        currency: string;
        marketplace: "EBAY" | "AMAZON" | "SHOPIFY";
        soldMarketplace: "EBAY_US" | "EBAY_GB";
        platformFeePercent: number;
        paymentFeePercent: number;
        paymentFixedFee: number;
    }>;
}

const DEFAULT_CONFIG: AutopilotConfig = {
    enabled: false,
    intervalMinutes: 360,
    minNetProfit: 8,
    minRoiPercent: 25,
    defaultShippingEstimate: 4.5,
    returnsReservePercent: 5,
    autoPromoteApproved: true,
    seedKeywords: [],
    targetMarkets: [
        {
            country: "US",
            currency: "USD",
            marketplace: "EBAY",
            soldMarketplace: "EBAY_US",
            platformFeePercent: 13.25,
            paymentFeePercent: 0,
            paymentFixedFee: 0.3
        },
        {
            country: "GB",
            currency: "GBP",
            marketplace: "EBAY",
            soldMarketplace: "EBAY_GB",
            platformFeePercent: 12.8,
            paymentFeePercent: 0,
            paymentFixedFee: 0.3
        }
    ]
};

let currentConfig: AutopilotConfig = { ...DEFAULT_CONFIG };
let timer: NodeJS.Timeout | null = null;
let cycleRunning = false;
let lastCycleAt: string | null = null;

function asObject(value: unknown): Record<string, any> | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, any>)
        : undefined;
}

function findRows(value: unknown, depth = 0): Record<string, any>[] {
    if (depth > 5 || value == null) return [];
    if (Array.isArray(value)) return value.map(asObject).filter(Boolean) as Record<string, any>[];
    const obj = asObject(value);
    if (!obj) return [];
    for (const key of ["items", "results", "productList", "list", "records", "soldItems", "data"]) {
        const found = obj[key];
        if (Array.isArray(found)) return found.map(asObject).filter(Boolean) as Record<string, any>[];
        if (found && typeof found === "object") {
            const nested = findRows(found, depth + 1);
            if (nested.length) return nested;
        }
    }
    return [];
}

function numericPrice(row: Record<string, any>, keys: string[]): number | undefined {
    for (const key of keys) {
        const raw = row[key];
        const parsed =
            typeof raw === "number"
                ? raw
                : typeof raw === "string"
                    ? Number(raw.replace(/[^0-9.]/g, ""))
                    : NaN;
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
}

function median(values: number[]): number | undefined {
    if (!values.length) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function resolveKeywordsToHunt(): Promise<string[]> {
    const sources = await prisma.productSource.findMany({
        where: { enabled: true },
        orderBy: { updatedAt: "desc" }
    });

    const fromDb = sources.flatMap((src) => {
        const cfg = asObject(src.config);
        const kws = Array.isArray(cfg?.keywords)
            ? cfg!.keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 1)
            : [];
        return kws.length ? kws : [src.name];
    });

    const combined = [...currentConfig.seedKeywords, ...fromDb]
        .map((k) => k.trim())
        .filter((k) => k.length >= 2);

    return Array.from(new Set(combined));
}

async function generateListingDraft(product: {
    title: string;
    marketplace: string;
    targetCountry: string;
    salePrice: number;
    currency: string;
}) {
    if (!providerStatus().some((p) => p.configured)) return null;
    try {
        const res = await generateWithFallback({
            task: "autonomous-listing-draft",
            system:
                "Generate a factual e-commerce listing draft and risk check. Return strictly valid JSON with keys: optimizedTitle (max 80 chars), bulletPoints (array of 3-5 strings), description (string), complianceFlags (array of strings, empty if none). Do not invent certifications or brand claims.",
            prompt: JSON.stringify(product),
            maxTokens: 700
        });
        return res.text;
    } catch {
        return null;
    }
}

export async function runAutonomousCycle(overrideKeywords?: string[]) {
    if (cycleRunning) {
        return { skipped: true, reason: "An autonomous cycle is already running" };
    }

    cycleRunning = true;
    const run = await prisma.agentRun.create({
        data: {
            agentKey: "autonomous-arbitrage-loop",
            status: "RUNNING",
            input: {
                overrideKeywords: overrideKeywords ?? null,
                config: currentConfig
            } as any
        }
    });

    try {
        const keywords =
            overrideKeywords && overrideKeywords.length > 0
                ? overrideKeywords.map((k) => k.trim()).filter((k) => k.length >= 2)
                : await resolveKeywordsToHunt();

        if (keywords.length === 0) {
            const emptyResult = {
                keywordsProcessed: 0,
                opportunitiesCreated: 0,
                approvedCount: 0,
                rejectedCount: 0,
                note: "No enabled ProductSource records or seedKeywords configured."
            };
            await prisma.agentRun.update({
                where: { id: run.id },
                data: { status: "COMPLETED", output: emptyResult as any, finishedAt: new Date() }
            });
            lastCycleAt = new Date().toISOString();
            return { runId: run.id, ...emptyResult };
        }

        let opportunitiesCreated = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        const errors: Array<{ keyword: string; market?: string; error: string }> = [];

        for (const keyword of keywords) {
            let cjPayload: unknown;
            try {
                cjPayload = await searchCjProducts({ keyword, page: 1, size: 25 });
            } catch (err) {
                errors.push({
                    keyword,
                    error: err instanceof Error ? err.message : "CJ supplier search failed"
                });
                continue;
            }

            const supplierItems = findRows(cjPayload)
                .map((row) => ({
                    title: String(row.productName || row.name || row.title || "").trim(),
                    supplierPrice: numericPrice(row, [
                        "sellPrice",
                        "productPrice",
                        "nowPrice",
                        "price",
                        "variantSellPrice"
                    ]),
                    supplierCurrency: String(
                        row.priceCurrency || row.currencyCode || row.currency || ""
                    ).toUpperCase(),
                    sourceUrl:
                        typeof (row.productUrl || row.url) === "string"
                            ? String(row.productUrl || row.url)
                            : undefined,
                    imageUrl:
                        typeof (row.productImage || row.image || row.imageUrl) === "string"
                            ? String(row.productImage || row.image || row.imageUrl)
                            : undefined,
                    sourceId: String(row.pid || row.productId || row.id || "")
                }))
                .filter((item) => item.title.length > 1 && item.supplierPrice !== undefined);

            if (!supplierItems.length) continue;

            // Evaluate every configured target market and pick the highest-profit market per product
            const marketComps = new Map<string, { medianPrice: number; sampleSize: number; trendOk: boolean }>();

            for (const market of currentConfig.targetMarkets) {
                try {
                    const [soldRaw, trendRaw] = await Promise.allSettled([
                        getEbaySoldComps({
                            query: keyword,
                            marketplace: market.soldMarketplace,
                            limit: 80
                        }),
                        getGoogleTrends({
                            query: keyword,
                            geo: market.country,
                            date: "today 3-m"
                        })
                    ]);

                    if (soldRaw.status !== "fulfilled") continue;
                    const soldPrices = findRows(soldRaw.value)
                        .map((r) => numericPrice(r, ["soldPrice", "price", "amount", "totalPrice"]))
                        .filter((n): n is number => n !== undefined);

                    const med = median(soldPrices);
                    if (med !== undefined && soldPrices.length >= 3) {
                        marketComps.set(`${market.country}:${market.marketplace}`, {
                            medianPrice: med,
                            sampleSize: soldPrices.length,
                            trendOk: trendRaw.status === "fulfilled"
                        });
                    }
                } catch (err) {
                    errors.push({
                        keyword,
                        market: `${market.country}:${market.marketplace}`,
                        error: err instanceof Error ? err.message : "Market probe failed"
                    });
                }
            }

            for (const product of supplierItems) {
                let bestEvaluation: {
                    market: AutopilotConfig["targetMarkets"][number];
                    profit: ReturnType<typeof calculateProfit>;
                    sampleSize: number;
                    platformFees: number;
                    paymentFees: number;
                    returnsReserve: number;
                } | null = null;

                for (const market of currentConfig.targetMarkets) {
                    if (product.supplierCurrency && product.supplierCurrency !== market.currency) {
                        continue;
                    }
                    const comp = marketComps.get(`${market.country}:${market.marketplace}`);
                    if (!comp) continue;

                    const platformFees = Number(
                        ((comp.medianPrice * market.platformFeePercent) / 100).toFixed(2)
                    );
                    const paymentFees = Number(
                        ((comp.medianPrice * market.paymentFeePercent) / 100 + market.paymentFixedFee).toFixed(2)
                    );
                    const returnsReserve = Number(
                        ((comp.medianPrice * currentConfig.returnsReservePercent) / 100).toFixed(2)
                    );

                    const profit = calculateProfit({
                        salePrice: comp.medianPrice,
                        supplierCost: product.supplierPrice!,
                        shipping: currentConfig.defaultShippingEstimate,
                        platformFees,
                        paymentFees,
                        advertisingCost: 0,
                        returnsReserve,
                        taxAndDuty: 0,
                        currency: market.currency
                    });

                    if (!bestEvaluation || profit.netProfit > bestEvaluation.profit.netProfit) {
                        bestEvaluation = {
                            market,
                            profit,
                            sampleSize: comp.sampleSize,
                            platformFees,
                            paymentFees,
                            returnsReserve
                        };
                    }
                }

                if (!bestEvaluation) continue;

                // Avoid duplicate records for the same product title + marketplace
                const existing = await prisma.productOpportunity.findFirst({
                    where: {
                        title: product.title,
                        marketplace: bestEvaluation.market.marketplace,
                        targetCountry: bestEvaluation.market.country
                    },
                    select: { id: true }
                });
                if (existing) continue;

                const meetsProfitGate =
                    bestEvaluation.profit.profitable &&
                    bestEvaluation.profit.netProfit >= currentConfig.minNetProfit &&
                    (bestEvaluation.profit.roiPercent ?? 0) >= currentConfig.minRoiPercent;

                const status: OpportunityStatus = meetsProfitGate
                    ? currentConfig.autoPromoteApproved
                        ? "APPROVED"
                        : "RESEARCHING"
                    : "REJECTED";

                const listingDraft = meetsProfitGate
                    ? await generateListingDraft({
                        title: product.title,
                        marketplace: bestEvaluation.market.marketplace,
                        targetCountry: bestEvaluation.market.country,
                        salePrice: bestEvaluation.profit.salePrice,
                        currency: bestEvaluation.market.currency
                    })
                    : null;

                await prisma.productOpportunity.create({
                    data: {
                        title: product.title,
                        sourceUrl: product.sourceUrl,
                        imageUrl: product.imageUrl,
                        sourceName: "CJdropshipping",
                        targetCountry: bestEvaluation.market.country,
                        currency: bestEvaluation.market.currency,
                        marketplace: bestEvaluation.market.marketplace,
                        supplierPrice: product.supplierPrice!,
                        shippingCost: currentConfig.defaultShippingEstimate,
                        platformFees: bestEvaluation.platformFees,
                        paymentFees: bestEvaluation.paymentFees,
                        returnsReserve: bestEvaluation.returnsReserve,
                        taxAndDutyReserve: 0,
                        estimatedSalePrice: bestEvaluation.profit.salePrice,
                        status,
                        evidence: {
                            autonomousRunId: run.id,
                            keyword,
                            supplierSourceId: product.sourceId,
                            soldCompsSampleSize: bestEvaluation.sampleSize,
                            calculatedNetProfit: bestEvaluation.profit.netProfit,
                            calculatedRoiPercent: bestEvaluation.profit.roiPercent,
                            calculatedMarginPercent: bestEvaluation.profit.marginPercent,
                            listingDraft
                        } as any
                    }
                });

                opportunitiesCreated += 1;
                if (status === "APPROVED") approvedCount += 1;
                if (status === "REJECTED") rejectedCount += 1;
            }
        }

        const summary = {
            keywordsProcessed: keywords.length,
            opportunitiesCreated,
            approvedCount,
            rejectedCount,
            errors
        };

        await prisma.agentRun.update({
            where: { id: run.id },
            data: {
                status: "COMPLETED",
                output: summary as any,
                error: errors.length ? `${errors.length} sub-tasks failed` : null,
                finishedAt: new Date()
            }
        });

        lastCycleAt = new Date().toISOString();
        return { runId: run.id, ...summary };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Autonomous cycle failed";
        await prisma.agentRun.update({
            where: { id: run.id },
            data: { status: "FAILED", error: message, finishedAt: new Date() }
        });
        throw error;
    } finally {
        cycleRunning = false;
    }
}

export function getAutopilotState() {
    return {
        config: currentConfig,
        running: cycleRunning,
        scheduled: Boolean(timer),
        lastCycleAt
    };
}

export function configureAutopilot(patch: Partial<AutopilotConfig>) {
    currentConfig = { ...currentConfig, ...patch };
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (currentConfig.enabled) {
        const ms = Math.max(currentConfig.intervalMinutes, 5) * 60_000;
        timer = setInterval(() => {
            runAutonomousCycle().catch(() => undefined);
        }, ms);
    }
    return getAutopilotState();
}
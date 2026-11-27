import { Router } from "express";
import { z } from "zod";
import { generateWithFallback, providerStatus } from "../ai-gateway/index.js";
import { agents } from "../agents/registry.js";
import { calculateProfit } from "../services/profit.js";
import { createSupplier, getSuppliers, updateSupplierVerification } from "../services/suppliers.js";
import { importCandidates, listOpportunities } from "../services/discovery.js";
import { markets } from "../commerce/markets.js";
import { connectorStatus } from "../connectors/http.js";
import { searchCjProducts } from "../connectors/cj.js";
import { getGoogleTrends } from "../connectors/trends.js";
import { getEbaySoldComps } from "../connectors/sold-comps.js";

export const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", service: "tradepilot-api", timestamp: new Date().toISOString() }));
router.get("/ai/providers", (_req, res) => res.json({ providers: providerStatus() }));
router.get("/agents", (_req, res) => res.json({ agents }));
router.get("/markets", (_req, res) => res.json({ markets }));
router.get("/integrations", (_req, res) => res.json({ integrations: connectorStatus() }));

router.get("/research/cj/products", async (req, res, next) => {
  try {
    const query = z.object({ keyword: z.string().min(2).max(120), page: z.coerce.number().int().min(1).max(1000).optional(), size: z.coerce.number().int().min(1).max(100).optional() }).parse(req.query);
    res.json(await searchCjProducts(query));
  } catch (error) { next(error); }
});

router.get("/research/trends", async (req, res, next) => {
  try {
    const query = z.object({ query: z.string().min(2).max(150), geo: z.string().length(2).optional(), date: z.string().max(40).optional() }).parse(req.query);
    res.json(await getGoogleTrends(query));
  } catch (error) { next(error); }
});

router.get("/research/ebay/sold", async (req, res, next) => {
  try {
    const query = z.object({ query: z.string().min(2).max(150), marketplace: z.enum(["EBAY_US", "EBAY_GB"]).optional(), limit: z.coerce.number().int().min(1).max(200).optional() }).parse(req.query);
    res.json(await getEbaySoldComps(query));
  } catch (error) { next(error); }
});

router.get("/opportunities", async (req, res, next) => {
  try {
    const items = await listOpportunities({
      country: typeof req.query.country === "string" ? req.query.country : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50
    });
    res.json({ items, count: items.length });
  } catch (error) { next(error); }
});

router.post("/discovery/import", async (req, res, next) => {
  try {
    const productSchema = z.object({
      title: z.string().min(2).max(250),
      supplierPrice: z.number().positive(),
      estimatedSalePrice: z.number().positive(),
      currency: z.string().length(3),
      targetCountry: z.string().length(2),
      shippingCost: z.number().nonnegative().optional(),
      sourceName: z.string().max(120).optional(),
      sourceUrl: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      marketplace: z.string().max(80).optional(),
      supplierId: z.string().optional(),
      evidence: z.record(z.unknown()).optional()
    });
    const body = z.object({ products: z.array(productSchema).min(1).max(100) }).parse(req.body);
    const items = await importCandidates(body.products);
    res.status(201).json({ imported: items.length, items });
  } catch (error) { next(error); }
});

router.get("/suppliers", async (req, res, next) => {
  try {
    const items = await getSuppliers(typeof req.query.country === "string" ? req.query.country : undefined);
    res.json({ items, count: items.length });
  } catch (error) { next(error); }
});

router.post("/suppliers", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).max(160),
      website: z.string().url().optional(),
      countryCode: z.string().length(2),
      contactEmail: z.string().email().optional(),
      sourceType: z.string().max(40).optional(),
      shippingNotes: z.string().max(2000).optional(),
      returnPolicy: z.string().max(2000).optional()
    }).parse(req.body);
    const supplier = await createSupplier(body);
    res.status(201).json(supplier);
  } catch (error) { next(error); }
});

router.patch("/suppliers/:id/verification", async (req, res, next) => {
  try {
    const body = z.object({ verified: z.boolean() }).parse(req.body);
    const supplier = await updateSupplierVerification(req.params.id, body.verified);
    res.json(supplier);
  } catch (error) { next(error); }
});

router.post("/ai/chat", async (req, res, next) => {
  try {
    const schema = z.object({
      prompt: z.string().min(1).max(12000),
      system: z.string().max(4000).optional(),
      task: z.string().max(80).optional()
    });
    const input = schema.parse(req.body);
    const result = await generateWithFallback({ ...input, maxTokens: 1400 });
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/profit/calculate", (req, res, next) => {
  try {
    const schema = z.object({
      salePrice: z.number().nonnegative(),
      supplierCost: z.number().nonnegative(),
      shipping: z.number().nonnegative().default(0),
      platformFees: z.number().nonnegative().default(0),
      paymentFees: z.number().nonnegative().default(0),
      advertisingCost: z.number().nonnegative().default(0),
      returnsReserve: z.number().nonnegative().default(0),
      taxAndDuty: z.number().nonnegative().default(0),
      currency: z.string().length(3).default("USD")
    });
    res.json(calculateProfit(schema.parse(req.body)));
  } catch (error) { next(error); }
});

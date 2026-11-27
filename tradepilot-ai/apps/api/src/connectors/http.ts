import { env } from "../config/env.js";

export async function connectorFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.connectorTimeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const raw = await response.text();
    let data: any;
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw.slice(0, 500) }; }
    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : `Connector request failed (${response.status})`;
      throw new Error(message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Connector request timed out");
    throw error;
  } finally { clearTimeout(timer); }
}

export function connectorStatus() {
  return [
    { id: "cjdropshipping", name: "CJdropshipping", configured: Boolean(env.cjApiKey), capabilities: ["supplier_catalog", "product_search", "variant_lookup"] },
    { id: "google_trends", name: "Google Trends via SerpApi", configured: Boolean(env.serpApiKey), capabilities: ["trend_interest", "related_queries"] },
    { id: "ebay_sold", name: "eBay sold comps via Trawl", configured: Boolean(env.trawlApiKey), capabilities: ["completed_sales", "sold_price_evidence"] }
  ];
}

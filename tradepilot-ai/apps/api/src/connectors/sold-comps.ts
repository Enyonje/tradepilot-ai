import { env } from "../config/env.js";
import { connectorFetch } from "./http.js";

// Trawl is an independent third-party data provider, not an official eBay API.
export async function getEbaySoldComps(input: { query: string; marketplace?: string; limit?: number }) {
  if (!env.trawlApiKey) throw new Error("Sold-comps connector is not configured. Add TRAWL_API_KEY on the server.");
  const url = new URL(`${env.trawlApiBase.replace(/\/$/, "")}/ebay/v1/sold`);
  url.searchParams.set("q", input.query);
  url.searchParams.set("marketplace", input.marketplace || "EBAY_US");
  url.searchParams.set("limit", String(input.limit || 50));
  return connectorFetch<any>(url.toString(), { headers: { Authorization: `Bearer ${env.trawlApiKey}`, Accept: "application/json" } });
}

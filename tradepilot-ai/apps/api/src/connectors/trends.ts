import { env } from "../config/env.js";
import { connectorFetch } from "./http.js";

export async function getGoogleTrends(input: { query: string; geo?: string; date?: string }) {
  if (!env.serpApiKey) throw new Error("Google Trends connector is not configured. Add SERPAPI_API_KEY on the server.");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", input.query);
  if (input.geo) url.searchParams.set("geo", input.geo);
  url.searchParams.set("date", input.date || "today 12-m");
  url.searchParams.set("api_key", env.serpApiKey);
  const result = await connectorFetch<any>(url.toString());
  if (result.error) throw new Error(String(result.error));
  return { provider: "google_trends_serpapi", query: input.query, geo: input.geo || "worldwide", dateRange: input.date || "today 12-m", data: result };
}

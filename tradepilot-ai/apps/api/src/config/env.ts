import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const candidate of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../../.env")
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

function parseBool(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

const databaseUrl = (process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in .env");
}

export const env = {
  // Core server & database
  port: parsePositiveInt(process.env.PORT, 4000),
  webOrigin: (process.env.WEB_ORIGIN || "http://localhost:5173").trim(),
  databaseUrl,

  // AI Gateway & failover order
  providerOrder: (process.env.AI_PROVIDER_ORDER || "openai,gemini,groq")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean),
  timeoutMs: parsePositiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 25000),
  openaiKey: (process.env.OPENAI_API_KEY || "").trim(),
  openaiModel: (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim(),
  geminiKey: (process.env.GEMINI_API_KEY || "").trim(),
  geminiModel: (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim(),
  groqKey: (process.env.GROQ_API_KEY || "").trim(),
  groqModel: (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim(),

  // Sourcing & market intelligence connectors
  cjApiKey: (process.env.CJ_API_KEY || "").trim(),
  serpApiKey: (process.env.SERPAPI_API_KEY || "").trim(),
  trawlApiKey: (process.env.TRAWL_API_KEY || "").trim(),
  trawlApiBase: (process.env.TRAWL_API_BASE || "https://api.trawl.dev").trim(),
  connectorTimeoutMs: parsePositiveInt(process.env.COMMERCE_CONNECTOR_TIMEOUT_MS, 15000),

  // Autonomous sourcing & marketplace publishing
  autopilotEnabled: parseBool(process.env.AUTOPILOT_ENABLED, false),
  autopilotIntervalMinutes: parsePositiveInt(process.env.AUTOPILOT_INTERVAL_MINUTES, 360),
  autoPublishEnabled: parseBool(process.env.AUTO_PUBLISH_ENABLED, false),

  // Optional store publishing credentials (configure whichever marketplace you connect first)
  shopifyStoreDomain: (process.env.SHOPIFY_STORE_DOMAIN || "").trim(),
  shopifyAdminToken: (process.env.SHOPIFY_ADMIN_TOKEN || "").trim(),
  shopifyApiVersion: (process.env.SHOPIFY_API_VERSION || "2025-01").trim(),

  ebayClientId: (process.env.EBAY_CLIENT_ID || "").trim(),
  ebayClientSecret: (process.env.EBAY_CLIENT_SECRET || "").trim(),
  ebayUserToken: (process.env.EBAY_USER_TOKEN || "").trim(),
  ebaySandbox: parseBool(process.env.EBAY_SANDBOX, true),

  wooCommerceUrl: (process.env.WOOCOMMERCE_URL || "").trim(),
  wooCommerceConsumerKey: (process.env.WOOCOMMERCE_CONSUMER_KEY || "").trim(),
  wooCommerceConsumerSecret: (process.env.WOOCOMMERCE_CONSUMER_SECRET || "").trim()
};
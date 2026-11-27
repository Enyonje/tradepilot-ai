import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
  providerOrder: (process.env.AI_PROVIDER_ORDER || "openai,gemini,groq")
    .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
  timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 25000),
  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  groqKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  cjApiKey: process.env.CJ_API_KEY || "",
  serpApiKey: process.env.SERPAPI_API_KEY || "",
  trawlApiKey: process.env.TRAWL_API_KEY || "",
  trawlApiBase: process.env.TRAWL_API_BASE || "https://api.trawl.dev",
  connectorTimeoutMs: Number(process.env.COMMERCE_CONNECTOR_TIMEOUT_MS || 15000)
};

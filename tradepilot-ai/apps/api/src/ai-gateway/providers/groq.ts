import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import type { ProviderAdapter } from "../types.js";

const client = env.groqKey ? new Groq({ apiKey: env.groqKey, timeout: env.timeoutMs, maxRetries: 0 }) : null;

export const groqProvider: ProviderAdapter = {
  name: "groq",
  model: env.groqModel,
  configured: Boolean(client),
  async generate(input) {
    if (!client) throw new Error("GROQ_NOT_CONFIGURED");
    const response = await client.chat.completions.create({
      model: env.groqModel,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 1200,
      messages: [
        ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
        { role: "user", content: input.prompt }
      ]
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("GROQ_EMPTY_RESPONSE");
    return text;
  }
};

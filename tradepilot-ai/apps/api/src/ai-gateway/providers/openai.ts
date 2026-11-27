import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { ProviderAdapter } from "../types.js";

const client = env.openaiKey ? new OpenAI({ apiKey: env.openaiKey, timeout: env.timeoutMs, maxRetries: 0 }) : null;

export const openaiProvider: ProviderAdapter = {
  name: "openai",
  model: env.openaiModel,
  configured: Boolean(client),
  async generate(input) {
    if (!client) throw new Error("OPENAI_NOT_CONFIGURED");
    const response = await client.chat.completions.create({
      model: env.openaiModel,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 1200,
      messages: [
        ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
        { role: "user", content: input.prompt }
      ]
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("OPENAI_EMPTY_RESPONSE");
    return text;
  }
};

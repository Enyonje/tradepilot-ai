import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import type { ProviderAdapter } from "../types.js";

const client = env.geminiKey ? new GoogleGenerativeAI(env.geminiKey) : null;

export const geminiProvider: ProviderAdapter = {
  name: "gemini",
  model: env.geminiModel,
  configured: Boolean(client),
  async generate(input) {
    if (!client) throw new Error("GEMINI_NOT_CONFIGURED");
    const model = client.getGenerativeModel({
      model: env.geminiModel,
      systemInstruction: input.system,
      generationConfig: {
        temperature: input.temperature ?? 0.2,
        maxOutputTokens: input.maxTokens ?? 1200
      }
    });
    const result = await model.generateContent(input.prompt);
    const text = result.response.text();
    if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
    return text;
  }
};

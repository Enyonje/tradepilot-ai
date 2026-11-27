import { env } from "../config/env.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";
import { groqProvider } from "./providers/groq.js";
import type { ChatInput, ChatResult, ProviderAdapter, ProviderName } from "./types.js";

const providers: Record<ProviderName, ProviderAdapter> = {
  openai: openaiProvider,
  gemini: geminiProvider,
  groq: groqProvider
};

function isPermanent(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return message.includes("invalid_api_key") ||
    message.includes("authentication") ||
    message.includes("not_configured") ||
    message.includes("model_not_found") ||
    message.includes("does not exist");
}

export function providerStatus() {
  return env.providerOrder.map((name) => {
    const provider = providers[name as ProviderName];
    return provider
      ? { name: provider.name, model: provider.model, configured: provider.configured }
      : { name, model: null, configured: false, supported: false };
  });
}

export async function generateWithFallback(input: ChatInput): Promise<ChatResult> {
  const attempts: ChatResult["attempts"] = [];
  for (const key of env.providerOrder) {
    const provider = providers[key as ProviderName];
    if (!provider || !provider.configured) {
      attempts.push({ provider: key as ProviderName, ok: false, reason: "not_configured_or_unsupported" });
      continue;
    }
    const started = Date.now();
    try {
      const text = await provider.generate(input);
      attempts.push({ provider: provider.name, ok: true });
      return {
        text, provider: provider.name, model: provider.model,
        latencyMs: Date.now() - started, attempts
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "provider_error";
      attempts.push({ provider: provider.name, ok: false, reason });
      // Do not loop/retry the same provider. Move to the next configured provider.
      // Permanent errors are recorded; fallback is still attempted.
      if (isPermanent(error)) continue;
    }
  }
  throw Object.assign(new Error("All configured AI providers failed. Check provider keys, quotas and model availability."), {
    attempts
  });
}

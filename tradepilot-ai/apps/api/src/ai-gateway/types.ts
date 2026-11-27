export type ProviderName = "openai" | "gemini" | "groq";

export interface ChatInput {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  task?: string;
}

export interface ChatResult {
  text: string;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  attempts: Array<{ provider: ProviderName; ok: boolean; reason?: string }>;
}

export interface ProviderAdapter {
  name: ProviderName;
  model: string;
  configured: boolean;
  generate(input: ChatInput): Promise<string>;
}

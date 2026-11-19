import type { LlmMessage, LlmProvider } from "@/lib/llm/types";
import { LlmProviderError } from "@/lib/llm/types";

// Configurable LLM provider via environment variables only — no provider SDK
// is hardcoded, so the operator can point this at Vercel AI Gateway, OpenAI,
// Anthropic's OpenAI-compatible endpoint, a self-hosted Ollama server, or any
// other OpenAI Chat Completions-compatible endpoint, by setting:
//   LLM_API_BASE_URL  e.g. https://ai-gateway.vercel.sh/v1  or  http://localhost:11434/v1
//   LLM_API_KEY       provider key (omit for a local server that needs none)
//   LLM_MODEL         e.g. "openai/gpt-4o-mini" (gateway) or "llama3.1" (Ollama)
// If unset, `configured` is false and callers must fall back to returning
// the raw retrieved source text instead of an LLM-phrased answer — the
// assistant must never silently invent an answer when no provider is set.
export class OpenAiCompatibleProvider implements LlmProvider {
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly model: string | undefined;

  constructor(opts?: { baseUrl?: string; apiKey?: string; model?: string }) {
    this.baseUrl = opts?.baseUrl ?? process.env.LLM_API_BASE_URL;
    this.apiKey = opts?.apiKey ?? process.env.LLM_API_KEY;
    this.model = opts?.model ?? process.env.LLM_MODEL;
  }

  get configured(): boolean {
    return Boolean(this.baseUrl && this.model);
  }

  async complete(messages: LlmMessage[]): Promise<string> {
    if (!this.configured) {
      throw new LlmProviderError("No LLM provider configured (set LLM_API_BASE_URL and LLM_MODEL)");
    }

    const url = `${this.baseUrl!.replace(/\/$/, "")}/chat/completions`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.2,
          max_tokens: 400,
        }),
      });
    } catch (err) {
      throw new LlmProviderError("Network error contacting LLM provider", err);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new LlmProviderError(`LLM provider returned HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new LlmProviderError("LLM provider response did not contain a message");
    }
    return content;
  }
}

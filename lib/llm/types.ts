export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  readonly configured: boolean;
  complete(messages: LlmMessage[]): Promise<string>;
}

export class LlmProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LlmProviderError";
  }
}

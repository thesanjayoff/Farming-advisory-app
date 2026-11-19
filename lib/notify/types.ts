export interface NotifyProvider {
  readonly id: string;
  send(target: string, message: string): Promise<void>;
}

export class NotifyProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "NotifyProviderError";
  }
}

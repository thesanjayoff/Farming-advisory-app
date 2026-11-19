export interface MandiPriceRecord {
  commodity: string;
  variety?: string;
  grade?: string;
  state: string;
  district?: string;
  market: string;
  minPriceInrPerQuintal: number;
  maxPriceInrPerQuintal: number;
  modalPriceInrPerQuintal: number;
  arrivalQuantityQuintal?: number;
  priceDate: string; // ISO date the price was reported for
  provider: string;
  sourceUrl: string;
  retrievedAt: string;
}

export interface PriceQuery {
  commodity: string;
  state?: string;
  district?: string;
  market?: string;
  /** How many days back to look for history (price trend charts). */
  daysBack?: number;
}

export interface PriceQueryResult {
  records: MandiPriceRecord[];
  marketsReporting: number;
  provider: string;
  /** True if this result is a fallback provider's data, not the primary one. */
  isFallback: boolean;
  /** Present when even the fallback had nothing — callers must show this as
   * a gap, never as a zero price (principle 1). */
  gapReason?: string;
}

export interface PriceProvider {
  readonly id: string;
  readonly displayName: string;
  readonly sourceUrl: string;
  fetchPrices(query: PriceQuery): Promise<MandiPriceRecord[]>;
}

export class PriceProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PriceProviderError";
  }
}

import type { MandiPriceRecord, PriceProvider, PriceQuery } from "@/lib/prices/types";
import { PriceProviderError } from "@/lib/prices/types";

// CEDA (Centre for Economic Data and Analysis, Ashoka University) Agricultural
// Market data API — used as the fallback/history provider when Agmarknet is
// unavailable or rate-limited. Register for a free key at
// https://api.ceda.ashoka.edu.in/ ("Register Below and get your API Key").
// CEDA's terms (https://ceda.ashoka.edu.in/api-terms-conditions/) require any
// app using this API to display the CEDA logo and the text credit "CEDA at
// Ashoka University" — see components/CedaAttribution.tsx, and keep it
// wherever this provider's data is shown. The exact request/response path
// below (`/v1/agmarket/prices`) is a best-effort guess at a conventional
// REST shape for this adapter's shape and MUST be verified against CEDA's
// own API documentation (sent after key issuance) before production use.
const DEFAULT_BASE_URL = "https://api.ceda.ashoka.edu.in/v1/agmarket";
const SOURCE_URL = "https://ceda.ashoka.edu.in/";

interface CedaRecord {
  state_name: string;
  district_name?: string;
  market_name: string;
  commodity_name: string;
  variety?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival?: number;
  price_date: string; // expected ISO-ish
}

interface CedaResponse {
  data: CedaRecord[];
}

export class CedaProvider implements PriceProvider {
  readonly id = "ceda";
  readonly displayName = "CEDA Agri Market API (Ashoka University)";
  readonly sourceUrl = SOURCE_URL;

  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.CEDA_API_KEY;
    this.baseUrl = baseUrl ?? process.env.CEDA_API_BASE_URL ?? DEFAULT_BASE_URL;
  }

  async fetchPrices(query: PriceQuery): Promise<MandiPriceRecord[]> {
    if (!this.apiKey) {
      throw new PriceProviderError(this.id, "CEDA_API_KEY is not configured");
    }

    const url = new URL(`${this.baseUrl}/prices`);
    url.searchParams.set("commodity", query.commodity);
    if (query.state) url.searchParams.set("state", query.state);
    if (query.district) url.searchParams.set("district", query.district);
    if (query.market) url.searchParams.set("market", query.market);
    if (query.daysBack) url.searchParams.set("days_back", String(query.daysBack));

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (err) {
      throw new PriceProviderError(this.id, "Network error contacting CEDA API", err);
    }

    if (!response.ok) {
      throw new PriceProviderError(this.id, `CEDA API returned HTTP ${response.status}`);
    }

    const json = (await response.json()) as CedaResponse;
    const retrievedAt = new Date().toISOString();

    return (json.data ?? [])
      .filter((r) => Number.isFinite(r.modal_price))
      .map((r) => ({
        commodity: r.commodity_name,
        variety: r.variety || undefined,
        state: r.state_name,
        district: r.district_name || undefined,
        market: r.market_name,
        minPriceInrPerQuintal: r.min_price,
        maxPriceInrPerQuintal: r.max_price,
        modalPriceInrPerQuintal: r.modal_price,
        arrivalQuantityQuintal: r.arrival,
        priceDate: r.price_date,
        provider: this.id,
        sourceUrl: this.sourceUrl,
        retrievedAt,
      }));
  }
}

import type { MandiPriceRecord, PriceProvider, PriceQuery } from "@/lib/prices/types";
import { PriceProviderError } from "@/lib/prices/types";

// data.gov.in Open Government Data (OGD) platform, Agmarknet mandi price
// dataset (e.g. "Variety-wise Daily Market Prices Data of Commodity", or
// "Current Daily Price of Various Commodities"). The operator must:
//   1. Register at https://data.gov.in and generate an API key.
//   2. Open the specific dataset page on data.gov.in and check its own
//      "API" tab for that dataset's resource ID — at the time this adapter
//      was written, at least one commonly-linked daily-price dataset page
//      stated "The API for this resource does not exist" and pointed users
//      to a "Request API" button instead, so the resource ID is NOT hard-
//      coded here. Set both AGMARKNET_API_KEY and AGMARKNET_RESOURCE_ID.
// See README "Data sources and licences" before relying on this in production.
const API_BASE = "https://api.data.gov.in/resource";
const SOURCE_URL = "https://agmarknet.gov.in/";

interface AgmarknetRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  grade?: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  arrivals?: string;
  arrival_date?: string;
}

interface AgmarknetResponse {
  records: AgmarknetRecord[];
}

export class AgmarknetProvider implements PriceProvider {
  readonly id = "agmarknet";
  readonly displayName = "Agmarknet (data.gov.in)";
  readonly sourceUrl = SOURCE_URL;

  private readonly apiKey: string | undefined;
  private readonly resourceId: string;

  constructor(apiKey?: string, resourceId?: string) {
    this.apiKey = apiKey ?? process.env.AGMARKNET_API_KEY;
    this.resourceId = resourceId ?? process.env.AGMARKNET_RESOURCE_ID ?? "";
  }

  async fetchPrices(query: PriceQuery): Promise<MandiPriceRecord[]> {
    if (!this.apiKey || !this.resourceId) {
      throw new PriceProviderError(
        this.id,
        "AGMARKNET_API_KEY and AGMARKNET_RESOURCE_ID must both be configured (see data.gov.in dataset's own API tab for the resource id)"
      );
    }

    const url = new URL(`${API_BASE}/${this.resourceId}`);
    url.searchParams.set("api-key", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "100");
    url.searchParams.set("filters[commodity]", query.commodity);
    if (query.state) url.searchParams.set("filters[state]", query.state);
    if (query.district) url.searchParams.set("filters[district]", query.district);
    if (query.market) url.searchParams.set("filters[market]", query.market);

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err) {
      throw new PriceProviderError(this.id, "Network error contacting data.gov.in", err);
    }

    if (!response.ok) {
      throw new PriceProviderError(this.id, `data.gov.in returned HTTP ${response.status}`);
    }

    const json = (await response.json()) as AgmarknetResponse;
    const retrievedAt = new Date().toISOString();

    return (json.records ?? [])
      .filter((r) => r.min_price && r.max_price && r.modal_price)
      .map((r) => ({
        commodity: r.commodity,
        variety: r.variety || undefined,
        grade: r.grade || undefined,
        state: r.state,
        district: r.district || undefined,
        market: r.market,
        minPriceInrPerQuintal: Number(r.min_price),
        maxPriceInrPerQuintal: Number(r.max_price),
        modalPriceInrPerQuintal: Number(r.modal_price),
        arrivalQuantityQuintal: r.arrivals ? Number(r.arrivals) : undefined,
        priceDate: normaliseDate(r.arrival_date),
        provider: this.id,
        sourceUrl: this.sourceUrl,
        retrievedAt,
      }))
      .filter((r) => Number.isFinite(r.modalPriceInrPerQuintal));
  }
}

function normaliseDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  // Agmarknet dates are typically DD/MM/YYYY.
  const parts = raw.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return raw;
}

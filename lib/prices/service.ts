import type { MandiPriceRecord, PriceQuery, PriceQueryResult } from "@/lib/prices/types";
import { PriceProviderError } from "@/lib/prices/types";
import { AgmarknetProvider } from "@/lib/prices/agmarknet";
import { CedaProvider } from "@/lib/prices/ceda";
import { serverCacheGet, serverCacheGetStale, serverCacheSet } from "@/lib/weather/serverCache";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — mandi prices update once a day at most

function cacheKey(query: PriceQuery): string {
  return `prices:${query.commodity}:${query.state ?? ""}:${query.district ?? ""}:${query.market ?? ""}`;
}

/**
 * Fetches mandi prices with provider fallback (Agmarknet primary, CEDA
 * fallback), server-side caching, and honest gap handling: if every provider
 * fails AND there is no cache, we return a `gapReason`, never a fabricated
 * zero price (principle 1).
 */
export async function getMandiPrices(
  query: PriceQuery,
  providers?: { primary?: AgmarknetProvider; fallback?: CedaProvider }
): Promise<PriceQueryResult> {
  const key = cacheKey(query);
  const cached = serverCacheGet<MandiPriceRecord[]>(key, CACHE_TTL_MS);
  if (cached) {
    return buildResult(cached, cached[0]?.provider ?? "cache", false);
  }

  const primary = providers?.primary ?? new AgmarknetProvider();
  const fallback = providers?.fallback ?? new CedaProvider();

  try {
    const records = await primary.fetchPrices(query);
    if (records.length > 0) {
      serverCacheSet(key, records);
      return buildResult(records, primary.id, false);
    }
  } catch (err) {
    logProviderFailure(primary.id, err);
  }

  try {
    const records = await fallback.fetchPrices(query);
    if (records.length > 0) {
      serverCacheSet(key, records);
      return buildResult(records, fallback.id, true);
    }
  } catch (err) {
    logProviderFailure(fallback.id, err);
  }

  const stale = serverCacheGetStale<MandiPriceRecord[]>(key);
  if (stale && stale.data.length > 0) {
    return buildResult(stale.data, stale.data[0]?.provider ?? "cache", true);
  }

  return {
    records: [],
    marketsReporting: 0,
    provider: "none",
    isFallback: false,
    gapReason:
      "No price data available from Agmarknet or CEDA right now, and nothing cached for this commodity/market.",
  };
}

function buildResult(
  records: MandiPriceRecord[],
  provider: string,
  isFallback: boolean
): PriceQueryResult {
  const markets = new Set(records.map((r) => r.market));
  return {
    records,
    marketsReporting: markets.size,
    provider,
    isFallback,
  };
}

function logProviderFailure(providerId: string, err: unknown): void {
  const message = err instanceof PriceProviderError ? err.message : String(err);
  console.warn(`[prices] provider ${providerId} failed: ${message}`);
}

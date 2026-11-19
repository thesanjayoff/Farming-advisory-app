"use client";

import { useEffect, useState } from "react";
import type { PriceQueryResult } from "@/lib/prices/types";
import { getCache, setCache } from "@/lib/db/client";

export function priceCacheKey(commodity: string, state = "Tamil Nadu", district?: string): string {
  return `clientPrices:${commodity}:${state}:${district ?? ""}`;
}

export function usePrices(commodity: string | null, district?: string): {
  result: PriceQueryResult | null;
  loading: boolean;
} {
  const [result, setResult] = useState<PriceQueryResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!commodity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting derived fetch state when the param clears
      setResult(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const key = priceCacheKey(commodity, "Tamil Nadu", district);
    const params = new URLSearchParams({ commodity, state: "Tamil Nadu" });
    if (district) params.set("district", district);

    (async () => {
      try {
        const res = await fetch(`/api/prices?${params.toString()}`);
        const json: PriceQueryResult = await res.json();
        if (cancelled) return;
        if (json.records.length > 0) {
          await setCache(key, json);
          setResult(json);
        } else {
          // A real gap (no provider configured, or both providers empty) —
          // fall back to this device's own cache (e.g. demo-seeded sample
          // data) before giving up, but never invent a price ourselves.
          const cached = await getCache<PriceQueryResult>(key);
          setResult(cached?.data ?? json);
        }
      } catch {
        // Network failure (offline) or the API route itself failed.
        const cached = await getCache<PriceQueryResult>(key);
        if (cancelled) return;
        setResult(
          cached?.data ?? {
            records: [],
            marketsReporting: 0,
            provider: "none",
            isFallback: false,
            gapReason: "Offline, and nothing cached yet for this commodity.",
          }
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commodity, district]);

  return { result, loading };
}

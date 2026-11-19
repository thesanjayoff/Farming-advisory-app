"use client";

import { useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/types";
import type { ForecastResult } from "@/lib/weather/types";
import { locationCacheKey } from "@/lib/weather/location";
import { getCache, setCache } from "@/lib/db/client";

export interface WeatherState {
  forecast: ForecastResult | null;
  loading: boolean;
  stale: boolean;
  ageMs: number | null;
  error: string | null;
}

export function useWeather(point: GeoPoint | null): WeatherState {
  const [state, setState] = useState<WeatherState>({
    forecast: null,
    loading: true,
    stale: false,
    ageMs: null,
    error: null,
  });

  useEffect(() => {
    if (!point) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting derived fetch state when the param clears
      setState({ forecast: null, loading: false, stale: false, ageMs: null, error: "no_location" });
      return;
    }

    const key = `weather:${locationCacheKey(point)}`;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/weather?lat=${point.lat}&lon=${point.lon}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? "weather_unavailable");
        await setCache(key, json.forecast);
        setState({
          forecast: json.forecast,
          loading: false,
          stale: Boolean(json.stale),
          ageMs: json.cacheAgeMs ?? 0,
          error: null,
        });
      } catch {
        // Network failure (likely offline): fall back to the device's own
        // IndexedDB cache from the last successful fetch, showing its age
        // honestly instead of pretending this is fresh.
        const cached = await getCache<ForecastResult>(key);
        if (cancelled) return;
        if (cached) {
          setState({
            forecast: cached.data,
            loading: false,
            stale: true,
            ageMs: Date.now() - new Date(cached.storedAt).getTime(),
            error: null,
          });
        } else {
          setState({ forecast: null, loading: false, stale: false, ageMs: null, error: "offline_no_cache" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally depending on the primitive lat/lon rather than the
    // `point` object reference, so a new-but-equal object from the caller
    // doesn't trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.lat, point?.lon]);

  return state;
}

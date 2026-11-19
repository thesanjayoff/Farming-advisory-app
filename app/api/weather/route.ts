import { NextRequest, NextResponse } from "next/server";
import { OpenMeteoProvider } from "@/lib/weather/openMeteo";
import { locationCacheKey } from "@/lib/weather/location";
import { serverCacheGet, serverCacheGetStale, serverCacheSet } from "@/lib/weather/serverCache";
import type { ForecastResult } from "@/lib/weather/types";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — Open-Meteo forecasts update a few times a day

const provider = new OpenMeteoProvider();

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat and lon query params are required numbers" }, { status: 400 });
  }

  const point = { lat, lon };
  const key = `weather:${locationCacheKey(point)}`;

  const cached = serverCacheGet<ForecastResult>(key, CACHE_TTL_MS);
  if (cached) {
    return NextResponse.json({ forecast: cached, stale: false, cacheAgeMs: 0 });
  }

  try {
    const forecast = await provider.fetchForecast(point);
    serverCacheSet(key, forecast);
    return NextResponse.json({ forecast, stale: false, cacheAgeMs: 0 });
  } catch (err) {
    const stale = serverCacheGetStale<ForecastResult>(key);
    if (stale) {
      return NextResponse.json({
        forecast: stale.data,
        stale: true,
        cacheAgeMs: Date.now() - stale.storedAt,
      });
    }
    return NextResponse.json(
      { error: "Weather provider unavailable and nothing cached for this location", detail: String(err) },
      { status: 503 }
    );
  }
}

import type { GeoPoint } from "@/lib/types";

/**
 * Rounds a GPS point to ~1.1km precision (2 decimal places). This both:
 *  - lets many nearby farms share one upstream Open-Meteo request (fair use), and
 *  - keeps exact farm locations from ever leaving the device (privacy principle).
 */
export function roundLocation(point: GeoPoint, decimals = 2): GeoPoint {
  const factor = 10 ** decimals;
  return {
    lat: Math.round(point.lat * factor) / factor,
    lon: Math.round(point.lon * factor) / factor,
  };
}

export function locationCacheKey(point: GeoPoint, decimals = 2): string {
  const rounded = roundLocation(point, decimals);
  return `${rounded.lat.toFixed(decimals)},${rounded.lon.toFixed(decimals)}`;
}

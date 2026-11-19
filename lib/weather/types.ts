import type { GeoPoint } from "@/lib/types";

export interface DailyForecastDay {
  date: string; // ISO date (local)
  tempMinC: number;
  tempMaxC: number;
  precipitationSumMm: number;
  precipitationProbabilityMaxPercent: number | null;
  windSpeedMaxKmh: number;
  windGustMaxKmh: number | null;
  relativeHumidityMeanPercent: number | null;
  et0Mm: number | null; // FAO-56 reference evapotranspiration
  soilMoisture0to7cm: number | null; // m3/m3
  soilTemp0to7cmC: number | null;
}

export interface HourlyForecastHour {
  time: string; // ISO datetime
  precipitationMm: number;
  precipitationProbabilityPercent: number | null;
  windSpeedKmh: number;
  tempC: number;
}

export interface ForecastResult {
  location: GeoPoint; // rounded location actually queried
  daily: DailyForecastDay[];
  hourly: HourlyForecastHour[];
  timezone: string;
  provider: string;
  sourceUrl: string;
  licence: string;
  retrievedAt: string; // ISO datetime this forecast was fetched
}

export interface WeatherProvider {
  readonly id: string;
  readonly displayName: string;
  readonly sourceUrl: string;
  readonly licence: string;
  fetchForecast(point: GeoPoint): Promise<ForecastResult>;
}

export class WeatherProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "WeatherProviderError";
  }
}

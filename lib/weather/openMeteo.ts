import type { GeoPoint } from "@/lib/types";
import { roundLocation } from "@/lib/weather/location";
import type {
  DailyForecastDay,
  ForecastResult,
  HourlyForecastHour,
  WeatherProvider,
} from "@/lib/weather/types";
import { WeatherProviderError } from "@/lib/weather/types";

const DAILY_VARS = [
  "temperature_2m_min",
  "temperature_2m_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "relative_humidity_2m_mean",
  "et0_fao_evapotranspiration",
].join(",");

const HOURLY_VARS = [
  "precipitation",
  "precipitation_probability",
  "wind_speed_10m",
  "temperature_2m",
  "soil_moisture_0_to_7cm",
  "soil_temperature_0_to_7cm",
].join(",");

interface OpenMeteoResponse {
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: (number | null)[];
    relative_humidity_2m_mean: (number | null)[];
    et0_fao_evapotranspiration: (number | null)[];
  };
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: (number | null)[];
    wind_speed_10m: number[];
    temperature_2m: number[];
    soil_moisture_0_to_7cm: (number | null)[];
    soil_temperature_0_to_7cm: (number | null)[];
  };
}

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const SOURCE_URL = "https://open-meteo.com/";
const LICENCE = "CC BY 4.0 — Open-Meteo.com";

export class OpenMeteoProvider implements WeatherProvider {
  readonly id = "open-meteo";
  readonly displayName = "Open-Meteo";
  readonly sourceUrl = SOURCE_URL;
  readonly licence = LICENCE;

  async fetchForecast(point: GeoPoint): Promise<ForecastResult> {
    const rounded = roundLocation(point);
    const url = new URL(OPEN_METEO_BASE_URL);
    url.searchParams.set("latitude", rounded.lat.toString());
    url.searchParams.set("longitude", rounded.lon.toString());
    url.searchParams.set("daily", DAILY_VARS);
    url.searchParams.set("hourly", HOURLY_VARS);
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        // Open-Meteo's free tier is non-commercial; this app is a non-commercial
        // farmer advisory tool. Attribution is shown in the UI (weather_attribution).
        headers: { "User-Agent": "vayal-thunai-farming-advisory/0.1 (non-commercial)" },
      });
    } catch (err) {
      throw new WeatherProviderError(this.id, "Network error contacting Open-Meteo", err);
    }

    if (!response.ok) {
      throw new WeatherProviderError(
        this.id,
        `Open-Meteo returned HTTP ${response.status}`
      );
    }

    const json = (await response.json()) as OpenMeteoResponse;
    return this.parse(json, rounded);
  }

  private parse(json: OpenMeteoResponse, rounded: GeoPoint): ForecastResult {
    const retrievedAt = new Date().toISOString();

    const daily: DailyForecastDay[] = json.daily.time.map((date, i) => ({
      date,
      tempMinC: json.daily.temperature_2m_min[i],
      tempMaxC: json.daily.temperature_2m_max[i],
      precipitationSumMm: json.daily.precipitation_sum[i] ?? 0,
      precipitationProbabilityMaxPercent:
        json.daily.precipitation_probability_max?.[i] ?? null,
      windSpeedMaxKmh: json.daily.wind_speed_10m_max[i],
      windGustMaxKmh: json.daily.wind_gusts_10m_max?.[i] ?? null,
      relativeHumidityMeanPercent: json.daily.relative_humidity_2m_mean?.[i] ?? null,
      et0Mm: json.daily.et0_fao_evapotranspiration?.[i] ?? null,
      soilMoisture0to7cm: null, // daily soil moisture not requested; see hourly
      soilTemp0to7cmC: null,
    }));

    // Attach same-day average soil moisture/temperature from hourly data so the
    // daily rows aren't left permanently null when hourly data is present.
    const soilMoistureByDate = new Map<string, number[]>();
    const soilTempByDate = new Map<string, number[]>();
    json.hourly.time.forEach((isoTime, i) => {
      const date = isoTime.slice(0, 10);
      const moisture = json.hourly.soil_moisture_0_to_7cm?.[i];
      const temp = json.hourly.soil_temperature_0_to_7cm?.[i];
      if (moisture != null) {
        soilMoistureByDate.set(date, [...(soilMoistureByDate.get(date) ?? []), moisture]);
      }
      if (temp != null) {
        soilTempByDate.set(date, [...(soilTempByDate.get(date) ?? []), temp]);
      }
    });
    for (const day of daily) {
      const moistures = soilMoistureByDate.get(day.date);
      const temps = soilTempByDate.get(day.date);
      if (moistures?.length) {
        day.soilMoisture0to7cm = average(moistures);
      }
      if (temps?.length) {
        day.soilTemp0to7cmC = average(temps);
      }
    }

    const hourly: HourlyForecastHour[] = json.hourly.time.map((time, i) => ({
      time,
      precipitationMm: json.hourly.precipitation[i] ?? 0,
      precipitationProbabilityPercent: json.hourly.precipitation_probability?.[i] ?? null,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      tempC: json.hourly.temperature_2m[i],
    }));

    return {
      location: rounded,
      daily,
      hourly,
      timezone: json.timezone,
      provider: this.id,
      sourceUrl: this.sourceUrl,
      licence: this.licence,
      retrievedAt,
    };
  }
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

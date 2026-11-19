import type { DailyForecastDay, ForecastResult } from "@/lib/weather/types";
import type { ResolvedStage } from "@/lib/calendar/types";

// Deterministic, crop-stage-aware weather alerts. No AI model is involved in
// producing these — see principle 2 ("rules before AI"). The assistant may
// later *explain* an alert in simple Tamil, but never invent or override it.
//
// Thresholds below are common agricultural-extension heuristics, not laws of
// nature. They are deliberately conservative and documented so an agronomist
// can tune them; see README "Evaluation and limitations" for how we recommend
// checking these against real outcomes.

export type AlertCategory = "spray" | "irrigation" | "heat" | "cold" | "flood" | "harvest";
export type AlertSeverity = "info" | "warning" | "danger";

export interface WeatherAlert {
  id: string;
  dateIso: string;
  severity: AlertSeverity;
  messageKey: string; // key into lib/i18n/dictionary.ts
  category: AlertCategory;
  explanation: string;
  source: "rules-engine";
}

const WIND_SPRAY_LIMIT_KMH = 15; // standard drift-risk threshold used by agri extension advisories
const RAIN_PROBABILITY_SPRAY_LIMIT_PCT = 60;
const RAIN_SUM_SPRAY_LIMIT_MM = 5;
const HEAVY_RAIN_MM = 64.5; // IMD "heavy rain" day threshold
const IRRIGATE_SOIL_MOISTURE_LIMIT = 0.2; // m3/m3, generic loam-ish wilting-adjacent threshold
const SKIP_IRRIGATION_RAIN_MM = 20; // forecast rain over next 2 days that likely covers the ET0 deficit

function dayAlertId(category: string, date: string): string {
  return `${category}:${date}`;
}

export function generateWeatherAlerts(
  forecast: ForecastResult,
  stage: ResolvedStage | undefined
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const days = forecast.daily;

  for (let i = 0; i < Math.min(days.length, 3); i++) {
    const day = days[i];
    maybeSprayAlerts(day, stage, alerts);
    maybeHeatColdAlerts(day, stage, alerts);
    maybeFloodAlert(day, stage, alerts);
    maybeHarvestWindow(day, stage, alerts);
  }

  maybeIrrigationAlert(days, stage, alerts);

  return alerts;
}

function maybeSprayAlerts(
  day: DailyForecastDay,
  stage: ResolvedStage | undefined,
  alerts: WeatherAlert[]
): void {
  if (stage && !stage.sprayRelevant) return;

  const rainLikely =
    (day.precipitationProbabilityMaxPercent ?? 0) >= RAIN_PROBABILITY_SPRAY_LIMIT_PCT ||
    day.precipitationSumMm >= RAIN_SUM_SPRAY_LIMIT_MM;

  if (rainLikely) {
    alerts.push({
      id: dayAlertId("spray-rain", day.date),
      dateIso: day.date,
      severity: "warning",
      messageKey: "alert_no_spray_rain",
      category: "spray",
      explanation: `Forecast: ${day.precipitationSumMm.toFixed(1)}mm rain, ${
        day.precipitationProbabilityMaxPercent ?? "?"
      }% chance on ${day.date}.`,
      source: "rules-engine",
    });
  }

  if (day.windSpeedMaxKmh >= WIND_SPRAY_LIMIT_KMH) {
    alerts.push({
      id: dayAlertId("spray-wind", day.date),
      dateIso: day.date,
      severity: "warning",
      messageKey: "alert_no_spray_wind",
      category: "spray",
      explanation: `Forecast max wind ${day.windSpeedMaxKmh.toFixed(0)} km/h on ${day.date}.`,
      source: "rules-engine",
    });
  }
}

function maybeHeatColdAlerts(
  day: DailyForecastDay,
  stage: ResolvedStage | undefined,
  alerts: WeatherAlert[]
): void {
  if (!stage) return;
  if (stage.heatStressMaxC != null && day.tempMaxC >= stage.heatStressMaxC) {
    alerts.push({
      id: dayAlertId("heat", day.date),
      dateIso: day.date,
      severity: "warning",
      messageKey: "alert_heat_stress",
      category: "heat",
      explanation: `Forecast max temperature ${day.tempMaxC.toFixed(1)}°C on ${day.date}, at or above the ${stage.heatStressMaxC}°C threshold for the ${stage.nameEn} stage.`,
      source: "rules-engine",
    });
  }
  if (stage.coldStressMinC != null && day.tempMinC <= stage.coldStressMinC) {
    alerts.push({
      id: dayAlertId("cold", day.date),
      dateIso: day.date,
      severity: "warning",
      messageKey: "alert_cold_stress",
      category: "cold",
      explanation: `Forecast min temperature ${day.tempMinC.toFixed(1)}°C on ${day.date}, at or below the ${stage.coldStressMinC}°C threshold for the ${stage.nameEn} stage.`,
      source: "rules-engine",
    });
  }
}

function maybeFloodAlert(
  day: DailyForecastDay,
  stage: ResolvedStage | undefined,
  alerts: WeatherAlert[]
): void {
  const heavy = day.precipitationSumMm >= HEAVY_RAIN_MM;
  if (!heavy) return;
  alerts.push({
    id: dayAlertId("flood", day.date),
    dateIso: day.date,
    severity: stage?.floodSensitive ? "danger" : "warning",
    messageKey: "alert_flood_risk",
    category: "flood",
    explanation: `Forecast heavy rain ${day.precipitationSumMm.toFixed(1)}mm on ${day.date}${
      stage?.floodSensitive ? ` during the flood-sensitive ${stage.nameEn} stage` : ""
    }.`,
    source: "rules-engine",
  });
}

function maybeHarvestWindow(
  day: DailyForecastDay,
  stage: ResolvedStage | undefined,
  alerts: WeatherAlert[]
): void {
  if (!stage || !stage.id.includes("harvest")) return;
  const dry = day.precipitationSumMm < 2;
  alerts.push({
    id: dayAlertId("harvest", day.date),
    dateIso: day.date,
    severity: "info",
    messageKey: dry ? "alert_harvest_window_good" : "alert_harvest_window_bad",
    category: "harvest",
    explanation: dry
      ? `Low rain forecast (${day.precipitationSumMm.toFixed(1)}mm) on ${day.date} — suitable for harvest/drying.`
      : `Rain forecast (${day.precipitationSumMm.toFixed(1)}mm) on ${day.date} — not ideal for harvest/drying.`,
    source: "rules-engine",
  });
}

function maybeIrrigationAlert(
  days: DailyForecastDay[],
  stage: ResolvedStage | undefined,
  alerts: WeatherAlert[]
): void {
  const horizon = days.slice(0, 3);
  if (horizon.length === 0) return;

  const totalRain = horizon.reduce((sum, d) => sum + d.precipitationSumMm, 0);
  const totalEt0 = horizon.reduce((sum, d) => sum + (d.et0Mm ?? 0), 0);
  const latestSoilMoisture = [...horizon].reverse().find((d) => d.soilMoisture0to7cm != null)
    ?.soilMoisture0to7cm;

  const date = horizon[0].date;

  if (totalRain >= SKIP_IRRIGATION_RAIN_MM) {
    alerts.push({
      id: dayAlertId("irrigation-skip", date),
      dateIso: date,
      severity: "info",
      messageKey: "alert_irrigate_skip",
      category: "irrigation",
      explanation: `Forecast rain over next ${horizon.length} days totals ${totalRain.toFixed(1)}mm, likely enough for now.`,
      source: "rules-engine",
    });
    return;
  }

  const moistureLow =
    latestSoilMoisture != null && latestSoilMoisture <= IRRIGATE_SOIL_MOISTURE_LIMIT;
  const deficitLikely = totalEt0 > 0 && totalRain < totalEt0 * 0.5;

  if (moistureLow || (deficitLikely && stage && stage.sprayRelevant)) {
    alerts.push({
      id: dayAlertId("irrigation-now", date),
      dateIso: date,
      severity: "warning",
      messageKey: "alert_irrigate_now",
      category: "irrigation",
      explanation: moistureLow
        ? `Soil moisture (0-7cm) is low at ${(latestSoilMoisture! * 100).toFixed(0)}% by volume.`
        : `Forecast rain (${totalRain.toFixed(1)}mm) is well below reference evapotranspiration (${totalEt0.toFixed(1)}mm) over the next ${horizon.length} days.`,
      source: "rules-engine",
    });
  }
}

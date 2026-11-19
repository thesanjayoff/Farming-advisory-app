import { describe, expect, it } from "vitest";
import { generateWeatherAlerts } from "@/lib/rules/alerts";
import type { ForecastResult, DailyForecastDay } from "@/lib/weather/types";
import type { ResolvedStage } from "@/lib/calendar/types";

function makeDay(overrides: Partial<DailyForecastDay> = {}): DailyForecastDay {
  return {
    date: "2026-11-20",
    tempMinC: 22,
    tempMaxC: 30,
    precipitationSumMm: 0,
    precipitationProbabilityMaxPercent: 10,
    windSpeedMaxKmh: 8,
    windGustMaxKmh: 12,
    relativeHumidityMeanPercent: 60,
    et0Mm: 4,
    soilMoisture0to7cm: 0.3,
    soilTemp0to7cmC: 26,
    ...overrides,
  };
}

function makeForecast(days: DailyForecastDay[]): ForecastResult {
  return {
    location: { lat: 11, lon: 78 },
    daily: days,
    hourly: [],
    timezone: "Asia/Kolkata",
    provider: "open-meteo",
    sourceUrl: "https://open-meteo.com/",
    licence: "CC BY 4.0",
    retrievedAt: new Date().toISOString(),
  };
}

const vegetativeStage: ResolvedStage = {
  id: "vegetative",
  nameEn: "Vegetative",
  nameTa: "வளர்ச்சி நிலை",
  startDay: 10,
  endDay: 40,
  floodSensitive: false,
  sprayRelevant: true,
  dayFromSowing: 20,
};

describe("generateWeatherAlerts — spray rules", () => {
  it("flags no-spray when rain probability is high", () => {
    const forecast = makeForecast([
      makeDay({ precipitationProbabilityMaxPercent: 80, precipitationSumMm: 1 }),
    ]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.messageKey === "alert_no_spray_rain")).toBe(true);
  });

  it("flags no-spray when wind is high", () => {
    const forecast = makeForecast([makeDay({ windSpeedMaxKmh: 25 })]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.messageKey === "alert_no_spray_wind")).toBe(true);
  });

  it("does not flag spray alerts on calm, dry days", () => {
    const forecast = makeForecast([makeDay()]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.category === "spray")).toBe(false);
  });

  it("does not flag spray alerts when the crop stage says spraying isn't relevant", () => {
    const harvestStage: ResolvedStage = { ...vegetativeStage, id: "harvest", sprayRelevant: false };
    const forecast = makeForecast([makeDay({ windSpeedMaxKmh: 30, precipitationProbabilityMaxPercent: 90 })]);
    const alerts = generateWeatherAlerts(forecast, harvestStage);
    expect(alerts.some((a) => a.category === "spray")).toBe(false);
  });
});

describe("generateWeatherAlerts — heat / cold stress", () => {
  it("flags heat stress above the stage threshold", () => {
    const stage: ResolvedStage = { ...vegetativeStage, heatStressMaxC: 35 };
    const forecast = makeForecast([makeDay({ tempMaxC: 37 })]);
    const alerts = generateWeatherAlerts(forecast, stage);
    expect(alerts.some((a) => a.messageKey === "alert_heat_stress")).toBe(true);
  });

  it("does not flag heat stress below the threshold", () => {
    const stage: ResolvedStage = { ...vegetativeStage, heatStressMaxC: 38 };
    const forecast = makeForecast([makeDay({ tempMaxC: 32 })]);
    const alerts = generateWeatherAlerts(forecast, stage);
    expect(alerts.some((a) => a.messageKey === "alert_heat_stress")).toBe(false);
  });

  it("flags cold stress below the stage threshold", () => {
    const stage: ResolvedStage = { ...vegetativeStage, coldStressMinC: 15 };
    const forecast = makeForecast([makeDay({ tempMinC: 12 })]);
    const alerts = generateWeatherAlerts(forecast, stage);
    expect(alerts.some((a) => a.messageKey === "alert_cold_stress")).toBe(true);
  });
});

describe("generateWeatherAlerts — flood risk", () => {
  it("flags flood risk on heavy rain, with danger severity in a flood-sensitive stage", () => {
    const stage: ResolvedStage = { ...vegetativeStage, floodSensitive: true };
    const forecast = makeForecast([makeDay({ precipitationSumMm: 90 })]);
    const alerts = generateWeatherAlerts(forecast, stage);
    const flood = alerts.find((a) => a.category === "flood");
    expect(flood).toBeDefined();
    expect(flood?.severity).toBe("danger");
  });

  it("does not flag flood risk for ordinary rain", () => {
    const forecast = makeForecast([makeDay({ precipitationSumMm: 10 })]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.category === "flood")).toBe(false);
  });
});

describe("generateWeatherAlerts — irrigation", () => {
  it("recommends skipping irrigation after enough forecast rain", () => {
    const forecast = makeForecast([
      makeDay({ precipitationSumMm: 15, et0Mm: 4 }),
      makeDay({ precipitationSumMm: 10, et0Mm: 4 }),
      makeDay({ precipitationSumMm: 0, et0Mm: 4 }),
    ]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.messageKey === "alert_irrigate_skip")).toBe(true);
  });

  it("recommends irrigation when soil moisture is low and rain is scarce", () => {
    const forecast = makeForecast([
      makeDay({ precipitationSumMm: 0, et0Mm: 5, soilMoisture0to7cm: 0.1 }),
      makeDay({ precipitationSumMm: 0, et0Mm: 5, soilMoisture0to7cm: 0.1 }),
      makeDay({ precipitationSumMm: 0, et0Mm: 5, soilMoisture0to7cm: 0.1 }),
    ]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.messageKey === "alert_irrigate_now")).toBe(true);
  });

  it("does not demand irrigation when moisture and rain are both adequate", () => {
    const forecast = makeForecast([
      makeDay({ precipitationSumMm: 3, et0Mm: 4, soilMoisture0to7cm: 0.35 }),
      makeDay({ precipitationSumMm: 3, et0Mm: 4, soilMoisture0to7cm: 0.35 }),
      makeDay({ precipitationSumMm: 3, et0Mm: 4, soilMoisture0to7cm: 0.35 }),
    ]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.category === "irrigation")).toBe(false);
  });
});

describe("generateWeatherAlerts — harvest window", () => {
  const harvestStage: ResolvedStage = { ...vegetativeStage, id: "harvest", sprayRelevant: false };

  it("flags a good harvest window on a dry day", () => {
    const forecast = makeForecast([makeDay({ precipitationSumMm: 0 })]);
    const alerts = generateWeatherAlerts(forecast, harvestStage);
    expect(alerts.some((a) => a.messageKey === "alert_harvest_window_good")).toBe(true);
  });

  it("flags a poor harvest window on a rainy day", () => {
    const forecast = makeForecast([makeDay({ precipitationSumMm: 20 })]);
    const alerts = generateWeatherAlerts(forecast, harvestStage);
    expect(alerts.some((a) => a.messageKey === "alert_harvest_window_bad")).toBe(true);
  });

  it("only raises harvest-window alerts during a harvest stage", () => {
    const forecast = makeForecast([makeDay({ precipitationSumMm: 0 })]);
    const alerts = generateWeatherAlerts(forecast, vegetativeStage);
    expect(alerts.some((a) => a.category === "harvest")).toBe(false);
  });
});

describe("generateWeatherAlerts — missing crop stage", () => {
  it("still returns spray/flood alerts when stage is undefined (unknown crop)", () => {
    const forecast = makeForecast([
      makeDay({ precipitationProbabilityMaxPercent: 90, precipitationSumMm: 70 }),
    ]);
    const alerts = generateWeatherAlerts(forecast, undefined);
    expect(alerts.some((a) => a.category === "spray")).toBe(true);
    expect(alerts.some((a) => a.category === "flood")).toBe(true);
  });
});

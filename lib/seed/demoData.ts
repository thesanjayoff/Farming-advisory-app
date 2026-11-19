"use client";

import { saveFarm, setCache } from "@/lib/db/client";
import { newPlot } from "@/lib/hooks/useFarmProfile";
import { priceCacheKey } from "@/lib/hooks/usePrices";
import type { FarmProfile } from "@/lib/types";
import type { MandiPriceRecord, PriceQueryResult } from "@/lib/prices/types";

// "Seed demo data" per the project brief: two sample farms (paddy + tomato)
// and a couple of cached price entries, so the app has something to show on
// first run without forcing a real farmer's onboarding flow. This is opt-in
// (a button on the empty-state home screen), never automatic, and every
// seeded price record is clearly labelled provider "demo-seed" so it can
// never be mistaken for a real, current mandi price (principle 1).

function id(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function seedDemoData(): Promise<void> {
  const now = new Date().toISOString();

  const paddyFarm: FarmProfile = {
    id: id(),
    farmerName: "Murugan (demo)",
    languagePreference: "ta",
    createdAt: now,
    updatedAt: now,
    backupEnabled: false,
    plots: [],
  };
  const paddyPlot = newPlot({
    name: "Thanjavur paddy plot (demo)",
    location: { lat: 10.787, lon: 79.137 },
    locationLabel: "Thanjavur",
    areaAcres: 2,
    soilType: "alluvial",
    irrigationSource: "canal",
  });
  paddyPlot.crops.push({
    id: id(),
    cropId: "paddy",
    sowingDate: daysAgoIso(30),
  });
  paddyFarm.plots.push(paddyPlot);

  const tomatoFarm: FarmProfile = {
    id: id(),
    farmerName: "Lakshmi (demo)",
    languagePreference: "ta",
    createdAt: now,
    updatedAt: now,
    backupEnabled: false,
    plots: [],
  };
  const tomatoPlot = newPlot({
    name: "Dindigul tomato plot (demo)",
    location: { lat: 10.365, lon: 77.98 },
    locationLabel: "Dindigul",
    areaAcres: 1,
    soilType: "red",
    irrigationSource: "drip",
  });
  tomatoPlot.crops.push({
    id: id(),
    cropId: "tomato",
    sowingDate: daysAgoIso(20),
  });
  tomatoFarm.plots.push(tomatoPlot);

  await saveFarm(paddyFarm);
  await saveFarm(tomatoFarm);

  await seedDemoPrices();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function seedDemoPrices(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const records: MandiPriceRecord[] = [
    {
      commodity: "Tomato",
      state: "Tamil Nadu",
      district: "Dindigul",
      market: "Oddanchatram (demo)",
      minPriceInrPerQuintal: 1200,
      maxPriceInrPerQuintal: 1800,
      modalPriceInrPerQuintal: 1500,
      arrivalQuantityQuintal: 320,
      priceDate: today,
      provider: "demo-seed",
      sourceUrl: "https://agmarknet.gov.in/",
      retrievedAt: new Date().toISOString(),
    },
    {
      commodity: "Paddy(Dhan)(Common)",
      state: "Tamil Nadu",
      district: "Thanjavur",
      market: "Thanjavur (demo)",
      minPriceInrPerQuintal: 1900,
      maxPriceInrPerQuintal: 2100,
      modalPriceInrPerQuintal: 2000,
      arrivalQuantityQuintal: 540,
      priceDate: today,
      provider: "demo-seed",
      sourceUrl: "https://agmarknet.gov.in/",
      retrievedAt: new Date().toISOString(),
    },
  ];
  // Seeded into the exact client-side cache key usePrices() falls back to on
  // a fetch failure/gap, so demo mode shows something without a live API key
  // — clearly tagged provider "demo-seed" so the UI can label it as sample
  // data rather than a real current price (principle 1).
  for (const commodity of ["Tomato", "Paddy(Dhan)(Common)"]) {
    const matching = records.filter((r) => r.commodity === commodity);
    const result: PriceQueryResult = {
      records: matching,
      marketsReporting: matching.length,
      provider: "demo-seed",
      isFallback: false,
    };
    await setCache(priceCacheKey(commodity, "Tamil Nadu"), result);
  }
}

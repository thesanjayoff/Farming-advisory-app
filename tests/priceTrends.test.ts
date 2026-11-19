import { describe, expect, it } from "vitest";
import {
  averageModalPrice,
  computeTransportNet,
  labelVsAverage,
  toDailySeries,
} from "@/lib/prices/trends";
import type { MandiPriceRecord } from "@/lib/prices/types";

function rec(overrides: Partial<MandiPriceRecord> = {}): MandiPriceRecord {
  return {
    commodity: "Tomato",
    state: "Tamil Nadu",
    market: "Koyambedu",
    minPriceInrPerQuintal: 1000,
    maxPriceInrPerQuintal: 1400,
    modalPriceInrPerQuintal: 1200,
    priceDate: "2026-11-18",
    provider: "agmarknet",
    sourceUrl: "https://agmarknet.gov.in/",
    retrievedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("averageModalPrice", () => {
  it("averages modal prices across records", () => {
    const records = [rec({ modalPriceInrPerQuintal: 1000 }), rec({ modalPriceInrPerQuintal: 2000 })];
    expect(averageModalPrice(records)).toBe(1500);
  });

  it("returns null (a gap) for an empty record set, never zero", () => {
    expect(averageModalPrice([])).toBeNull();
  });
});

describe("labelVsAverage", () => {
  it("labels a clearly higher price as above average", () => {
    expect(labelVsAverage(1300, 1000)).toBe("above_average");
  });

  it("labels a clearly lower price as below average", () => {
    expect(labelVsAverage(700, 1000)).toBe("below_average");
  });

  it("labels a price within the near-average band as near average", () => {
    expect(labelVsAverage(1030, 1000)).toBe("near_average");
  });
});

describe("toDailySeries", () => {
  it("averages multiple markets on the same day into one point, and never fabricates missing days", () => {
    const records = [
      rec({ priceDate: "2026-11-18", modalPriceInrPerQuintal: 1000, market: "Koyambedu" }),
      rec({ priceDate: "2026-11-18", modalPriceInrPerQuintal: 1200, market: "Oddanchatram" }),
      rec({ priceDate: "2026-11-20", modalPriceInrPerQuintal: 1500, market: "Koyambedu" }),
    ];
    const series = toDailySeries(records);
    expect(series).toHaveLength(2); // only 2 distinct dates present — no interpolated gap day
    expect(series[0]).toEqual({ date: "2026-11-18", modalPriceInrPerQuintal: 1100 });
    expect(series[1]).toEqual({ date: "2026-11-20", modalPriceInrPerQuintal: 1500 });
  });
});

describe("computeTransportNet", () => {
  it("nets out transport cost correctly", () => {
    const result = computeTransportNet({
      mandiPriceInrPerQuintal: 2000,
      distanceKm: 20,
      transportCostInrPerQuintalPerKm: 2,
      quintals: 10,
    });
    expect(result.grossRevenueInr).toBe(20000);
    expect(result.transportCostInr).toBe(400);
    expect(result.netRevenueInr).toBe(19600);
    expect(result.netPriceInrPerQuintal).toBe(1960);
  });

  it("includes extra fees in the transport cost", () => {
    const result = computeTransportNet({
      mandiPriceInrPerQuintal: 2000,
      distanceKm: 10,
      transportCostInrPerQuintalPerKm: 1,
      quintals: 5,
      otherFeesInr: 100,
    });
    // 10*1*5 = 50 + 100 fees = 150
    expect(result.transportCostInr).toBe(150);
    expect(result.netRevenueInr).toBe(10000 - 150);
  });
});

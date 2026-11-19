import { describe, expect, it } from "vitest";
import { evaluatePriceAlerts } from "@/lib/prices/priceAlertEngine";
import type { PriceAlertRule } from "@/lib/types";
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

function rule(overrides: Partial<PriceAlertRule> = {}): PriceAlertRule {
  return {
    id: "r1",
    commodity: "Tomato",
    direction: "above",
    priceInrPerQuintal: 1500,
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("evaluatePriceAlerts", () => {
  it("triggers an 'above' alert when the modal price crosses the threshold", () => {
    const triggered = evaluatePriceAlerts([rule({ priceInrPerQuintal: 1500 })], [
      rec({ modalPriceInrPerQuintal: 1600 }),
    ]);
    expect(triggered).toHaveLength(1);
  });

  it("does not trigger when the price is below an 'above' threshold", () => {
    const triggered = evaluatePriceAlerts([rule({ priceInrPerQuintal: 1500 })], [
      rec({ modalPriceInrPerQuintal: 1200 }),
    ]);
    expect(triggered).toHaveLength(0);
  });

  it("triggers a 'below' alert when the modal price drops to or past the threshold", () => {
    const triggered = evaluatePriceAlerts(
      [rule({ direction: "below", priceInrPerQuintal: 1000 })],
      [rec({ modalPriceInrPerQuintal: 950 })]
    );
    expect(triggered).toHaveLength(1);
  });

  it("ignores inactive rules", () => {
    const triggered = evaluatePriceAlerts(
      [rule({ active: false, priceInrPerQuintal: 1000 })],
      [rec({ modalPriceInrPerQuintal: 5000 })]
    );
    expect(triggered).toHaveLength(0);
  });

  it("only matches the specified mandi when mandiName is set", () => {
    const triggered = evaluatePriceAlerts(
      [rule({ mandiName: "Oddanchatram", priceInrPerQuintal: 1000 })],
      [rec({ market: "Koyambedu", modalPriceInrPerQuintal: 2000 })]
    );
    expect(triggered).toHaveLength(0);
  });

  it("is case-insensitive on commodity and mandi name", () => {
    const triggered = evaluatePriceAlerts(
      [rule({ commodity: "tomato", priceInrPerQuintal: 1000 })],
      [rec({ commodity: "TOMATO", modalPriceInrPerQuintal: 2000 })]
    );
    expect(triggered).toHaveLength(1);
  });
});

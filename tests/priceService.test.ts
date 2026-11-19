import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMandiPrices } from "@/lib/prices/service";
import type { MandiPriceRecord, PriceProvider, PriceQuery } from "@/lib/prices/types";

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

class FakeProvider implements PriceProvider {
  readonly id: string;
  readonly displayName: string;
  readonly sourceUrl = "https://example.test/";
  private readonly impl: (q: PriceQuery) => Promise<MandiPriceRecord[]>;

  constructor(id: string, impl: (q: PriceQuery) => Promise<MandiPriceRecord[]>) {
    this.id = id;
    this.displayName = id;
    this.impl = impl;
  }

  fetchPrices(query: PriceQuery): Promise<MandiPriceRecord[]> {
    return this.impl(query);
  }
}

const query: PriceQuery = { commodity: `TestCommodity-${Math.random()}` };

describe("getMandiPrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns primary provider data when it succeeds", async () => {
    const primary = new FakeProvider("primary", async () => [rec({ provider: "primary" })]);
    const fallback = new FakeProvider("fallback", async () => [rec({ provider: "fallback" })]);
    const result = await getMandiPrices({ ...query, commodity: `c-${Math.random()}` }, {
      primary: primary as never,
      fallback: fallback as never,
    });
    expect(result.provider).toBe("primary");
    expect(result.isFallback).toBe(false);
  });

  it("falls back to the secondary provider when the primary throws", async () => {
    const primary = new FakeProvider("primary", async () => {
      throw new Error("boom");
    });
    const fallback = new FakeProvider("fallback", async () => [rec({ provider: "fallback" })]);
    const result = await getMandiPrices({ ...query, commodity: `c-${Math.random()}` }, {
      primary: primary as never,
      fallback: fallback as never,
    });
    expect(result.provider).toBe("fallback");
    expect(result.isFallback).toBe(true);
  });

  it("falls back to the secondary provider when the primary returns no records", async () => {
    const primary = new FakeProvider("primary", async () => []);
    const fallback = new FakeProvider("fallback", async () => [rec({ provider: "fallback" })]);
    const result = await getMandiPrices({ ...query, commodity: `c-${Math.random()}` }, {
      primary: primary as never,
      fallback: fallback as never,
    });
    expect(result.provider).toBe("fallback");
  });

  it("reports a gap (never a fabricated zero) when every provider fails and there is no cache", async () => {
    const primary = new FakeProvider("primary", async () => {
      throw new Error("down");
    });
    const fallback = new FakeProvider("fallback", async () => {
      throw new Error("down too");
    });
    const result = await getMandiPrices({ ...query, commodity: `c-${Math.random()}` }, {
      primary: primary as never,
      fallback: fallback as never,
    });
    expect(result.records).toEqual([]);
    expect(result.gapReason).toBeTruthy();
  });

  it("serves from cache on a repeat query without calling providers again", async () => {
    const commodity = `c-${Math.random()}`;
    const primaryFn = vi.fn(async () => [rec({ provider: "primary" })]);
    const primary = new FakeProvider("primary", primaryFn);
    const fallback = new FakeProvider("fallback", async () => []);

    await getMandiPrices({ ...query, commodity }, { primary: primary as never, fallback: fallback as never });
    const second = await getMandiPrices(
      { ...query, commodity },
      { primary: primary as never, fallback: fallback as never }
    );

    expect(primaryFn).toHaveBeenCalledTimes(1); // second call served from cache
    expect(second.records.length).toBeGreaterThan(0);
  });
});

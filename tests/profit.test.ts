import { describe, expect, it } from "vitest";
import { computeProfitSummary } from "@/lib/diary/profit";
import type { DiaryEntry } from "@/lib/types";

function entry(overrides: Partial<DiaryEntry>): DiaryEntry {
  return {
    id: `e-${Math.random()}`,
    plotId: "p1",
    date: "2026-11-01",
    type: "expense",
    description: "test",
    createdAt: new Date().toISOString(),
    synced: false,
    ...overrides,
  };
}

describe("computeProfitSummary", () => {
  it("sums expenses, inputs and labor as cost against sales as revenue", () => {
    const entries = [
      entry({ type: "expense", amountInr: 1000 }),
      entry({ type: "input", amountInr: 500 }),
      entry({ type: "labor", amountInr: 800 }),
      entry({ type: "sale", amountInr: 5000 }),
    ];
    const summary = computeProfitSummary(entries);
    expect(summary.totalExpensesInr).toBe(1500);
    expect(summary.totalLaborInr).toBe(800);
    expect(summary.totalSalesInr).toBe(5000);
    expect(summary.netProfitInr).toBe(5000 - 1500 - 800);
  });

  it("aggregates yield entries by unit without affecting money totals", () => {
    const entries = [
      entry({ type: "yield", quantity: 10, unit: "quintal" }),
      entry({ type: "yield", quantity: 5, unit: "quintal" }),
      entry({ type: "yield", quantity: 2, unit: "bunch" }),
    ];
    const summary = computeProfitSummary(entries);
    expect(summary.totalYieldQuantity).toEqual(
      expect.arrayContaining([
        { unit: "quintal", quantity: 15 },
        { unit: "bunch", quantity: 2 },
      ])
    );
    expect(summary.netProfitInr).toBe(0);
  });

  it("treats entries with no amount as zero, not undefined errors", () => {
    const entries = [entry({ type: "note", description: "just a note" })];
    const summary = computeProfitSummary(entries);
    expect(summary.netProfitInr).toBe(0);
  });
});

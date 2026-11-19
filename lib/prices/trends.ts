import type { MandiPriceRecord } from "@/lib/prices/types";

export type TrendLabel = "above_average" | "below_average" | "near_average";

const NEAR_AVERAGE_BAND_PERCENT = 5; // within +/-5% of the recent average counts as "near"

export function averageModalPrice(records: MandiPriceRecord[]): number | null {
  if (records.length === 0) return null;
  const sum = records.reduce((acc, r) => acc + r.modalPriceInrPerQuintal, 0);
  return sum / records.length;
}

export function labelVsAverage(current: number, recentAverage: number): TrendLabel {
  const diffPercent = ((current - recentAverage) / recentAverage) * 100;
  if (Math.abs(diffPercent) <= NEAR_AVERAGE_BAND_PERCENT) return "near_average";
  return diffPercent > 0 ? "above_average" : "below_average";
}

export interface DailySeriesPoint {
  date: string;
  modalPriceInrPerQuintal: number;
}

/** Groups records by date and averages across markets reporting that day,
 * so a 7/30-day chart shows one honest point per day rather than overlapping
 * per-market noise. Days with zero records are omitted (gap), not zeroed. */
export function toDailySeries(records: MandiPriceRecord[]): DailySeriesPoint[] {
  const byDate = new Map<string, number[]>();
  for (const r of records) {
    byDate.set(r.priceDate, [...(byDate.get(r.priceDate) ?? []), r.modalPriceInrPerQuintal]);
  }
  return Array.from(byDate.entries())
    .map(([date, prices]) => ({
      date,
      modalPriceInrPerQuintal: prices.reduce((a, b) => a + b, 0) / prices.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface TransportCalcInput {
  mandiPriceInrPerQuintal: number;
  distanceKm: number;
  transportCostInrPerQuintalPerKm: number;
  quintals: number;
  otherFeesInr?: number;
}

export interface TransportCalcResult {
  grossRevenueInr: number;
  transportCostInr: number;
  netRevenueInr: number;
  netPriceInrPerQuintal: number;
}

/** Compares what a farmer nets from a given mandi once transport is paid for —
 * so two mandis with different modal prices can be compared fairly. This is
 * an estimate the farmer provides inputs for; it is not itself a price source. */
export function computeTransportNet(input: TransportCalcInput): TransportCalcResult {
  const grossRevenueInr = input.mandiPriceInrPerQuintal * input.quintals;
  const transportCostInr =
    input.distanceKm * input.transportCostInrPerQuintalPerKm * input.quintals +
    (input.otherFeesInr ?? 0);
  const netRevenueInr = grossRevenueInr - transportCostInr;
  return {
    grossRevenueInr,
    transportCostInr,
    netRevenueInr,
    netPriceInrPerQuintal: input.quintals > 0 ? netRevenueInr / input.quintals : 0,
  };
}

import type { DiaryEntry } from "@/lib/types";

export interface ProfitSummary {
  totalExpensesInr: number;
  totalLaborInr: number;
  totalSalesInr: number;
  totalYieldQuantity: { unit: string; quantity: number }[];
  netProfitInr: number;
}

const COST_TYPES: DiaryEntry["type"][] = ["expense", "input", "labor"];

export function computeProfitSummary(entries: DiaryEntry[]): ProfitSummary {
  let totalExpensesInr = 0;
  let totalLaborInr = 0;
  let totalSalesInr = 0;
  const yieldByUnit = new Map<string, number>();

  for (const entry of entries) {
    const amount = entry.amountInr ?? 0;
    if (entry.type === "labor") {
      totalLaborInr += amount;
    } else if (COST_TYPES.includes(entry.type)) {
      totalExpensesInr += amount;
    } else if (entry.type === "sale") {
      totalSalesInr += amount;
    } else if (entry.type === "yield" && entry.quantity != null) {
      const unit = entry.unit ?? "unit";
      yieldByUnit.set(unit, (yieldByUnit.get(unit) ?? 0) + entry.quantity);
    }
  }

  return {
    totalExpensesInr,
    totalLaborInr,
    totalSalesInr,
    totalYieldQuantity: Array.from(yieldByUnit.entries()).map(([unit, quantity]) => ({ unit, quantity })),
    netProfitInr: totalSalesInr - totalExpensesInr - totalLaborInr,
  };
}

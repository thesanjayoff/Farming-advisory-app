import type { PriceAlertRule } from "@/lib/types";
import type { MandiPriceRecord } from "@/lib/prices/types";

export interface TriggeredPriceAlert {
  rule: PriceAlertRule;
  record: MandiPriceRecord;
}

/** Pure function: given the farmer's active alert rules and the latest price
 * records, returns which rules are currently crossed. Deterministic — no AI
 * involved (principle 2) — so it's cheap to unit test and to run offline
 * against the last cached prices. */
export function evaluatePriceAlerts(
  rules: PriceAlertRule[],
  records: MandiPriceRecord[]
): TriggeredPriceAlert[] {
  const triggered: TriggeredPriceAlert[] = [];
  for (const rule of rules) {
    if (!rule.active) continue;
    const matching = records.filter(
      (r) =>
        r.commodity.toLowerCase() === rule.commodity.toLowerCase() &&
        (!rule.mandiName || r.market.toLowerCase() === rule.mandiName.toLowerCase())
    );
    for (const record of matching) {
      const crossed =
        rule.direction === "above"
          ? record.modalPriceInrPerQuintal >= rule.priceInrPerQuintal
          : record.modalPriceInrPerQuintal <= rule.priceInrPerQuintal;
      if (crossed) {
        triggered.push({ rule, record });
      }
    }
  }
  return triggered;
}

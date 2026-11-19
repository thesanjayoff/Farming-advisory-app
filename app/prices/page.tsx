"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { CedaAttribution } from "@/components/CedaAttribution";
import { useI18n } from "@/lib/i18n/context";
import { usePrices } from "@/lib/hooks/usePrices";
import { averageModalPrice, computeTransportNet, labelVsAverage } from "@/lib/prices/trends";
import { savePriceAlert } from "@/lib/db/client";
import type { PriceAlertRule } from "@/lib/types";

const COMMODITIES = [
  "Paddy(Dhan)(Common)", "Groundnut", "Sugarcane", "Banana", "Tomato", "Brinjal", "Chilli (dry)", "Ragi (Finger Millet)", "Bajra(Pearl Millet/Cumbu)", "Onion", "Maize",
];

const TREND_LABEL_KEY = {
  above_average: "price_above_average",
  below_average: "price_below_average",
  near_average: "price_near_average",
} as const;

export default function PricesPage() {
  const { t } = useI18n();
  const [commodity, setCommodity] = useState(COMMODITIES[0]);
  const { result, loading } = usePrices(commodity);

  const average = useMemo(() => (result ? averageModalPrice(result.records) : null), [result]);

  const [distanceKm, setDistanceKm] = useState("10");
  const [costPerKm, setCostPerKm] = useState("2");
  const [quintals, setQuintals] = useState("5");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [alertSaved, setAlertSaved] = useState(false);

  async function saveAlert() {
    const rule: PriceAlertRule = {
      id: `alert-${Date.now()}`,
      commodity,
      direction: alertDirection,
      priceInrPerQuintal: Number(alertPrice) || 0,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await savePriceAlert(rule);
    setAlertSaved(true);
  }

  return (
    <PageShell title={t("price_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <select
          value={commodity}
          onChange={(e) => {
            setCommodity(e.target.value);
            setAlertSaved(false);
          }}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3"
        >
          {COMMODITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t("price_wholesale_disclaimer")}</p>

        {loading ? (
          <p className="py-6 text-center text-neutral-500">{t("common_loading")}</p>
        ) : !result || result.records.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-600">
            {result?.gapReason ?? t("common_data_gap")}
          </p>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              {t("price_markets_reporting")}: {result.marketsReporting} · provider: {result.provider}
              {result.isFallback ? " (fallback)" : ""}
            </p>
            {result.isFallback && result.provider === "ceda" && <CedaAttribution />}
            {result.provider === "demo-seed" && (
              <p className="rounded-lg bg-blue-50 p-2 text-xs text-blue-900">
                Sample/demo data for first-run exploration — not a real current price.
              </p>
            )}

            <ul className="flex flex-col gap-2">
              {result.records.map((r, i) => {
                const trend = average ? labelVsAverage(r.modalPriceInrPerQuintal, average) : null;
                return (
                  <li key={`${r.market}-${i}`} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="font-medium">{r.market}{r.district ? `, ${r.district}` : ""}</p>
                    <p className="text-sm">
                      {t("price_modal")}: ₹{r.modalPriceInrPerQuintal}/quintal
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t("price_min")} ₹{r.minPriceInrPerQuintal} · {t("price_max")} ₹{r.maxPriceInrPerQuintal}
                    </p>
                    {r.arrivalQuantityQuintal != null && (
                      <p className="text-xs text-neutral-500">
                        {t("price_arrival")}: {r.arrivalQuantityQuintal} q
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {t("common_as_of")}: {r.priceDate} · {t("common_source")}: {r.provider}
                    </p>
                    {trend && (
                      <p className="mt-1 text-xs font-medium text-brand">{t(TREND_LABEL_KEY[trend])}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <a
          href="https://www.upag.gov.in"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand underline"
        >
          {t("price_official_link")} (UPAg)
        </a>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold">{t("price_transport_calc")}</h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <label className="flex flex-col gap-1">
              km
              <input value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="tap-target rounded border border-neutral-300 px-2" />
            </label>
            <label className="flex flex-col gap-1">
              ₹/q/km
              <input value={costPerKm} onChange={(e) => setCostPerKm(e.target.value)} className="tap-target rounded border border-neutral-300 px-2" />
            </label>
            <label className="flex flex-col gap-1">
              quintals
              <input value={quintals} onChange={(e) => setQuintals(e.target.value)} className="tap-target rounded border border-neutral-300 px-2" />
            </label>
          </div>
          {average != null && (
            <p className="mt-2 text-sm">
              Net ≈ ₹
              {computeTransportNet({
                mandiPriceInrPerQuintal: average,
                distanceKm: Number(distanceKm) || 0,
                transportCostInrPerQuintalPerKm: Number(costPerKm) || 0,
                quintals: Number(quintals) || 0,
              }).netPriceInrPerQuintal.toFixed(0)}
              /quintal after transport
            </p>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold">{t("price_set_alert")}</h2>
          <div className="flex gap-2">
            <select value={alertDirection} onChange={(e) => setAlertDirection(e.target.value as "above" | "below")} className="tap-target rounded border border-neutral-300 px-2 text-sm">
              <option value="above">above</option>
              <option value="below">below</option>
            </select>
            <input
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              placeholder="₹/quintal"
              className="tap-target flex-1 rounded border border-neutral-300 px-2"
            />
            <button onClick={saveAlert} className="tap-target rounded bg-brand px-4 text-sm font-medium text-white">
              {t("common_save")}
            </button>
          </div>
          {alertSaved && <p className="mt-1 text-xs text-green-700">✓ saved</p>}
        </section>
      </div>
    </PageShell>
  );
}

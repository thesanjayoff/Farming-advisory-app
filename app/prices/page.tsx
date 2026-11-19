"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { CedaAttribution } from "@/components/CedaAttribution";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <Select
          value={commodity}
          onValueChange={(v) => {
            if (!v) return;
            setCommodity(v);
            setAlertSaved(false);
          }}
        >
          <SelectTrigger className="tap-target w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMODITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Alert className="border-amber-300 bg-amber-50">
          <AlertDescription className="text-amber-900">{t("price_wholesale_disclaimer")}</AlertDescription>
        </Alert>

        {loading ? (
          <p className="py-6 text-center text-muted-foreground">{t("common_loading")}</p>
        ) : !result || result.records.length === 0 ? (
          <Alert>
            <AlertDescription>{result?.gapReason ?? t("common_data_gap")}</AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {t("price_markets_reporting")}: {result.marketsReporting} · provider: {result.provider}
              {result.isFallback ? " (fallback)" : ""}
            </p>
            {result.isFallback && result.provider === "ceda" && <CedaAttribution />}
            {result.provider === "demo-seed" && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-900">
                  Sample/demo data for first-run exploration — not a real current price.
                </AlertDescription>
              </Alert>
            )}

            <ul className="flex flex-col gap-2">
              {result.records.map((r, i) => {
                const trend = average ? labelVsAverage(r.modalPriceInrPerQuintal, average) : null;
                return (
                  <li key={`${r.market}-${i}`}>
                    <Card className="py-3">
                      <CardContent className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{r.market}{r.district ? `, ${r.district}` : ""}</p>
                          {trend && <Badge variant="secondary">{t(TREND_LABEL_KEY[trend])}</Badge>}
                        </div>
                        <p className="text-sm">
                          {t("price_modal")}: ₹{r.modalPriceInrPerQuintal}/quintal
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("price_min")} ₹{r.minPriceInrPerQuintal} · {t("price_max")} ₹{r.maxPriceInrPerQuintal}
                        </p>
                        {r.arrivalQuantityQuintal != null && (
                          <p className="text-xs text-muted-foreground">
                            {t("price_arrival")}: {r.arrivalQuantityQuintal} q
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t("common_as_of")}: {r.priceDate} · {t("common_source")}: {r.provider}
                        </p>
                      </CardContent>
                    </Card>
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

        <Card>
          <CardContent>
            <h2 className="mb-2 text-sm font-semibold">{t("price_transport_calc")}</h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">km</Label>
                <Input
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  inputMode="decimal"
                  className="tap-target"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">₹/q/km</Label>
                <Input
                  value={costPerKm}
                  onChange={(e) => setCostPerKm(e.target.value)}
                  inputMode="decimal"
                  className="tap-target"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">quintals</Label>
                <Input
                  value={quintals}
                  onChange={(e) => setQuintals(e.target.value)}
                  inputMode="decimal"
                  className="tap-target"
                />
              </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-2 text-sm font-semibold">{t("price_set_alert")}</h2>
            <div className="flex gap-2">
              <Select value={alertDirection} onValueChange={(v) => v && setAlertDirection(v as "above" | "below")}>
                <SelectTrigger className="tap-target w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">above</SelectItem>
                  <SelectItem value="below">below</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="₹/quintal"
                inputMode="decimal"
                className="tap-target flex-1"
              />
              <Button onClick={saveAlert}>{t("common_save")}</Button>
            </div>
            {alertSaved && <p className="mt-1 text-xs text-green-700">✓ saved</p>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

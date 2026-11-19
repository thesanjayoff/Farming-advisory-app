"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile, newPlot } from "@/lib/hooks/useFarmProfile";
import { supportedLanguages } from "@/lib/i18n/dictionary";
import type { CropId, IrrigationSource, SoilType } from "@/lib/types";
import { cropDisplayNames } from "@/lib/calendar/data";

const SOIL_TYPES: SoilType[] = [
  "red", "black", "alluvial", "laterite", "clay", "clay_loam", "sandy", "sandy_loam", "loam", "unknown",
];

const IRRIGATION_SOURCES: IrrigationSource[] = [
  "canal", "borewell", "open_well", "tank", "drip", "sprinkler", "rainfed", "other",
];

export default function OnboardingPage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const { createFarm, addPlot } = useFarmProfile();

  const [farmerName, setFarmerName] = useState("");
  const [plotName, setPlotName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [areaAcres, setAreaAcres] = useState("1");
  const [soilType, setSoilType] = useState<SoilType>("red");
  const [irrigationSource, setIrrigationSource] = useState<IrrigationSource>("borewell");
  const [cropId, setCropId] = useState<CropId>("paddy");
  const [sowingDate, setSowingDate] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today's date isn't known until the client mounts
    setSowingDate((d) => d || new Date().toISOString().slice(0, 10));
  }, []);

  function useGps() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("GPS not available on this device/browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoError("Could not get your location. You can still type your village name."),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const farm = await createFarm(farmerName || "Farmer", lang);
      const plot = newPlot({
        name: plotName || locationLabel || "Plot 1",
        location: coords ?? { lat: 11.1271, lon: 78.6569 }, // Tamil Nadu centroid fallback — shown as a gap in weather if used
        locationLabel: locationLabel || "—",
        areaAcres: Number(areaAcres) || 1,
        soilType,
        irrigationSource,
      });
      plot.crops.push({
        id: `${plot.id}-crop-1`,
        cropId,
        sowingDate,
      });
      await addPlot(plot, farm);
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title={t("onboarding_welcome")} showBack>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-8">
        <Card>
          <CardContent className="flex flex-col gap-5">
            <div>
              <Label className="mb-1">{t("onboarding_choose_language")}</Label>
              <div className="flex gap-2">
                {supportedLanguages.map((l) => (
                  <Button
                    type="button"
                    key={l.code}
                    variant={lang === l.code ? "default" : "outline"}
                    className={lang === l.code ? "bg-brand text-white hover:bg-brand/90" : ""}
                    onClick={() => setLang(l.code)}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1" htmlFor="farmerName">
                {t("onboarding_farmer_name")}
              </Label>
              <Input
                id="farmerName"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="tap-target w-full"
              />
            </div>
          </CardContent>
        </Card>

        <h2 className="-mb-1 text-base font-semibold">{t("onboarding_add_plot")}</h2>

        <Card>
          <CardContent className="flex flex-col gap-5">
        <div>
          <Label className="mb-1" htmlFor="plotName">
            {t("onboarding_plot_name")}
          </Label>
          <Input
            id="plotName"
            value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            className="tap-target w-full"
          />
        </div>

        <div>
          <Label className="mb-1" htmlFor="location">
            {t("onboarding_location")}
          </Label>
          <Input
            id="location"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder={t("onboarding_search_location")}
            className="tap-target mb-2 w-full"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full border-brand text-brand hover:bg-brand-light"
            onClick={useGps}
          >
            <MapPin className="size-4" aria-hidden />
            {t("onboarding_use_gps")}
          </Button>
          {coords && (
            <p className="mt-1 text-xs text-muted-foreground">
              {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
            </p>
          )}
          {geoError && <p className="mt-1 text-xs text-red-600">{geoError}</p>}
        </div>

        <div>
          <Label className="mb-1" htmlFor="area">
            {t("onboarding_area")}
          </Label>
          <Input
            id="area"
            type="number"
            min="0"
            step="0.1"
            value={areaAcres}
            onChange={(e) => setAreaAcres(e.target.value)}
            className="tap-target w-full"
          />
        </div>

        <div>
          <Label className="mb-1" htmlFor="soil">
            {t("onboarding_soil_type")}
          </Label>
          <Select value={soilType} onValueChange={(v) => v && setSoilType(v as SoilType)}>
            <SelectTrigger id="soil" className="tap-target w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOIL_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1" htmlFor="irrigation">
            {t("onboarding_irrigation")}
          </Label>
          <Select value={irrigationSource} onValueChange={(v) => v && setIrrigationSource(v as IrrigationSource)}>
            <SelectTrigger id="irrigation" className="tap-target w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IRRIGATION_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1" htmlFor="crop">
            {t("onboarding_crop")}
          </Label>
          <Select value={cropId} onValueChange={(v) => v && setCropId(v as CropId)}>
            <SelectTrigger id="crop" className="tap-target w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(cropDisplayNames).map(([id, names]) => (
                <SelectItem key={id} value={id}>
                  {lang === "ta" ? names.ta : names.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1" htmlFor="sowingDate">
            {t("onboarding_sowing_date")}
          </Label>
          <Input
            id="sowingDate"
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="tap-target w-full"
          />
        </div>
          </CardContent>
        </Card>

        <Button type="submit" size="touch" disabled={submitting} className="mt-2 w-full">
          {t("onboarding_finish")}
        </Button>
      </form>
    </PageShell>
  );
}

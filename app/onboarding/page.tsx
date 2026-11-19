"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
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
        <div>
          <label className="mb-1 block text-sm font-medium">{t("onboarding_choose_language")}</label>
          <div className="flex gap-2">
            {supportedLanguages.map((l) => (
              <button
                type="button"
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`tap-target rounded-lg border px-4 text-sm font-medium ${
                  lang === l.code ? "border-brand bg-brand-light" : "border-neutral-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="farmerName">
            {t("onboarding_farmer_name")}
          </label>
          <input
            id="farmerName"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          />
        </div>

        <hr className="border-neutral-200" />
        <h2 className="text-base font-semibold">{t("onboarding_add_plot")}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="plotName">
            {t("onboarding_plot_name")}
          </label>
          <input
            id="plotName"
            value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="location">
            {t("onboarding_location")}
          </label>
          <input
            id="location"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder={t("onboarding_search_location")}
            className="tap-target mb-2 w-full rounded-lg border border-neutral-300 px-3"
          />
          <button
            type="button"
            onClick={useGps}
            className="tap-target w-full rounded-lg border border-brand px-3 text-sm font-medium text-brand"
          >
            📍 {t("onboarding_use_gps")}
          </button>
          {coords && (
            <p className="mt-1 text-xs text-neutral-500">
              {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
            </p>
          )}
          {geoError && <p className="mt-1 text-xs text-red-600">{geoError}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="area">
            {t("onboarding_area")}
          </label>
          <input
            id="area"
            type="number"
            min="0"
            step="0.1"
            value={areaAcres}
            onChange={(e) => setAreaAcres(e.target.value)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="soil">
            {t("onboarding_soil_type")}
          </label>
          <select
            id="soil"
            value={soilType}
            onChange={(e) => setSoilType(e.target.value as SoilType)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          >
            {SOIL_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="irrigation">
            {t("onboarding_irrigation")}
          </label>
          <select
            id="irrigation"
            value={irrigationSource}
            onChange={(e) => setIrrigationSource(e.target.value as IrrigationSource)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          >
            {IRRIGATION_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="crop">
            {t("onboarding_crop")}
          </label>
          <select
            id="crop"
            value={cropId}
            onChange={(e) => setCropId(e.target.value as CropId)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          >
            {Object.entries(cropDisplayNames).map(([id, names]) => (
              <option key={id} value={id}>
                {lang === "ta" ? names.ta : names.en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="sowingDate">
            {t("onboarding_sowing_date")}
          </label>
          <input
            id="sowingDate"
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="tap-target w-full rounded-lg border border-neutral-300 px-3"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="tap-target mt-2 w-full rounded-xl bg-brand text-lg font-semibold text-white disabled:opacity-60"
        >
          {t("onboarding_finish")}
        </button>
      </form>
    </PageShell>
  );
}

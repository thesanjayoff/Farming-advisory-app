"use client";

import { useI18n } from "@/lib/i18n/context";

// IMD does not publish a verified, open API/licence for programmatic use
// (checked at build time — see README "Data sources and licences"), so
// rather than scrape or guess at an endpoint, this just deep-links to IMD's
// own official advisory pages, clearly labelled as official and separate
// from this app's own rule-based alerts.
export function OfficialWeatherLinks() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      <p className="mb-1 font-medium">{t("weather_official_warning")}</p>
      <a
        className="text-brand underline"
        href="https://mausam.imd.gov.in/imd_latest/contents/agromet/advisory/district_past_en.php"
        target="_blank"
        rel="noreferrer"
      >
        IMD District Agromet Advisory →
      </a>
    </div>
  );
}

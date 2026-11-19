"use client";

import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n/context";
import { schemes } from "@/lib/schemes/data";

export default function SchemesPage() {
  const { t, lang } = useI18n();

  return (
    <PageShell title={t("schemes_title")} showBack>
      <div className="flex flex-col gap-3 pb-6">
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t("schemes_disclaimer")}</p>
        {schemes.map((s) => (
          <details key={s.id} className="rounded-lg border border-neutral-200 bg-white p-3">
            <summary className="cursor-pointer font-medium">{lang === "ta" ? s.nameTa : s.nameEn}</summary>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <p>{lang === "ta" ? s.summaryTa : s.summaryEn}</p>
              <p className="text-neutral-600">
                <span className="font-medium">
                  {lang === "ta" ? "தகுதி" : "Eligibility"}:
                </span>{" "}
                {lang === "ta" ? s.eligibilitySummaryTa : s.eligibilitySummaryEn}
              </p>
              <p className="text-neutral-600">
                <span className="font-medium">
                  {lang === "ta" ? "விண்ணப்பிக்க" : "How to apply"}:
                </span>{" "}
                {lang === "ta" ? s.howToApplyTa : s.howToApplyEn}
              </p>
              <a href={s.officialUrl} target="_blank" rel="noreferrer" className="text-brand underline">
                {t("schemes_official_link")} →
              </a>
              <p className="text-xs text-neutral-400">
                {t("schemes_last_verified")}: {s.lastVerified}
              </p>
            </div>
          </details>
        ))}
      </div>
    </PageShell>
  );
}

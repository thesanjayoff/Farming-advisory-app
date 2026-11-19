"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n/context";
import { saveBlob } from "@/lib/db/client";
import { cropDisplayNames } from "@/lib/calendar/data";
import type { CropId } from "@/lib/types";

const SYMPTOMS = [
  { key: "yellowing", en: "Yellowing leaves", ta: "இலைகள் மஞ்சளாதல்" },
  { key: "spots", en: "Spots on leaves", ta: "இலைகளில் புள்ளிகள்" },
  { key: "curling", en: "Curling / rolled leaves", ta: "இலைகள் சுருளுதல்" },
  { key: "wilting", en: "Wilting / drooping", ta: "வாடுதல்" },
  { key: "stem_borer dead_heart white_ear_head", en: "Dead shoot / empty ear head", ta: "இறந்த தளிர் / வெற்று கூளை" },
  { key: "whitefly virus", en: "Tiny white insects, stunted growth", ta: "சிறிய வெள்ளை பூச்சிகள், வளர்ச்சி குன்றுதல்" },
];

interface Match {
  titleEn: string;
  titleTa: string;
  bodyEn: string;
  bodyTa: string;
  source: string;
  sourceUrl: string;
  expertVerified: boolean;
  confidenceBand: "low" | "medium";
}

export default function PhotoHelpPage() {
  const { t, lang } = useI18n();
  const [consented, setConsented] = useState(false);
  const [cropId, setCropId] = useState<CropId>("tomato");
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [photoCount, setPhotoCount] = useState(0);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSymptom(key: string) {
    setSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveBlob(`photo-help-${Date.now()}`, file);
    setPhotoCount((c) => c + 1);
  }

  async function checkCauses() {
    setLoading(true);
    setMatches(null);
    try {
      const res = await fetch("/api/kb/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropId, symptoms: Array.from(symptoms), lang }),
      });
      const json = await res.json();
      setMatches(json.matches ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (!consented) {
    return (
      <PageShell title={t("photo_help_title")} showBack>
        <div className="flex flex-col gap-4 py-6">
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{t("photo_help_disclaimer")}</p>
          <p className="text-sm text-neutral-600">
            {lang === "ta"
              ? "இந்த செயலி புகைப்படத்தை ஆய்வு செய்யும் திறன் இல்லை. கீழே உள்ள அறிகுறிகளை தேர்ந்தெடுக்கவும்; புகைப்படங்கள் உங்கள் சாதனத்தில் மட்டும் சேமிக்கப்படும், நிபுணரிடம் காட்ட உதவும்."
              : "This app cannot actually analyse your photo — there is no image-recognition model behind it. Describe the symptoms below instead; photos you add stay on your device, to show an expert."}
          </p>
          <button onClick={() => setConsented(true)} className="tap-target rounded-xl bg-brand text-lg font-semibold text-white">
            {lang === "ta" ? "புரிந்தது, தொடரவும்" : "I understand, continue"}
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("photo_help_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <select value={cropId} onChange={(e) => setCropId(e.target.value as CropId)} className="tap-target rounded-lg border border-neutral-300 px-3">
          {Object.entries(cropDisplayNames).map(([id, names]) => (
            <option key={id} value={id}>
              {lang === "ta" ? names.ta : names.en}
            </option>
          ))}
        </select>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold">{lang === "ta" ? "புகைப்படங்கள் (விருப்பம்)" : "Photos (optional)"}</h2>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[t("photo_help_leaf_top"), t("photo_help_leaf_bottom"), t("photo_help_whole_plant")].map((label) => (
              <label key={label} className="tap-target flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-center">
                📷
                <span>{label}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              </label>
            ))}
          </div>
          {photoCount > 0 && <p className="mt-2 text-xs text-green-700">{photoCount} photo(s) saved on this device</p>}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold">{lang === "ta" ? "அறிகுறிகளை தேர்ந்தெடுக்கவும்" : "Select symptoms"}</h2>
          <div className="flex flex-col gap-2">
            {SYMPTOMS.map((s) => (
              <label key={s.key} className="tap-target flex items-center gap-2">
                <input type="checkbox" checked={symptoms.has(s.key)} onChange={() => toggleSymptom(s.key)} className="h-5 w-5" />
                {lang === "ta" ? s.ta : s.en}
              </label>
            ))}
          </div>
        </section>

        <button onClick={checkCauses} disabled={symptoms.size === 0 || loading} className="tap-target rounded-xl bg-brand text-lg font-semibold text-white disabled:opacity-50">
          {loading ? t("common_loading") : lang === "ta" ? "சாத்தியமான காரணங்களை காண்க" : "Check possible causes"}
        </button>

        {matches && (
          <section className="flex flex-col gap-2">
            {matches.length === 0 ? (
              <p className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-600">{t("assistant_no_answer")}</p>
            ) : (
              matches.map((m, i) => (
                <div key={i} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                  <p className="font-medium">{lang === "ta" ? m.titleTa : m.titleEn}</p>
                  <p className="mt-1 text-neutral-600">{lang === "ta" ? m.bodyTa : m.bodyEn}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {t("photo_help_confidence")}: {m.confidenceBand === "medium" ? "🟡" : "⚪"} {m.confidenceBand}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t("common_source")}: {m.source}
                    {!m.expertVerified && " (unverified seed data)"}
                  </p>
                </div>
              ))
            )}
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t("photo_help_low_confidence_notice")}</p>
          </section>
        )}
      </div>
    </PageShell>
  );
}

"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Alert className="border-amber-300 bg-amber-50">
            <AlertDescription className="text-amber-900">{t("photo_help_disclaimer")}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            {lang === "ta"
              ? "இந்த செயலி புகைப்படத்தை ஆய்வு செய்யும் திறன் இல்லை. கீழே உள்ள அறிகுறிகளை தேர்ந்தெடுக்கவும்; புகைப்படங்கள் உங்கள் சாதனத்தில் மட்டும் சேமிக்கப்படும், நிபுணரிடம் காட்ட உதவும்."
              : "This app cannot actually analyse your photo — there is no image-recognition model behind it. Describe the symptoms below instead; photos you add stay on your device, to show an expert."}
          </p>
          <Button size="touch" className="w-full" onClick={() => setConsented(true)}>
            {lang === "ta" ? "புரிந்தது, தொடரவும்" : "I understand, continue"}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("photo_help_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <Select value={cropId} onValueChange={(v) => v && setCropId(v as CropId)}>
          <SelectTrigger className="tap-target w-full">
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

        <Card>
          <CardContent>
            <h2 className="mb-2 text-sm font-semibold">{lang === "ta" ? "புகைப்படங்கள் (விருப்பம்)" : "Photos (optional)"}</h2>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[t("photo_help_leaf_top"), t("photo_help_leaf_bottom"), t("photo_help_whole_plant")].map((label) => (
                <label
                  key={label}
                  className="tap-target flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center"
                >
                  <Camera className="size-5 text-muted-foreground" aria-hidden />
                  <span>{label}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                </label>
              ))}
            </div>
            {photoCount > 0 && <p className="mt-2 text-xs text-green-700">{photoCount} photo(s) saved on this device</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-2 text-sm font-semibold">{lang === "ta" ? "அறிகுறிகளை தேர்ந்தெடுக்கவும்" : "Select symptoms"}</h2>
            <div className="flex flex-col gap-2">
              {SYMPTOMS.map((s) => (
                <label key={s.key} className="tap-target flex items-center gap-3">
                  <Checkbox
                    checked={symptoms.has(s.key)}
                    onCheckedChange={() => toggleSymptom(s.key)}
                    className="size-5"
                  />
                  {lang === "ta" ? s.ta : s.en}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button size="touch" className="w-full" disabled={symptoms.size === 0 || loading} onClick={checkCauses}>
          {loading ? t("common_loading") : lang === "ta" ? "சாத்தியமான காரணங்களை காண்க" : "Check possible causes"}
        </Button>

        {matches && (
          <section className="flex flex-col gap-2">
            {matches.length === 0 ? (
              <Alert>
                <AlertDescription>{t("assistant_no_answer")}</AlertDescription>
              </Alert>
            ) : (
              matches.map((m, i) => (
                <Card key={i} className="py-3">
                  <CardContent className="text-sm">
                    <p className="font-medium">{lang === "ta" ? m.titleTa : m.titleEn}</p>
                    <p className="mt-1 text-muted-foreground">{lang === "ta" ? m.bodyTa : m.bodyEn}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={m.confidenceBand === "medium" ? "default" : "secondary"}>
                        {t("photo_help_confidence")}: {m.confidenceBand}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {t("common_source")}: {m.source}
                      {!m.expertVerified && " (unverified seed data)"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
            <Alert className="border-amber-300 bg-amber-50">
              <AlertDescription className="text-amber-900">{t("photo_help_low_confidence_notice")}</AlertDescription>
            </Alert>
          </section>
        )}
      </div>
    </PageShell>
  );
}

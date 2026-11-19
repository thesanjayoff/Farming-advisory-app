"use client";

import { PageShell } from "@/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n/context";
import { schemes } from "@/lib/schemes/data";

export default function SchemesPage() {
  const { t, lang } = useI18n();

  return (
    <PageShell title={t("schemes_title")} showBack>
      <div className="flex flex-col gap-3 pb-6">
        <Alert className="border-amber-300 bg-amber-50">
          <AlertDescription className="text-amber-900">{t("schemes_disclaimer")}</AlertDescription>
        </Alert>
        <Accordion multiple className="flex flex-col gap-2">
          {schemes.map((s) => (
            <AccordionItem
              key={s.id}
              value={s.id}
              className="rounded-lg border border-border bg-card px-3"
            >
              <AccordionTrigger className="font-medium">
                {lang === "ta" ? s.nameTa : s.nameEn}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 text-sm">
                <p>{lang === "ta" ? s.summaryTa : s.summaryEn}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {lang === "ta" ? "தகுதி" : "Eligibility"}:
                  </span>{" "}
                  {lang === "ta" ? s.eligibilitySummaryTa : s.eligibilitySummaryEn}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {lang === "ta" ? "விண்ணப்பிக்க" : "How to apply"}:
                  </span>{" "}
                  {lang === "ta" ? s.howToApplyTa : s.howToApplyEn}
                </p>
                <a href={s.officialUrl} target="_blank" rel="noreferrer" className="text-brand underline">
                  {t("schemes_official_link")} →
                </a>
                <p className="text-xs text-muted-foreground/70">
                  {t("schemes_last_verified")}: {s.lastVerified}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PageShell>
  );
}

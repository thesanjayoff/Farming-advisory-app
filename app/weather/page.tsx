"use client";

import { useMemo, useState } from "react";
import { Send, Droplets, Wind, TriangleAlert } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { OfficialWeatherLinks } from "@/components/OfficialWeatherLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { useWeather } from "@/lib/hooks/useWeather";
import { getCurrentStage } from "@/lib/calendar/resolve";
import { generateWeatherAlerts, type WeatherAlert } from "@/lib/rules/alerts";
import type { DictKey } from "@/lib/i18n/dictionary";

function ageLabel(ms: number | null): string {
  if (ms == null) return "";
  const hours = Math.round(ms / (1000 * 60 * 60));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const SEVERITY_STYLE: Record<WeatherAlert["severity"], string> = {
  info: "border-border bg-card",
  warning: "border-amber-300 bg-amber-50",
  danger: "border-red-300 bg-red-50",
};

const SEVERITY_BADGE: Record<WeatherAlert["severity"], "secondary" | "default" | "destructive"> = {
  info: "secondary",
  warning: "default",
  danger: "destructive",
};

export default function WeatherPage() {
  const { t, lang } = useI18n();
  const { activePlot, loading } = useFarmProfile();
  const point = activePlot?.location ?? null;
  const { forecast, loading: weatherLoading, stale, ageMs, error } = useWeather(point);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  async function sendViaTelegram(alertList: WeatherAlert[]) {
    const chatId = window.localStorage.getItem("vayal.telegramChatId");
    if (!chatId) {
      setSendStatus(lang === "ta" ? "முதலில் அமைப்புகளில் Telegram chat ID சேர்க்கவும்" : "Add a Telegram chat ID in Settings first");
      return;
    }
    const message = alertList.map((a) => `${t(a.messageKey as DictKey)}\n${a.explanation}`).join("\n\n");
    try {
      const res = await fetch("/api/notify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "telegram", target: chatId, message }),
      });
      setSendStatus(res.ok ? "✓ sent" : "Failed — check TELEGRAM_BOT_TOKEN is configured on the server");
    } catch {
      setSendStatus("Failed — offline or server unreachable");
    }
  }

  const primaryCrop = activePlot?.crops[0];
  const stage = useMemo(() => {
    if (!primaryCrop) return undefined;
    return getCurrentStage(primaryCrop.cropId, primaryCrop.sowingDate);
  }, [primaryCrop]);

  const alerts = useMemo(() => {
    if (!forecast) return [];
    return generateWeatherAlerts(forecast, stage);
  }, [forecast, stage]);

  if (loading || weatherLoading) {
    return (
      <PageShell title={t("weather_title")} showBack>
        <p className="py-10 text-center text-muted-foreground">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!activePlot) {
    return (
      <PageShell title={t("weather_title")} showBack>
        <p className="py-10 text-center text-muted-foreground">{t("common_data_gap")}</p>
      </PageShell>
    );
  }

  if (error || !forecast) {
    return (
      <PageShell title={t("weather_title")} showBack>
        <Alert>
          <AlertDescription>{t("common_data_gap")}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("weather_title")} showBack>
      <div className="flex flex-col gap-4 pb-4">
        {stale && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription className="text-amber-900">
              {t("weather_stale_warning")} ({t("weather_last_updated")}: {ageLabel(ageMs)})
            </AlertDescription>
          </Alert>
        )}

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
            <TriangleAlert className="size-4 text-amber-600" aria-hidden /> Alerts
          </h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("weather_informational_notice")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Card className={`${SEVERITY_STYLE[a.severity]} py-3`}>
                    <CardContent className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{t(a.messageKey as DictKey)}</p>
                        <Badge variant={SEVERITY_BADGE[a.severity]} className="shrink-0">
                          {a.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/70">{a.explanation}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("common_source")}: rules-engine + Open-Meteo · {a.dateIso}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          {alerts.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <Button
                variant="outline"
                className="self-start border-brand text-brand hover:bg-brand-light"
                onClick={() => sendViaTelegram(alerts)}
              >
                <Send className="size-4" aria-hidden />
                {lang === "ta" ? "Telegram-இல் அனுப்பு" : "Send via Telegram"}
              </Button>
              {sendStatus && <p className="text-xs text-muted-foreground">{sendStatus}</p>}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">{t("weather_forecast")}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {forecast.daily.map((day) => (
              <Card key={day.date} className="min-w-[120px] py-3">
                <CardContent className="flex flex-col gap-0.5 text-sm">
                  <p className="font-medium">{day.date.slice(5)}</p>
                  <p>{day.tempMinC.toFixed(0)}° / {day.tempMaxC.toFixed(0)}°C</p>
                  <p className="text-xs text-muted-foreground">
                    {t("weather_rain_chance")}: {day.precipitationProbabilityMaxPercent ?? "—"}%
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Droplets className="size-3" aria-hidden /> {day.precipitationSumMm.toFixed(1)}mm
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind className="size-3" aria-hidden /> {day.windSpeedMaxKmh.toFixed(0)}km/h
                  </p>
                  {day.et0Mm != null && (
                    <p className="text-xs text-muted-foreground">{t("weather_et0")}: {day.et0Mm.toFixed(1)}mm</p>
                  )}
                  {day.soilMoisture0to7cm != null && (
                    <p className="text-xs text-muted-foreground">
                      {t("weather_soil_moisture")}: {(day.soilMoisture0to7cm * 100).toFixed(0)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {stage && (
          <p className="text-xs text-muted-foreground">
            {lang === "ta" ? stage.nameTa : stage.nameEn} · day {stage.dayFromSowing}
          </p>
        )}

        <OfficialWeatherLinks />

        <p className="text-xs text-muted-foreground/70">
          {t("weather_attribution")} ·{" "}
          <a href={forecast.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {forecast.sourceUrl}
          </a>{" "}
          · {t("common_retrieved")}: {new Date(forecast.retrievedAt).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground/70">{t("weather_informational_notice")}</p>
      </div>
    </PageShell>
  );
}

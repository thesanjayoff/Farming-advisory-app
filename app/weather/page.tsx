"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { OfficialWeatherLinks } from "@/components/OfficialWeatherLinks";
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
  info: "border-neutral-200 bg-white",
  warning: "border-amber-300 bg-amber-50",
  danger: "border-red-300 bg-red-50",
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
        <p className="py-10 text-center text-neutral-500">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!activePlot) {
    return (
      <PageShell title={t("weather_title")} showBack>
        <p className="py-10 text-center text-neutral-500">{t("common_data_gap")}</p>
      </PageShell>
    );
  }

  if (error || !forecast) {
    return (
      <PageShell title={t("weather_title")} showBack>
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-600">
          {t("common_data_gap")}
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("weather_title")} showBack>
      <div className="flex flex-col gap-4 pb-4">
        {stale && (
          <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
            {t("weather_stale_warning")} ({t("weather_last_updated")}: {ageLabel(ageMs)})
          </p>
        )}

        <section>
          <h2 className="mb-2 text-base font-semibold">⚠️ Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("weather_informational_notice")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => (
                <li key={a.id} className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLE[a.severity]}`}>
                  <p className="font-medium">{t(a.messageKey as DictKey)}</p>
                  <p className="mt-1 text-xs text-neutral-600">{a.explanation}</p>
                  <p className="mt-1 text-xs text-neutral-500">{t("common_source")}: rules-engine + Open-Meteo · {a.dateIso}</p>
                </li>
              ))}
            </ul>
          )}
          {alerts.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <button
                onClick={() => sendViaTelegram(alerts)}
                className="tap-target self-start rounded-lg border border-brand px-3 text-sm font-medium text-brand"
              >
                📨 {lang === "ta" ? "Telegram-இல் அனுப்பு" : "Send via Telegram"}
              </button>
              {sendStatus && <p className="text-xs text-neutral-500">{sendStatus}</p>}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">{t("weather_forecast")}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {forecast.daily.map((day) => (
              <div key={day.date} className="min-w-[110px] rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <p className="font-medium">{day.date.slice(5)}</p>
                <p>{day.tempMinC.toFixed(0)}° / {day.tempMaxC.toFixed(0)}°C</p>
                <p className="text-xs text-neutral-500">
                  {t("weather_rain_chance")}: {day.precipitationProbabilityMaxPercent ?? "—"}%
                </p>
                <p className="text-xs text-neutral-500">💧 {day.precipitationSumMm.toFixed(1)}mm</p>
                <p className="text-xs text-neutral-500">💨 {day.windSpeedMaxKmh.toFixed(0)}km/h</p>
                {day.et0Mm != null && (
                  <p className="text-xs text-neutral-500">{t("weather_et0")}: {day.et0Mm.toFixed(1)}mm</p>
                )}
                {day.soilMoisture0to7cm != null && (
                  <p className="text-xs text-neutral-500">
                    {t("weather_soil_moisture")}: {(day.soilMoisture0to7cm * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {stage && (
          <p className="text-xs text-neutral-500">
            {lang === "ta" ? stage.nameTa : stage.nameEn} · day {stage.dayFromSowing}
          </p>
        )}

        <OfficialWeatherLinks />

        <p className="text-xs text-neutral-400">
          {t("weather_attribution")} ·{" "}
          <a href={forecast.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {forecast.sourceUrl}
          </a>{" "}
          · {t("common_retrieved")}: {new Date(forecast.retrievedAt).toLocaleString()}
        </p>
        <p className="text-xs text-neutral-400">{t("weather_informational_notice")}</p>
      </div>
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { getUpcomingTasks } from "@/lib/calendar/resolve";
import { cropDisplayNames } from "@/lib/calendar/data";
import type { ResolvedTask } from "@/lib/calendar/types";
import { seedDemoData } from "@/lib/seed/demoData";

const QUICK_LINKS = [
  { href: "/diary", emoji: "📓", labelKey: "nav_diary" as const },
  { href: "/schemes", emoji: "🏛️", labelKey: "nav_schemes" as const },
  { href: "/photo-help", emoji: "📷", labelKey: "photo_help_title" as const },
  { href: "/settings", emoji: "⚙️", labelKey: "nav_settings" as const },
];

export default function Home() {
  const { t, lang } = useI18n();
  const { farm, loading, activePlot } = useFarmProfile();
  const [upcoming, setUpcoming] = useState<ResolvedTask[]>([]);

  useEffect(() => {
    if (!activePlot) return;
    const soonTasks = activePlot.crops.flatMap((crop) =>
      getUpcomingTasks(crop.cropId, crop.sowingDate, new Date(), 7).map((task) => ({
        ...task,
        _cropId: crop.cropId,
      }))
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- recomputing "today's" upcoming tasks on plot change
    setUpcoming(soonTasks as ResolvedTask[]);
  }, [activePlot]);

  if (loading) {
    return (
      <PageShell title={t("app_name")}>
        <p className="py-10 text-center text-neutral-500">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!farm || farm.plots.length === 0) {
    return (
      <PageShell title={t("app_name")}>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <p className="text-2xl">🌾</p>
          <h2 className="text-xl font-semibold">{t("onboarding_welcome")}</h2>
          <p className="max-w-sm text-neutral-600">{t("app_tagline")}</p>
          <Link
            href="/onboarding"
            className="tap-target w-full max-w-xs rounded-xl bg-brand px-6 py-4 text-center text-lg font-semibold text-white"
          >
            {t("onboarding_add_plot")}
          </Link>
          <button
            onClick={async () => {
              await seedDemoData();
              window.location.reload();
            }}
            className="tap-target w-full max-w-xs rounded-xl border border-brand px-6 py-3 text-center text-sm font-medium text-brand"
          >
            {lang === "ta" ? "மாதிரி தரவுடன் முயற்சிக்க" : "Try with sample data"}
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("app_name")}>
      <section className="mb-4 rounded-xl bg-brand-light p-4">
        <p className="text-sm text-neutral-600">{farm.farmerName}</p>
        <p className="text-lg font-semibold">{activePlot?.locationLabel ?? "—"}</p>
        {activePlot && activePlot.crops.length > 0 && (
          <p className="text-sm text-neutral-700">
            {activePlot.crops
              .map((c) => cropDisplayNames[c.cropId]?.[lang === "ta" ? "ta" : "en"] ?? c.cropId)
              .join(", ")}
          </p>
        )}
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("calendar_title")}</h2>
          <Link href="/calendar" className="text-sm text-brand underline">
            {t("calendar_title")} →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("common_data_gap")}</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.slice(0, 3).map((task) => (
              <li key={task.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <p className="font-medium">{lang === "ta" ? task.nameTa : task.nameEn}</p>
                <p className="text-xs text-neutral-500">
                  {t("calendar_due")}: {task.dueDate}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("weather_title")}</h2>
          <Link href="/weather" className="text-sm text-brand underline">
            {t("weather_title")} →
          </Link>
        </div>
        <p className="text-sm text-neutral-500">{t("weather_informational_notice")}</p>
      </section>

      <section className="grid grid-cols-4 gap-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="tap-target flex flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white py-3 text-center text-xs font-medium"
          >
            <span className="text-2xl" aria-hidden>
              {link.emoji}
            </span>
            <span>{t(link.labelKey)}</span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

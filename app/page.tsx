"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { getUpcomingTasks } from "@/lib/calendar/resolve";
import { cropDisplayNames } from "@/lib/calendar/data";
import type { ResolvedTask } from "@/lib/calendar/types";
import { seedDemoData } from "@/lib/seed/demoData";

const QUICK_LINKS = [
  { href: "/diary", emoji: "📓", labelKey: "nav_diary" as const, tile: "bg-amber-100" },
  { href: "/schemes", emoji: "🏛️", labelKey: "nav_schemes" as const, tile: "bg-sky-100" },
  { href: "/photo-help", emoji: "📷", labelKey: "photo_help_title" as const, tile: "bg-rose-100" },
  { href: "/settings", emoji: "⚙️", labelKey: "nav_settings" as const, tile: "bg-violet-100" },
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
        <p className="py-10 text-center text-muted-foreground">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!farm || farm.plots.length === 0) {
    return (
      <PageShell title={t("app_name")}>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <p className="text-4xl">🌾</p>
          <h2 className="text-xl font-semibold">{t("onboarding_welcome")}</h2>
          <p className="max-w-sm text-muted-foreground">{t("app_tagline")}</p>
          <Link href="/onboarding" className={buttonVariants({ size: "touch", className: "w-full max-w-xs" })}>
            {t("onboarding_add_plot")}
          </Link>
          <Button
            variant="outline"
            size="touch"
            className="w-full max-w-xs"
            onClick={async () => {
              await seedDemoData();
              window.location.reload();
            }}
          >
            {lang === "ta" ? "மாதிரி தரவுடன் முயற்சிக்க" : "Try with sample data"}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("app_name")}>
      <Card
        className="relative mb-5 overflow-hidden border-none text-white shadow-[0_12px_28px_-10px_color-mix(in_srgb,var(--brand)_60%,transparent)]"
        style={{ background: "linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, black 15%) 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-12 -left-6 size-32 rounded-full bg-white/5" aria-hidden />
        <CardContent className="relative flex flex-col gap-2">
          <p className="text-sm font-medium text-white/80">{farm.farmerName}</p>
          <p className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
            <MapPin className="size-5 shrink-0 text-white/80" aria-hidden />
            {activePlot?.locationLabel ?? "—"}
          </p>
          {activePlot && activePlot.crops.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activePlot.crops.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
                >
                  {cropDisplayNames[c.cropId]?.[lang === "ta" ? "ta" : "en"] ?? c.cropId}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("calendar_title")}</CardTitle>
          <Link
            href="/calendar"
            className="flex items-center gap-0.5 text-sm font-medium text-brand transition-opacity hover:opacity-70"
          >
            {t("calendar_title")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common_data_gap")}</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 3).map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-border/70 bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                >
                  <p className="font-medium">{lang === "ta" ? task.nameTa : task.nameEn}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("calendar_due")}: {task.dueDate}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("weather_title")}</CardTitle>
          <Link
            href="/weather"
            className="flex items-center gap-0.5 text-sm font-medium text-brand transition-opacity hover:opacity-70"
          >
            {t("weather_title")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("weather_informational_notice")}</p>
        </CardContent>
      </Card>

      <section className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="tap-target group flex flex-col items-center justify-center gap-1.5 text-center text-xs font-medium text-foreground/80 transition-transform active:scale-95"
          >
            <span
              className={`flex size-14 items-center justify-center rounded-2xl text-2xl shadow-sm transition-shadow group-active:shadow-none ${link.tile}`}
              aria-hidden
            >
              {link.emoji}
            </span>
            <span>{t(link.labelKey)}</span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

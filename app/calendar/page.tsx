"use client";

import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { useDoneTasks } from "@/lib/hooks/useDoneTasks";
import { getResolvedTasks } from "@/lib/calendar/resolve";
import { getCropCalendar, cropDisplayNames } from "@/lib/calendar/data";

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const { activePlot, loading } = useFarmProfile();
  const { done, toggle } = useDoneTasks(activePlot?.id ?? null);

  if (loading) {
    return (
      <PageShell title={t("calendar_title")} showBack>
        <p className="py-10 text-center text-muted-foreground">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!activePlot || activePlot.crops.length === 0) {
    return (
      <PageShell title={t("calendar_title")} showBack>
        <p className="py-10 text-center text-muted-foreground">{t("common_data_gap")}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("calendar_title")} showBack>
      <div className="flex flex-col gap-6 pb-6">
        {activePlot.crops.map((crop) => {
          const def = getCropCalendar(crop.cropId);
          const tasks = getResolvedTasks(crop.cropId, crop.sowingDate, done);
          return (
            <section key={crop.id}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-base font-semibold">
                  {lang === "ta" ? cropDisplayNames[crop.cropId]?.ta : cropDisplayNames[crop.cropId]?.en}
                </h2>
                {def && !def.expertVerified && (
                  <Badge variant="secondary" className="shrink-0">
                    {lang === "ta" ? "நிபுணர் சரிபார்ப்பு நிலுவையில்" : "pending expert review"}
                  </Badge>
                )}
              </div>
              {def && <p className="mb-2 text-xs text-muted-foreground">{t("calendar_source")}: {def.source}</p>}
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <Card className={`py-3 ${task.done ? "opacity-60" : ""}`}>
                      <CardContent className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(task.id)}
                          className="tap-target flex shrink-0 items-center justify-center rounded-full text-2xl"
                          aria-label={t("calendar_done")}
                        >
                          {task.done ? "✅" : "⬜"}
                        </button>
                        <div>
                          <p className="font-medium">{lang === "ta" ? task.nameTa : task.nameEn}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("calendar_due")}: {task.dueDate} · {task.category}
                          </p>
                          {task.notes && <p className="text-xs text-muted-foreground/70">{task.notes}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}

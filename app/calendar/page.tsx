"use client";

import { PageShell } from "@/components/PageShell";
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
        <p className="py-10 text-center text-neutral-500">{t("common_loading")}</p>
      </PageShell>
    );
  }

  if (!activePlot || activePlot.crops.length === 0) {
    return (
      <PageShell title={t("calendar_title")} showBack>
        <p className="py-10 text-center text-neutral-500">{t("common_data_gap")}</p>
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
              <h2 className="mb-1 text-base font-semibold">
                {lang === "ta" ? cropDisplayNames[crop.cropId]?.ta : cropDisplayNames[crop.cropId]?.en}
              </h2>
              {def && (
                <p className="mb-2 text-xs text-neutral-500">
                  {t("calendar_source")}: {def.source}
                  {!def.expertVerified && " (seed data — pending expert review)"}
                </p>
              )}
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      task.done ? "border-neutral-200 bg-neutral-50 opacity-60" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <button
                      onClick={() => toggle(task.id)}
                      className="tap-target flex items-center justify-center text-2xl"
                      aria-label={t("calendar_done")}
                    >
                      {task.done ? "✅" : "⬜"}
                    </button>
                    <div>
                      <p className="font-medium">{lang === "ta" ? task.nameTa : task.nameEn}</p>
                      <p className="text-xs text-neutral-500">
                        {t("calendar_due")}: {task.dueDate} · {task.category}
                      </p>
                      {task.notes && <p className="text-xs text-neutral-400">{task.notes}</p>}
                    </div>
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

import { differenceInCalendarDays, addDays, formatISO, parseISO } from "date-fns";
import { getCropCalendar } from "@/lib/calendar/data";
import type { CropId } from "@/lib/types";
import type { ResolvedStage, ResolvedTask } from "@/lib/calendar/types";

export function daysSinceSowing(sowingDateIso: string, today: Date = new Date()): number {
  return differenceInCalendarDays(today, parseISO(sowingDateIso));
}

/** Returns the crop's current stage for `today`, or undefined if the crop is
 * unknown or `today` falls outside every defined stage (e.g. far past harvest). */
export function getCurrentStage(
  cropId: CropId,
  sowingDateIso: string,
  today: Date = new Date()
): ResolvedStage | undefined {
  const def = getCropCalendar(cropId);
  if (!def) return undefined;
  const dayFromSowing = daysSinceSowing(sowingDateIso, today);
  const stage = def.stages.find(
    (s) => dayFromSowing >= s.startDay && dayFromSowing <= s.endDay
  );
  if (!stage) return undefined;
  return { ...stage, dayFromSowing };
}

/** All tasks for a crop, with due dates shifted from the sowing date, and a
 * `done` flag the caller can fill in from locally stored completion state. */
export function getResolvedTasks(
  cropId: CropId,
  sowingDateIso: string,
  doneTaskIds: Set<string> = new Set()
): ResolvedTask[] {
  const def = getCropCalendar(cropId);
  if (!def) return [];
  const sowingDate = parseISO(sowingDateIso);
  return def.tasks
    .map((task) => ({
      ...task,
      dueDate: formatISO(addDays(sowingDate, task.dayFromSowing), { representation: "date" }),
      done: doneTaskIds.has(task.id),
    }))
    .sort((a, b) => a.dayFromSowing - b.dayFromSowing);
}

/** Tasks due within the next `withinDays` days (inclusive), not yet done. */
export function getUpcomingTasks(
  cropId: CropId,
  sowingDateIso: string,
  today: Date = new Date(),
  withinDays = 7,
  doneTaskIds: Set<string> = new Set()
): ResolvedTask[] {
  const all = getResolvedTasks(cropId, sowingDateIso, doneTaskIds);
  return all.filter((t) => {
    if (t.done) return false;
    const daysUntil = differenceInCalendarDays(parseISO(t.dueDate), today);
    return daysUntil >= -1 && daysUntil <= withinDays; // small grace window for "just missed"
  });
}

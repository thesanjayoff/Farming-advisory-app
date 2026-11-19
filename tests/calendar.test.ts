import { describe, expect, it } from "vitest";
import { getCurrentStage, getResolvedTasks, getUpcomingTasks } from "@/lib/calendar/resolve";

// Paddy calendar (data/calendar/paddy.json): nursery 0-20, transplant/tillering
// 21-45, panicle initiation 46-65, flowering 66-85, grain filling 86-110,
// harvest 111-120.

describe("getCurrentStage", () => {
  it("resolves the nursery stage right after sowing", () => {
    const sowing = "2026-11-01";
    const today = new Date("2026-11-05");
    const stage = getCurrentStage("paddy", sowing, today);
    expect(stage?.id).toBe("nursery");
    expect(stage?.dayFromSowing).toBe(4);
  });

  it("shifts the resolved stage automatically with a later sowing date", () => {
    const today = new Date("2026-12-10");
    const earlyStage = getCurrentStage("paddy", "2026-11-01", today);
    const lateStage = getCurrentStage("paddy", "2026-11-25", today);
    expect(earlyStage?.id).not.toBe(lateStage?.id);
  });

  it("resolves the flowering stage around day 70", () => {
    const sowing = "2026-01-01";
    const today = new Date("2026-03-11"); // day 69 from Jan 1
    const stage = getCurrentStage("paddy", sowing, today);
    expect(stage?.id).toBe("flowering");
  });

  it("returns undefined once well past harvest", () => {
    const stage = getCurrentStage("paddy", "2020-01-01", new Date("2026-01-01"));
    expect(stage).toBeUndefined();
  });
});

describe("getResolvedTasks", () => {
  it("shifts every task's due date with the sowing date", () => {
    const tasksA = getResolvedTasks("paddy", "2026-01-01");
    const tasksB = getResolvedTasks("paddy", "2026-01-11"); // 10 days later

    expect(tasksA.length).toBe(tasksB.length);
    expect(tasksA.length).toBeGreaterThan(0);

    for (let i = 0; i < tasksA.length; i++) {
      const a = new Date(tasksA[i].dueDate);
      const b = new Date(tasksB[i].dueDate);
      const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(10);
    }
  });

  it("marks tasks done when their id is in the done set", () => {
    const tasks = getResolvedTasks("paddy", "2026-01-01", new Set(["paddy_t1"]));
    const t1 = tasks.find((t) => t.id === "paddy_t1");
    const t2 = tasks.find((t) => t.id === "paddy_t2");
    expect(t1?.done).toBe(true);
    expect(t2?.done).toBe(false);
  });

  it("returns an empty list for an unknown crop id", () => {
    // @ts-expect-error intentionally invalid crop id for the gap-handling test
    const tasks = getResolvedTasks("durian", "2026-01-01");
    expect(tasks).toEqual([]);
  });
});

describe("getUpcomingTasks", () => {
  it("only includes tasks due within the given window and not already done", () => {
    const sowing = "2026-01-01";
    const today = new Date("2026-01-01"); // day 0: paddy_t1 (day 0) due now
    const upcoming = getUpcomingTasks("paddy", sowing, today, 7);
    expect(upcoming.some((t) => t.id === "paddy_t1")).toBe(true);
    // paddy_t2 (transplant, day 21) is far outside a 7-day window from day 0
    expect(upcoming.some((t) => t.id === "paddy_t2")).toBe(false);
  });

  it("excludes tasks already marked done even if due soon", () => {
    const sowing = "2026-01-01";
    const today = new Date("2026-01-01");
    const upcoming = getUpcomingTasks("paddy", sowing, today, 7, new Set(["paddy_t1"]));
    expect(upcoming.some((t) => t.id === "paddy_t1")).toBe(false);
  });
});

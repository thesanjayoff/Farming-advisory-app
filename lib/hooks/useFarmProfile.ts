"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllFarms, saveFarm } from "@/lib/db/client";
import type { FarmProfile, Plot } from "@/lib/types";

const ACTIVE_PLOT_KEY = "vayal.activePlotId";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyFarm(farmerName: string, lang: FarmProfile["languagePreference"]): FarmProfile {
  const now = new Date().toISOString();
  return {
    id: newId(),
    farmerName,
    languagePreference: lang,
    plots: [],
    createdAt: now,
    updatedAt: now,
    backupEnabled: false,
  };
}

export function newPlot(partial: Omit<Plot, "id" | "crops">): Plot {
  return { ...partial, id: newId(), crops: [] };
}

export function useFarmProfile() {
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlotId, setActivePlotId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const farms = await getAllFarms();
        const first = farms[0] ?? null;
        setFarm(first);
        const storedPlotId = window.localStorage.getItem(ACTIVE_PLOT_KEY);
        const valid = first?.plots.find((p) => p.id === storedPlotId);
        setActivePlotId(valid ? valid.id : first?.plots[0]?.id ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: FarmProfile) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    await saveFarm(updated);
    setFarm(updated);
    return updated;
  }, []);

  const createFarm = useCallback(
    async (farmerName: string, lang: FarmProfile["languagePreference"]) => {
      const created = createEmptyFarm(farmerName, lang);
      await persist(created);
      return created;
    },
    [persist]
  );

  const addPlot = useCallback(
    async (plot: Plot, targetFarm?: FarmProfile) => {
      const base = targetFarm ?? farm;
      if (!base) throw new Error("No farm profile yet");
      const updated = await persist({ ...base, plots: [...base.plots, plot] });
      setActivePlotId(plot.id);
      window.localStorage.setItem(ACTIVE_PLOT_KEY, plot.id);
      return updated;
    },
    [farm, persist]
  );

  const updatePlot = useCallback(
    async (plotId: string, patch: Partial<Plot>) => {
      if (!farm) throw new Error("No farm profile yet");
      const plots = farm.plots.map((p) => (p.id === plotId ? { ...p, ...patch } : p));
      return persist({ ...farm, plots });
    },
    [farm, persist]
  );

  const removePlot = useCallback(
    async (plotId: string) => {
      if (!farm) throw new Error("No farm profile yet");
      const plots = farm.plots.filter((p) => p.id !== plotId);
      await persist({ ...farm, plots });
      if (activePlotId === plotId) {
        const next = plots[0]?.id ?? null;
        setActivePlotId(next);
        if (next) window.localStorage.setItem(ACTIVE_PLOT_KEY, next);
        else window.localStorage.removeItem(ACTIVE_PLOT_KEY);
      }
    },
    [farm, persist, activePlotId]
  );

  const selectPlot = useCallback((plotId: string) => {
    setActivePlotId(plotId);
    window.localStorage.setItem(ACTIVE_PLOT_KEY, plotId);
  }, []);

  const activePlot: Plot | null = farm?.plots.find((p) => p.id === activePlotId) ?? null;

  return {
    farm,
    loading,
    activePlot,
    activePlotId,
    createFarm,
    addPlot,
    updatePlot,
    removePlot,
    selectPlot,
    setFarm: persist,
  };
}

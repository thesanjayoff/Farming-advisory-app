"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(plotId: string): string {
  return `vayal.doneTasks.${plotId}`;
}

export function useDoneTasks(plotId: string | null) {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Synchronizing local state from localStorage (an external store) keyed
    // by the current plotId — intentional, not a derived-render computation.
    if (!plotId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(new Set());
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(plotId));
      setDone(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setDone(new Set());
    }
  }, [plotId]);

  const toggle = useCallback(
    (taskId: string) => {
      if (!plotId) return;
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        try {
          window.localStorage.setItem(storageKey(plotId), JSON.stringify([...next]));
        } catch {
          // ignore storage errors (e.g. private browsing)
        }
        return next;
      });
    },
    [plotId]
  );

  return { done, toggle };
}

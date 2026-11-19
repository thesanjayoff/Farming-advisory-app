"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { VoiceNoteRecorder } from "@/components/VoiceNoteRecorder";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { getDiaryForPlot, saveDiaryEntry, deleteDiaryEntry } from "@/lib/db/client";
import { computeProfitSummary } from "@/lib/diary/profit";
import type { DiaryEntry } from "@/lib/types";

const TYPES: DiaryEntry["type"][] = ["expense", "input", "labor", "yield", "sale", "note"];

export default function DiaryPage() {
  const { t } = useI18n();
  const { activePlot } = useFarmProfile();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [type, setType] = useState<DiaryEntry["type"]>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today's date isn't known until the client mounts
    setDate((d) => d || new Date().toISOString().slice(0, 10));
  }, []);
  const [pendingVoiceRef, setPendingVoiceRef] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activePlot) return;
    setEntries(await getDiaryForPlot(activePlot.id));
  }, [activePlot]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading this plot's diary entries on mount/plot change
    refresh();
  }, [refresh]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlot) return;
    const entry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      plotId: activePlot.id,
      date,
      type,
      description,
      amountInr: amount ? Number(amount) : undefined,
      voiceNoteRef: pendingVoiceRef ?? undefined,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    await saveDiaryEntry(entry);
    setDescription("");
    setAmount("");
    setPendingVoiceRef(null);
    await refresh();
  }

  async function removeEntry(id: string) {
    await deleteDiaryEntry(id);
    await refresh();
  }

  function exportDiary() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vayal-diary-${activePlot?.name ?? "plot"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = computeProfitSummary(entries);

  if (!activePlot) {
    return (
      <PageShell title={t("diary_title")} showBack>
        <p className="py-10 text-center text-neutral-500">{t("common_data_gap")}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("diary_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold">{t("diary_profit_summary")}</h2>
          <p className="text-sm">Expenses: ₹{summary.totalExpensesInr}</p>
          <p className="text-sm">Labor: ₹{summary.totalLaborInr}</p>
          <p className="text-sm">Sales: ₹{summary.totalSalesInr}</p>
          <p className="text-sm font-semibold">Net: ₹{summary.netProfitInr}</p>
          {summary.totalYieldQuantity.map((y) => (
            <p key={y.unit} className="text-xs text-neutral-500">
              {t("diary_yield")}: {y.quantity} {y.unit}
            </p>
          ))}
        </section>

        <form onSubmit={addEntry} className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="text-sm font-semibold">{t("diary_add_entry")}</h2>
          <select value={type} onChange={(e) => setType(e.target.value as DiaryEntry["type"])} className="tap-target rounded border border-neutral-300 px-2">
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`diary_${ty}` as const)}
              </option>
            ))}
          </select>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("diary_add_entry")}
            className="tap-target rounded border border-neutral-300 px-2"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹"
            inputMode="numeric"
            className="tap-target rounded border border-neutral-300 px-2"
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tap-target rounded border border-neutral-300 px-2" />
          <VoiceNoteRecorder onSaved={setPendingVoiceRef} />
          {pendingVoiceRef && <p className="text-xs text-green-700">🎙️ voice note attached</p>}
          <button type="submit" className="tap-target rounded bg-brand font-medium text-white">
            {t("common_add")}
          </button>
        </form>

        <button onClick={exportDiary} className="tap-target rounded-lg border border-brand text-sm font-medium text-brand">
          {t("diary_export")}
        </button>

        <ul className="flex flex-col gap-2">
          {entries
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <li key={entry.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {t(`diary_${entry.type}` as const)}: {entry.description}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {entry.date} {entry.amountInr != null && `· ₹${entry.amountInr}`}
                      {entry.voiceNoteRef && " · 🎙️"}
                      {!entry.synced && " · offline"}
                    </p>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="tap-target text-sm text-red-600">
                    {t("common_delete")}
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </PageShell>
  );
}

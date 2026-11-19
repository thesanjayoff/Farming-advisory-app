"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Mic, Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { VoiceNoteRecorder } from "@/components/VoiceNoteRecorder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <p className="py-10 text-center text-muted-foreground">{t("common_data_gap")}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("diary_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <Card className="bg-brand-light">
          <CardContent>
            <h2 className="mb-2 text-sm font-semibold text-brand">{t("diary_profit_summary")}</h2>
            <p className="text-sm">Expenses: ₹{summary.totalExpensesInr}</p>
            <p className="text-sm">Labor: ₹{summary.totalLaborInr}</p>
            <p className="text-sm">Sales: ₹{summary.totalSalesInr}</p>
            <p className="text-sm font-semibold">Net: ₹{summary.netProfitInr}</p>
            {summary.totalYieldQuantity.map((y) => (
              <p key={y.unit} className="text-xs text-foreground/70">
                {t("diary_yield")}: {y.quantity} {y.unit}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <form onSubmit={addEntry} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">{t("diary_add_entry")}</h2>
              <Select value={type} onValueChange={(v) => v && setType(v as DiaryEntry["type"])}>
                <SelectTrigger className="tap-target w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>
                      {t(`diary_${ty}` as const)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("diary_add_entry")}
                className="tap-target"
              />
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹"
                inputMode="numeric"
                className="tap-target"
              />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tap-target" />
              <VoiceNoteRecorder onSaved={setPendingVoiceRef} />
              {pendingVoiceRef && (
                <p className="flex items-center gap-1 text-xs text-green-700">
                  <Mic className="size-3.5" aria-hidden /> voice note attached
                </p>
              )}
              <Button type="submit" size="touch" className="w-full">
                {t("common_add")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full border-brand text-brand hover:bg-brand-light" onClick={exportDiary}>
          <Download className="size-4" aria-hidden />
          {t("diary_export")}
        </Button>

        <ul className="flex flex-col gap-2">
          {entries
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <li key={entry.id}>
                <Card className="py-3">
                  <CardContent className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {t(`diary_${entry.type}` as const)}: {entry.description}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{entry.date}</span>
                        {entry.amountInr != null && <span>· ₹{entry.amountInr}</span>}
                        {entry.voiceNoteRef && <Mic className="size-3.5" aria-hidden />}
                        {!entry.synced && <Badge variant="secondary">offline</Badge>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="tap-target flex shrink-0 items-center justify-center rounded-full text-red-600"
                      aria-label={t("common_delete")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      </div>
    </PageShell>
  );
}

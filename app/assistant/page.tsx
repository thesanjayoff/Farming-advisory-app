"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { VoiceButton } from "@/components/VoiceButton";
import { SpeakButton, speak } from "@/components/SpeakButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { enqueueSync, getSyncQueue, removeSyncItem } from "@/lib/db/client";
import type { AssistantAnswer } from "@/lib/kb/assistantEngine";
import type { SyncQueueItem } from "@/lib/types";

interface ChatTurn {
  id: string;
  question: string;
  answer: AssistantAnswer | null;
  loading: boolean;
  queuedOffline?: boolean;
}

interface AssistantQuestionPayload {
  question: string;
  lang: "ta" | "en" | "hi" | "te";
  point?: { lat: number; lon: number };
  cropId?: string;
  sowingDate?: string;
  simplify?: boolean;
}

function newTurnId(): string {
  return `turn-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export default function AssistantPage() {
  const { t, lang } = useI18n();
  const { activePlot } = useFarmProfile();
  const online = useOnlineStatus();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const flushing = useRef(false);

  // Offline queue flush: when connectivity returns, re-ask any question that
  // was queued while offline (farmer's voice/text question gets answered as
  // soon as the device is back online, instead of being silently lost).
  useEffect(() => {
    if (!online || flushing.current) return;
    flushing.current = true;
    (async () => {
      const queue = await getSyncQueue();
      const assistantItems = queue.filter((item) => item.kind === "assistant_question");
      for (const item of assistantItems) {
        const payload = item.payload as AssistantQuestionPayload;
        const succeeded = await ask(payload.question, undefined, payload);
        if (succeeded) await removeSyncItem(item.id);
      }
      flushing.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-runs on the online/offline transition
  }, [online]);

  async function ask(
    question: string,
    simplifyOf?: string,
    overridePayload?: AssistantQuestionPayload
  ): Promise<boolean> {
    if (!question.trim()) return false;
    const id = newTurnId();
    setTurns((prev) => [...prev, { id, question, answer: null, loading: true }]);
    setInput("");

    const primaryCrop = activePlot?.crops[0];
    const payload: AssistantQuestionPayload = overridePayload ?? {
      question,
      lang,
      point: activePlot?.location,
      cropId: primaryCrop?.cropId,
      sowingDate: primaryCrop?.sowingDate,
      simplify: Boolean(simplifyOf),
    };

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const answer: AssistantAnswer = await res.json();
      setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, answer, loading: false } : turn)));
      speak(lang === "ta" ? answer.textTa : answer.textEn, lang);
      return true;
    } catch {
      if (!overridePayload) {
        // First failure while offline: queue it for automatic retry instead
        // of just dropping the question (principle: "queue voice questions
        // ... to sync later").
        const syncItem: SyncQueueItem = {
          id: `sync-${id}`,
          kind: "assistant_question",
          payload,
          createdAt: new Date().toISOString(),
          attempts: 0,
        };
        await enqueueSync(syncItem);
      }
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                loading: false,
                queuedOffline: !overridePayload,
                answer: {
                  kind: "out_of_scope_refusal",
                  textEn: overridePayload
                    ? "Still offline — will try again once connected."
                    : "You're offline. This question is saved and will be answered automatically once you're back online.",
                  textTa: overridePayload
                    ? "இன்னும் ஆஃப்லைனில் உள்ளீர்கள் — இணைந்ததும் மீண்டும் முயற்சிக்கும்."
                    : "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். இந்த கேள்வி சேமிக்கப்பட்டுள்ளது, இணைந்ததும் தானாக பதிலளிக்கப்படும்.",
                  citations: [],
                  confirmWithOfficer: false,
                  usedLlm: false,
                },
              }
            : turn
        )
      );
      return false;
    }
  }

  return (
    <PageShell title={t("assistant_title")} showBack>
      <div className="flex min-h-[60vh] flex-col gap-4 pb-28">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("assistant_untrusted_notice")}</p>
        )}
        {turns.map((turn) => (
          <div key={turn.id} className="flex flex-col gap-2">
            <div className="self-end rounded-xl bg-brand px-3 py-2 text-sm text-white">{turn.question}</div>
            {turn.loading ? (
              <p className="text-sm text-muted-foreground">{t("assistant_thinking")}</p>
            ) : turn.answer ? (
              <Card className="max-w-[90%] self-start py-3">
                <CardContent className="flex flex-col gap-2 text-sm">
                  {turn.queuedOffline && (
                    <Badge variant="secondary" className="w-fit text-amber-700">
                      ⏳ queued offline
                    </Badge>
                  )}
                  <p className="whitespace-pre-wrap">{lang === "ta" ? turn.answer.textTa : turn.answer.textEn}</p>
                  {turn.answer.confirmWithOfficer && (
                    <p className="font-medium text-amber-700">{t("assistant_confirm_officer")}</p>
                  )}
                  {turn.answer.kccNumber && (
                    <p className="text-xs text-muted-foreground">{t("assistant_kcc_line")}</p>
                  )}
                  {turn.answer.citations.length > 0 && (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {turn.answer.citations.map((c, i) => (
                        <p key={i}>
                          {t("assistant_source_label")}: {c.source}
                          {c.page ? `, ${c.page}` : ""}
                          {!c.expertVerified && " (unverified seed data)"}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <SpeakButton text={lang === "ta" ? turn.answer.textTa : turn.answer.textEn} />
                    <Button variant="outline" size="sm" onClick={() => ask(turn.question, turn.id)}>
                      {t("common_explain_simply")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 flex items-center gap-2 border-t border-border bg-background px-4 py-3">
        <VoiceButton onResult={(text) => ask(text)} />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder={t("assistant_placeholder")}
          className="tap-target flex-1 rounded-full"
        />
        <Button size="icon" className="tap-target rounded-full" onClick={() => ask(input)} aria-label={t("assistant_placeholder")}>
          <Send className="size-5" aria-hidden />
        </Button>
      </div>
    </PageShell>
  );
}

"use client";

import { useRef, useState } from "react";
import { saveBlob } from "@/lib/db/client";
import { useI18n } from "@/lib/i18n/context";

export function VoiceNoteRecorder({ onSaved }: { onSaved: (blobId: string) => void }) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) {
      setUnsupported(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const id = `voice-${Date.now()}`;
        await saveBlob(id, blob);
        onSaved(id);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setUnsupported(true);
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  if (unsupported) {
    return <p className="text-xs text-neutral-500">Voice recording is not available on this device/browser.</p>;
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className={`tap-target flex items-center gap-2 rounded-lg border px-4 text-sm font-medium ${
        recording ? "border-red-400 bg-red-50 text-red-700" : "border-brand text-brand"
      }`}
    >
      {recording ? "⏹" : "🎙️"} {t("diary_voice_note")}
    </button>
  );
}

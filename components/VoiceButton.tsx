"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Hold-to-speak button. Uses the browser's built-in Web Speech API directly
 * when available (zero-latency, no audio upload — good for low bandwidth).
 * If the browser doesn't support it, this is a no-op and the parent should
 * let the farmer type instead; a true offline/on-device model or a server
 * provider (Bhashini/Sarvam, see lib/voice/registry.ts) is future work — see
 * README "Voice assistant" and "Evaluation and limitations".
 */
export function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  const { lang, t } = useI18n();
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setUnsupported(true);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === "ta" ? "ta-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (unsupported) {
    return null; // parent UI still offers typing — voice is additive, not required
  }

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      className={`tap-target flex items-center justify-center rounded-full text-3xl ${
        listening ? "bg-red-100 text-red-600" : "bg-brand-light text-brand"
      }`}
      style={{ width: 64, height: 64 }}
      aria-label={t("common_speak_question")}
    >
      🎤
    </button>
  );
}

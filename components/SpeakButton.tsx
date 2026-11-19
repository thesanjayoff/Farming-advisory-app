"use client";

import { useI18n } from "@/lib/i18n/context";

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const wanted = lang === "ta" ? "ta" : "en";
  return voices.find((v) => v.lang.toLowerCase().startsWith(wanted)) ?? voices[0];
}

export function speak(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "ta" ? "ta-IN" : "en-IN";
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export function SpeakButton({ text, again }: { text: string; again?: boolean }) {
  const { lang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      className="tap-target flex items-center gap-1 rounded-lg border border-brand px-3 text-sm font-medium text-brand"
    >
      🔊 {again ? t("common_listen_again") : t("common_listen")}
    </button>
  );
}

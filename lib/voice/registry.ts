import type { SpeechToTextProvider, TextToSpeechProvider } from "@/lib/voice/types";
import { BhashiniSttProvider, BhashiniTtsProvider } from "@/lib/voice/bhashini";
import { SarvamSttProvider, SarvamTtsProvider } from "@/lib/voice/sarvam";

// VOICE_PROVIDER selects the server-side speech provider: "bhashini",
// "sarvam", or unset/"browser" — in which case there is no server provider,
// and the client falls back to the browser's own Web Speech API (see
// components/VoiceButton.tsx / SpeakButton.tsx). This is the honest default:
// it works today with zero extra registration, is reasonably low-bandwidth
// (no audio upload round trip for TTS at all, and for STT only on browsers
// that need network for recognition), but it is NOT a true on-device offline
// model — see README "Voice assistant" and "Evaluation and limitations" for
// what a real offline fallback (e.g. a bundled Vosk/whisper.cpp model) would
// still require.
export function getConfiguredSttProvider(): SpeechToTextProvider | null {
  switch (process.env.VOICE_PROVIDER) {
    case "bhashini":
      return new BhashiniSttProvider();
    case "sarvam":
      return new SarvamSttProvider();
    default:
      return null;
  }
}

export function getConfiguredTtsProvider(): TextToSpeechProvider | null {
  switch (process.env.VOICE_PROVIDER) {
    case "bhashini":
      return new BhashiniTtsProvider();
    case "sarvam":
      return new SarvamTtsProvider();
    default:
      return null;
  }
}

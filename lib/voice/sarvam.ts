import type { SpeechToTextProvider, TextToSpeechProvider, SpeechToTextResult, TextToSpeechResult } from "@/lib/voice/types";
import { VoiceProviderError } from "@/lib/voice/types";

// Sarvam AI speech APIs — docs at https://docs.sarvam.ai/. Current default
// models per the docs/changelog at the time this adapter was written:
// STT = "saaras:v3" (speech-to-text-translate / transcription endpoint),
// TTS = "bulbul:v3" (11 languages, 30+ speakers). `saarika:v2.5` is legacy —
// prefer saaras:v3 for new integrations. VERIFY current model names and the
// exact request/response field names against docs.sarvam.ai before
// production use, since Sarvam has renamed/replaced model versions before.
// Required env var: SARVAM_API_KEY.
const STT_URL = "https://api.sarvam.ai/speech-to-text";
const TTS_URL = "https://api.sarvam.ai/text-to-speech";
const DEFAULT_STT_MODEL = "saaras:v3";
const DEFAULT_TTS_MODEL = "bulbul:v3";

function apiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new VoiceProviderError("Sarvam is not configured (set SARVAM_API_KEY)");
  return key;
}

export class SarvamSttProvider implements SpeechToTextProvider {
  readonly id = "sarvam";

  async transcribe(audioBase64: string, mimeType: string, lang: string): Promise<SpeechToTextResult> {
    const key = apiKey();
    const form = new FormData();
    const audioBuffer = Buffer.from(audioBase64, "base64");
    form.append("file", new Blob([audioBuffer], { type: mimeType }), "audio.webm");
    form.append("model", process.env.SARVAM_STT_MODEL ?? DEFAULT_STT_MODEL);
    form.append("language_code", lang === "ta" ? "ta-IN" : "en-IN");

    const res = await fetch(STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": key },
      body: form,
    });
    if (!res.ok) throw new VoiceProviderError(`Sarvam STT returned HTTP ${res.status}`);
    const json = await res.json();
    if (typeof json.transcript !== "string") {
      throw new VoiceProviderError("Sarvam STT response did not contain a transcript");
    }
    return { text: json.transcript, provider: this.id };
  }
}

export class SarvamTtsProvider implements TextToSpeechProvider {
  readonly id = "sarvam";

  async synthesize(text: string, lang: string): Promise<TextToSpeechResult> {
    const key = apiKey();
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": key },
      body: JSON.stringify({
        text,
        target_language_code: lang === "ta" ? "ta-IN" : "en-IN",
        model: process.env.SARVAM_TTS_MODEL ?? DEFAULT_TTS_MODEL,
      }),
    });
    if (!res.ok) throw new VoiceProviderError(`Sarvam TTS returned HTTP ${res.status}`);
    const json = await res.json();
    const audioBase64 = json?.audios?.[0];
    if (typeof audioBase64 !== "string") throw new VoiceProviderError("Sarvam TTS response did not contain audio");
    return { audioBase64, mimeType: "audio/wav", provider: this.id };
  }
}

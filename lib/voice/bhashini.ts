import type { SpeechToTextProvider, TextToSpeechProvider, SpeechToTextResult, TextToSpeechResult } from "@/lib/voice/types";
import { VoiceProviderError } from "@/lib/voice/types";

// Bhashini (Digital India Bhashini Division) ULCA-based ASR/TTS. Registration
// and credential generation happen via the integrator flow documented at
// https://bhashini.gitbook.io/bhashini-apis/pre-requisites-and-onboarding :
// sign up at bhashini.gov.in, confirm email, then generate a user ID + API
// key under "My Profile". The call pattern is two-step:
//   1. POST to the pipeline-config endpoint with your userID/API key and the
//      task (asr/tts) + language, which returns a per-call "inference key"
//      and the actual compute endpoint to call.
//   2. POST the audio (base64) / text to that compute endpoint with the
//      inference key to get the transcript / synthesized audio.
// This adapter implements that two-step shape, but the exact endpoint paths
// and request/response field names must be confirmed from the Bhashini
// dashboard after you register — see README "Data sources and licences"
// before enabling this in production. Required env vars: BHASHINI_USER_ID,
// BHASHINI_API_KEY, BHASHINI_PIPELINE_ID.
const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

function configured(): boolean {
  return Boolean(
    process.env.BHASHINI_USER_ID && process.env.BHASHINI_API_KEY && process.env.BHASHINI_PIPELINE_ID
  );
}

async function getPipelineConfig(task: "asr" | "tts", lang: string) {
  const res = await fetch(CONFIG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      userID: process.env.BHASHINI_USER_ID!,
      ulcaApiKey: process.env.BHASHINI_API_KEY!,
    },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: task, config: { language: { sourceLanguage: lang } } }],
      pipelineRequestConfig: { pipelineId: process.env.BHASHINI_PIPELINE_ID },
    }),
  });
  if (!res.ok) throw new VoiceProviderError(`Bhashini pipeline-config returned HTTP ${res.status}`);
  return res.json();
}

export class BhashiniSttProvider implements SpeechToTextProvider {
  readonly id = "bhashini";

  async transcribe(audioBase64: string, mimeType: string, lang: string): Promise<SpeechToTextResult> {
    if (!configured()) {
      throw new VoiceProviderError("Bhashini is not configured (set BHASHINI_USER_ID / BHASHINI_API_KEY / BHASHINI_PIPELINE_ID)");
    }
    const config = await getPipelineConfig("asr", lang);
    const endpoint = config?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceKey = config?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
    if (!endpoint || !inferenceKey) {
      throw new VoiceProviderError("Unexpected Bhashini pipeline-config response shape — verify against current docs");
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: inferenceKey },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: "asr", config: { language: { sourceLanguage: lang } } }],
        inputData: { audio: [{ audioContent: audioBase64 }] },
      }),
    });
    if (!res.ok) throw new VoiceProviderError(`Bhashini ASR compute returned HTTP ${res.status}`);
    const json = await res.json();
    const text = json?.pipelineResponse?.[0]?.output?.[0]?.source;
    if (typeof text !== "string") throw new VoiceProviderError("Bhashini ASR response did not contain transcript text");
    return { text, provider: this.id };
  }
}

export class BhashiniTtsProvider implements TextToSpeechProvider {
  readonly id = "bhashini";

  async synthesize(text: string, lang: string): Promise<TextToSpeechResult> {
    if (!configured()) {
      throw new VoiceProviderError("Bhashini is not configured (set BHASHINI_USER_ID / BHASHINI_API_KEY / BHASHINI_PIPELINE_ID)");
    }
    const config = await getPipelineConfig("tts", lang);
    const endpoint = config?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceKey = config?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
    if (!endpoint || !inferenceKey) {
      throw new VoiceProviderError("Unexpected Bhashini pipeline-config response shape — verify against current docs");
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: inferenceKey },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: lang } } }],
        inputData: { input: [{ source: text }] },
      }),
    });
    if (!res.ok) throw new VoiceProviderError(`Bhashini TTS compute returned HTTP ${res.status}`);
    const json = await res.json();
    const audioBase64 = json?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    if (typeof audioBase64 !== "string") throw new VoiceProviderError("Bhashini TTS response did not contain audio");
    return { audioBase64, mimeType: "audio/wav", provider: this.id };
  }
}

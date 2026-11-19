export interface SpeechToTextResult {
  text: string;
  provider: string;
}

export interface TextToSpeechResult {
  audioBase64: string;
  mimeType: string;
  provider: string;
}

export interface SpeechToTextProvider {
  readonly id: string;
  transcribe(audioBase64: string, mimeType: string, lang: string): Promise<SpeechToTextResult>;
}

export interface TextToSpeechProvider {
  readonly id: string;
  synthesize(text: string, lang: string): Promise<TextToSpeechResult>;
}

export class VoiceProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "VoiceProviderError";
  }
}

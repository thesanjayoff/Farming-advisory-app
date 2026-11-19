import { NextRequest, NextResponse } from "next/server";
import { getConfiguredTtsProvider } from "@/lib/voice/registry";

export async function POST(req: NextRequest) {
  const provider = getConfiguredTtsProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "no_server_provider", message: "Use the browser's own SpeechSynthesis API on the client instead." },
      { status: 501 }
    );
  }
  const { text, lang } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  try {
    const result = await provider.synthesize(text, lang ?? "ta");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "tts_failed", detail: String(err) }, { status: 502 });
  }
}

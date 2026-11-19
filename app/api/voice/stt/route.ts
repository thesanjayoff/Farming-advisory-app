import { NextRequest, NextResponse } from "next/server";
import { getConfiguredSttProvider } from "@/lib/voice/registry";

export async function POST(req: NextRequest) {
  const provider = getConfiguredSttProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "no_server_provider", message: "Use the browser's own Web Speech API on the client instead." },
      { status: 501 }
    );
  }
  const { audioBase64, mimeType, lang } = await req.json();
  if (!audioBase64 || !mimeType) {
    return NextResponse.json({ error: "audioBase64 and mimeType are required" }, { status: 400 });
  }
  try {
    const result = await provider.transcribe(audioBase64, mimeType, lang ?? "ta");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "stt_failed", detail: String(err) }, { status: 502 });
  }
}

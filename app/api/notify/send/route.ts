import { NextRequest, NextResponse } from "next/server";
import { TelegramNotifyProvider } from "@/lib/notify/telegram";
import { WhatsAppNotifyProvider } from "@/lib/notify/whatsapp";
import type { NotifyProvider } from "@/lib/notify/types";

const providers: Record<string, NotifyProvider> = {
  telegram: new TelegramNotifyProvider(),
  whatsapp: new WhatsAppNotifyProvider(),
};

export async function POST(req: NextRequest) {
  const { provider, target, message } = (await req.json()) as {
    provider?: string;
    target?: string;
    message?: string;
  };

  if (!provider || !target || !message) {
    return NextResponse.json({ error: "provider, target and message are required" }, { status: 400 });
  }

  const impl = providers[provider];
  if (!impl) {
    return NextResponse.json({ error: `Unknown provider "${provider}"` }, { status: 400 });
  }

  try {
    await impl.send(target, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "send_failed", detail: String(err) }, { status: 502 });
  }
}

import type { NotifyProvider } from "@/lib/notify/types";
import { NotifyProviderError } from "@/lib/notify/types";

// Telegram Bot API — the simplest of the two optional alert channels the
// brief asks for (no business verification needed, unlike WhatsApp's
// Business API — see whatsapp.ts). Create a bot with @BotFather, put its
// token in TELEGRAM_BOT_TOKEN, and the farmer sends /start to the bot once
// to get a chat ID they enter into Settings (`target` here is that chat ID).
const API_BASE = "https://api.telegram.org";

export class TelegramNotifyProvider implements NotifyProvider {
  readonly id = "telegram";

  async send(chatId: string, message: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new NotifyProviderError("Telegram is not configured (set TELEGRAM_BOT_TOKEN)");
    }
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      throw new NotifyProviderError(`Telegram API returned HTTP ${res.status}`);
    }
  }
}

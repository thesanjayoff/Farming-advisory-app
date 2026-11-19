import { describe, expect, it } from "vitest";
import { TelegramNotifyProvider } from "@/lib/notify/telegram";
import { WhatsAppNotifyProvider } from "@/lib/notify/whatsapp";

describe("notify providers — fail closed when unconfigured", () => {
  it("Telegram throws a clear error instead of silently no-oping without a bot token", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const provider = new TelegramNotifyProvider();
    await expect(provider.send("123", "test")).rejects.toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it("WhatsApp throws a clear error instead of silently no-oping without credentials", async () => {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const provider = new WhatsAppNotifyProvider();
    await expect(provider.send("+911234567890", "test")).rejects.toThrow(/WHATSAPP_PHONE_NUMBER_ID/);
  });
});

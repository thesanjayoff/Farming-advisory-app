import type { NotifyProvider } from "@/lib/notify/types";
import { NotifyProviderError } from "@/lib/notify/types";

// WhatsApp Business Platform (Cloud API). Unlike Telegram, this needs a Meta
// Business verification and an approved message template for any
// farmer-initiated-outside-24h message — a real deployment should budget
// time for that approval process before relying on this. This adapter
// implements the Cloud API's basic text-message call shape; verify your
// phone-number-id and permanent access token setup at
// https://developers.facebook.com/docs/whatsapp/cloud-api before use.
// Required env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN.
export class WhatsAppNotifyProvider implements NotifyProvider {
  readonly id = "whatsapp";

  async send(toPhoneE164: string, message: string): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberId || !token) {
      throw new NotifyProviderError(
        "WhatsApp is not configured (set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN)"
      );
    }
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhoneE164,
        type: "text",
        text: { body: message },
      }),
    });
    if (!res.ok) {
      throw new NotifyProviderError(`WhatsApp Cloud API returned HTTP ${res.status}`);
    }
  }
}

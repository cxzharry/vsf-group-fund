const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** Resolve public app URL — for inline-keyboard links in Telegram notifications. */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://nopay-freelunch.vercel.app"
  );
}

export interface TelegramLinkButton {
  /** Full https URL — Telegram blocks relative paths */
  url: string;
  /** Button caption (default "Mở app") */
  label?: string;
}

/** Send a text message to a Telegram chat, optionally with a URL button */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  link?: TelegramLinkButton
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (link?.url) {
      body.reply_markup = {
        inline_keyboard: [[{ text: link.label ?? "Mở app", url: link.url }]],
      };
    }
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send notification to a member if they have telegram linked */
export async function notifyMember(
  chatId: string | null,
  message: string,
  link?: TelegramLinkButton
): Promise<void> {
  if (!chatId) return;
  await sendTelegramMessage(chatId, message, link);
}

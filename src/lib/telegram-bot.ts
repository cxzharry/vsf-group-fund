const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** Send a text message to a Telegram chat */
export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send notification to a member if they have telegram linked */
export async function notifyMember(
  chatId: string | null,
  message: string
): Promise<void> {
  if (!chatId) return;
  await sendTelegramMessage(chatId, message);
}

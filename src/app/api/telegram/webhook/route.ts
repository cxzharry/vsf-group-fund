import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Telegram bot webhook handler.
 * When user sends /start <email> to the bot, we link their chat_id to their member record.
 */
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false });

  const body = await request.json();
  const message = body?.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  // Handle /start command: /start email@example.com
  if (text.startsWith("/start")) {
    const parts = text.split(/\s+/);
    const email = parts[1];

    if (!email) {
      await sendReply(
        chatId,
        "Chào bạn! Để liên kết tài khoản, gửi:\n/start email@example.com\n\n(dùng email đã đăng ký trên Group Fund)"
      );
      return NextResponse.json({ ok: true });
    }

    // Find member by email and link chat_id
    const { data: member, error } = await supabase
      .from("members")
      .update({ telegram_chat_id: chatId })
      .eq("email", email.toLowerCase())
      .select("display_name")
      .single();

    if (error || !member) {
      await sendReply(
        chatId,
        `Không tìm thấy tài khoản với email: ${email}\nHãy đăng nhập Group Fund trước rồi thử lại.`
      );
    } else {
      await sendReply(
        chatId,
        `✅ Đã liên kết Telegram cho ${member.display_name}!\nBạn sẽ nhận thông báo chia tiền qua đây.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

async function sendReply(chatId: string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}

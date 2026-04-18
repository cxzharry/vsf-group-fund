/**
 * test-noti-new-bill.ts
 * Creates a small test bill in UAT Team group and triggers /api/notify → Telegram.
 * Usage:
 *   APP_URL=https://nopay-freelunch.vercel.app npx tsx scripts/test-noti-new-bill.ts
 *   (or omit APP_URL to default to http://localhost:3000 — run `npm run dev` first)
 *
 * Prerequisites:
 *   - .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - Target members have telegram_chat_id set (visit /account → Kết nối Telegram)
 *   - TELEGRAM_BOT_TOKEN set in deploy env
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GROUP_ID = "ff8f4a71-c852-42df-a2f4-a0cbe5ded63f";

async function main() {
  console.log("=== Test Noti: New Bill ===");
  console.log(`APP_URL=${APP_URL}\n`);

  // Resolve PO (payer) + a few members
  const { data: members } = await supabase
    .from("members")
    .select("id, email, display_name, telegram_chat_id")
    .in("email", [
      "cxzharry@gmail.com",
      "minh+uat@nopay.test",
      "an+uat@nopay.test",
    ]);

  if (!members || members.length === 0) {
    console.error("No UAT members found — run seed:uat first");
    process.exit(1);
  }

  const byEmail = new Map(members.map((m) => [m.email, m]));
  const po = byEmail.get("cxzharry@gmail.com");
  const minh = byEmail.get("minh+uat@nopay.test");
  const an = byEmail.get("an+uat@nopay.test");

  if (!po || !minh || !an) {
    console.error("Missing key members (PO / Minh / An)");
    process.exit(1);
  }

  console.log("Members + telegram_chat_id:");
  for (const m of members) {
    console.log(`  - ${m.display_name ?? m.email}: ${m.telegram_chat_id ? "✓ linked" : "✗ NOT linked"}`);
  }
  const noTgCount = members.filter((m) => !m.telegram_chat_id).length;
  if (noTgCount > 0) {
    console.log(`\n  [warn] ${noTgCount} member(s) without telegram_chat_id — they will receive no Telegram notification.`);
    console.log(`  To link: login as that member → /account → "Kết nối Telegram".\n`);
  }

  // Create a tiny bill: PO pays 60k, equal split among PO+Minh+An → each 20k
  const title = `Test noti ${new Date().toLocaleTimeString("vi-VN")}`;
  const total = 60_000;
  const share = 20_000;

  const { data: newBill, error: billErr } = await supabase
    .from("bills")
    .insert({
      title,
      total_amount: total,
      paid_by: po.id,
      created_by: po.id,
      split_type: "equal",
      bill_type: "standard",
      status: "active",
      group_id: GROUP_ID,
    })
    .select("id")
    .single();

  if (billErr || !newBill) {
    console.error("Insert bill failed:", billErr?.message);
    process.exit(1);
  }

  await supabase.from("bill_participants").insert([
    { bill_id: newBill.id, member_id: po.id, amount: share },
    { bill_id: newBill.id, member_id: minh.id, amount: share },
    { bill_id: newBill.id, member_id: an.id, amount: share },
  ]);

  await supabase.from("debts").insert([
    { bill_id: newBill.id, debtor_id: minh.id, creditor_id: po.id, amount: share, remaining: share, status: "pending" },
    { bill_id: newBill.id, debtor_id: an.id, creditor_id: po.id, amount: share, remaining: share, status: "pending" },
  ]);

  await supabase.from("chat_messages").insert({
    group_id: GROUP_ID,
    sender_id: po.id,
    message_type: "bill_card",
    content: title,
    metadata: { bill_id: newBill.id, category: "khac" },
  });

  console.log(`\n[created] bill "${title}" (id=${newBill.id}) — total ${total}đ, 2 debtors @ ${share}đ each`);

  // Hit /api/notify
  console.log(`\nPOST ${APP_URL}/api/notify ...`);
  const resp = await fetch(`${APP_URL}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "new_bill",
      payload: {
        billId: newBill.id,
        billTitle: title,
        totalAmount: total,
        paidById: po.id,
      },
    }),
  });

  const body = await resp.text();
  console.log(`  status ${resp.status} — ${body}`);

  if (resp.ok) {
    console.log(`\n✓ Done. Check Telegram on: PO + 2 debtors (Minh, An) if they have linked chat.`);
  } else {
    console.log(`\n✗ Notify API returned non-OK. Check server logs + TELEGRAM_BOT_TOKEN env.`);
  }
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exit(1);
});

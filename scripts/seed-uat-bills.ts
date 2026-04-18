/**
 * seed-uat-bills.ts
 * Seeds realistic bills into UAT Team group (ff8f4a71-c852-42df-a2f4-a0cbe5ded63f).
 * Idempotent: checks title+group_id+date before inserting.
 *
 * Usage: npm run seed:uat-bills
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GROUP_ID = "ff8f4a71-c852-42df-a2f4-a0cbe5ded63f";

// Emails in order: Minh, An, Linh, Duy, Tú, PO
const MEMBER_EMAILS = [
  "minh+uat@nopay.test",
  "an+uat@nopay.test",
  "linh+uat@nopay.test",
  "duy+uat@nopay.test",
  "tu+uat@nopay.test",
  "cxzharry@gmail.com",
];

type MemberMap = Record<string, string>; // email → member_id

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 30, 0, 0);
  return d.toISOString();
}

async function resolveMemberIds(): Promise<MemberMap> {
  const { data, error } = await supabase
    .from("members")
    .select("id, email")
    .in("email", MEMBER_EMAILS);

  if (error) throw new Error(`resolve members failed: ${error.message}`);
  if (!data || data.length === 0) throw new Error("No members found — run seed:uat first");

  const map: MemberMap = {};
  for (const row of data) map[row.email] = row.id;

  const missing = MEMBER_EMAILS.filter((e) => !map[e]);
  if (missing.length > 0) console.warn(`  [warn] missing members: ${missing.join(", ")}`);

  return map;
}

async function billExists(title: string, createdAt: string): Promise<string | null> {
  // Check by title + group_id + date (day precision)
  const datePrefix = createdAt.substring(0, 10);
  const { data } = await supabase
    .from("bills")
    .select("id")
    .eq("group_id", GROUP_ID)
    .eq("title", title)
    .gte("created_at", `${datePrefix}T00:00:00Z`)
    .lte("created_at", `${datePrefix}T23:59:59Z`)
    .maybeSingle();

  return data?.id ?? null;
}

async function insertBill(params: {
  title: string;
  total_amount: number;
  paid_by: string;
  created_by: string;
  split_type: "equal" | "custom";
  bill_type?: "standard" | "open";
  status?: "active" | "closed";
  created_at: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("bills")
    .insert({
      title: params.title,
      total_amount: params.total_amount,
      paid_by: params.paid_by,
      created_by: params.created_by,
      split_type: params.split_type,
      bill_type: params.bill_type ?? "standard",
      status: params.status ?? "active",
      group_id: GROUP_ID,
      created_at: params.created_at,
    })
    .select("id")
    .single();

  if (error) throw new Error(`insert bill "${params.title}": ${error.message}`);
  return data.id;
}

async function insertParticipants(
  billId: string,
  participants: { member_id: string; amount: number }[]
) {
  const { error } = await supabase.from("bill_participants").insert(
    participants.map((p) => ({ bill_id: billId, member_id: p.member_id, amount: p.amount }))
  );
  if (error) throw new Error(`insert participants: ${error.message}`);
}

async function insertDebt(params: {
  bill_id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  remaining: number;
  status: "pending" | "confirmed" | "partial";
  created_at: string;
}) {
  const { error } = await supabase.from("debts").insert(params);
  if (error) throw new Error(`insert debt: ${error.message}`);
}

async function insertChatMessage(params: {
  message_type: "text" | "bill_card" | "transfer_card" | "ai_response" | "system";
  content: string;
  sender_id: string;
  metadata?: object;
  created_at: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ group_id: GROUP_ID, ...params })
    .select("id")
    .single();
  if (error) throw new Error(`insert chat_message: ${error.message}`);
  return data.id;
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== UAT Bills Seed ===\n");

  const m = await resolveMemberIds();
  const minh = m["minh+uat@nopay.test"];
  const an = m["an+uat@nopay.test"];
  const linh = m["linh+uat@nopay.test"];
  const duy = m["duy+uat@nopay.test"];
  const tu = m["tu+uat@nopay.test"];
  const po = m["cxzharry@gmail.com"];

  if (!minh || !po) throw new Error("Critical members not found — run seed:uat first");

  let billsCreated = 0;
  let billsSkipped = 0;
  let debtsCreated = 0;
  let checkinsCreated = 0;
  let msgsCreated = 0;

  // ── Bill 1: Ăn trưa team (12 days ago, Minh paid, equal 6) ──
  {
    const title = "Ăn trưa team";
    const at = daysAgo(12);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      const id = await insertBill({
        title, total_amount: 2_400_000, paid_by: minh, created_by: minh,
        split_type: "equal", created_at: at,
      });
      const share = 400_000;
      const debtors = [an, linh, duy, tu, po];
      await insertParticipants(id, [minh, ...debtors].map((mid) => ({ member_id: mid, amount: share })));

      // An + Linh confirmed (paid), rest pending
      await insertDebt({ bill_id: id, debtor_id: an,   creditor_id: minh, amount: share, remaining: 0, status: "confirmed", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: linh, creditor_id: minh, amount: share, remaining: 0, status: "confirmed", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: duy,  creditor_id: minh, amount: share, remaining: share, status: "pending", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: tu,   creditor_id: minh, amount: share, remaining: share, status: "pending", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: po,   creditor_id: minh, amount: share, remaining: share, status: "pending", created_at: at });

      debtsCreated += 5;
      billsCreated++;
      console.log(`  [created] "${title}" (id: ${id})`);

      // Chat message
      const msgAt = daysAgo(12);
      await insertChatMessage({ message_type: "text", content: "Ăn trưa vui quá! Mọi người nhớ trả tiền nha 😄", sender_id: minh, created_at: msgAt });
      msgsCreated++;
    }
  }

  // ── Bill 2: Cafe sáng (7 days ago, An paid, equal 4) ──
  {
    const title = "Cafe sáng thứ 3";
    const at = daysAgo(7);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      const id = await insertBill({
        title, total_amount: 180_000, paid_by: an, created_by: an,
        split_type: "equal", created_at: at,
      });
      const share = 45_000;
      await insertParticipants(id, [an, minh, linh, po].map((mid) => ({ member_id: mid, amount: share })));
      await insertDebt({ bill_id: id, debtor_id: minh, creditor_id: an, amount: share, remaining: share, status: "pending", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: linh, creditor_id: an, amount: share, remaining: share, status: "pending", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: po,   creditor_id: an, amount: share, remaining: share, status: "pending", created_at: at });

      debtsCreated += 3;
      billsCreated++;
      console.log(`  [created] "${title}" (id: ${id})`);
    }
  }

  // ── Bill 3: Lẩu nhậu (5 days ago, Minh paid, custom) ──
  {
    const title = "Lẩu nhậu";
    const at = daysAgo(5);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      // Minh 350k, An 300k, Linh 200k, Tú 350k, PO 300k = 1.500k
      const id = await insertBill({
        title, total_amount: 1_500_000, paid_by: minh, created_by: minh,
        split_type: "custom", created_at: at,
      });
      const parts = [
        { member_id: minh, amount: 350_000 },
        { member_id: an,   amount: 300_000 },
        { member_id: linh, amount: 200_000 },
        { member_id: tu,   amount: 350_000 },
        { member_id: po,   amount: 300_000 },
      ];
      await insertParticipants(id, parts);

      for (const p of parts.filter((x) => x.member_id !== minh)) {
        await insertDebt({ bill_id: id, debtor_id: p.member_id, creditor_id: minh, amount: p.amount, remaining: p.amount, status: "pending", created_at: at });
      }

      debtsCreated += 4;
      billsCreated++;
      console.log(`  [created] "${title}" (id: ${id})`);
    }
  }

  // ── Bill 4: BBQ dinner (2 days ago, Minh paid, standard, 6 participants) ──
  {
    const title = "Ăn tối BBQ";
    const at = daysAgo(2);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      const share = 200_000;
      const id = await insertBill({
        title, total_amount: 1_200_000, paid_by: minh, created_by: minh,
        split_type: "equal", bill_type: "standard", status: "active", created_at: at,
      });

      // 6 participants (all members)
      const allMembers = [minh, an, linh, duy, tu, po];
      await insertParticipants(id, allMembers.map((mid) => ({ member_id: mid, amount: share })));

      // 5 debts: non-payers → Minh
      for (const debtor of [an, linh, duy, tu, po]) {
        await insertDebt({ bill_id: id, debtor_id: debtor, creditor_id: minh, amount: share, remaining: share, status: "pending", created_at: at });
        debtsCreated++;
      }

      billsCreated++;
      console.log(`  [created] "${title}" (standard, 6 participants, 5 debts, id: ${id})`);
    }
  }

  // ── Bill 7: Open bill — Ăn trưa T5 mở (3 days ago, An created, open) ──
  {
    const title = "Ăn trưa T5 mở";
    const at = daysAgo(3);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      const perPerson = 150_000; // 900k / 6 per-person rate
      const id = await insertBill({
        title, total_amount: 900_000, paid_by: an, created_by: an,
        split_type: "equal", bill_type: "open", status: "active", created_at: at,
      });

      // 2 check-ins: Linh + Tú
      for (const mid of [linh, tu]) {
        const { error } = await supabase.from("bill_checkins").insert({
          bill_id: id, member_id: mid, added_by: an, checked_in_at: at,
        });
        if (error && !error.message.includes("duplicate")) throw new Error(`checkin: ${error.message}`);
        checkinsCreated++;
      }

      // Participants = checked-in members only (no debts — bill still open)
      await insertParticipants(id, [linh, tu].map((mid) => ({ member_id: mid, amount: perPerson })));

      billsCreated++;
      console.log(`  [created] "${title}" (open bill, 2 check-ins, id: ${id})`);
    }
  }

  // ── Bill 5: Transfer — An → PO 115k (1 day ago) ──
  {
    const transferContent = JSON.stringify({ from: an, to: po, amount: 115_000 });
    const at = daysAgo(1);

    // Check by content + date to avoid duplicates
    const datePrefix = at.substring(0, 10);
    const { data: existingMsg } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("group_id", GROUP_ID)
      .eq("message_type", "transfer_card")
      .gte("created_at", `${datePrefix}T00:00:00Z`)
      .lte("created_at", `${datePrefix}T23:59:59Z`)
      .maybeSingle();

    if (existingMsg) {
      console.log(`  [skip] transfer bill An→PO`);
      billsSkipped++;
    } else {
      await insertChatMessage({
        message_type: "transfer_card",
        content: "An chuyển 115.000₫ cho Harry",
        sender_id: an,
        metadata: { from_member_id: an, to_member_id: po, amount: 115_000, currency: "VND" },
        created_at: at,
      });
      msgsCreated++;
      billsCreated++;
      console.log(`  [created] transfer_card: An → PO 115.000₫`);
    }
  }

  // ── Bill 6: Grab ship đồ ăn (yesterday, PO paid, split 3) ──
  {
    const title = "Grab ship đồ ăn";
    const at = daysAgo(1);
    const existing = await billExists(title, at);

    if (existing) {
      console.log(`  [skip] "${title}"`);
      billsSkipped++;
    } else {
      // 340k / 3 = 113.333, round: PO=114k, Minh=113k, Duy=113k
      const id = await insertBill({
        title, total_amount: 340_000, paid_by: po, created_by: po,
        split_type: "custom", created_at: at,
      });
      await insertParticipants(id, [
        { member_id: po,   amount: 114_000 },
        { member_id: minh, amount: 113_000 },
        { member_id: duy,  amount: 113_000 },
      ]);
      await insertDebt({ bill_id: id, debtor_id: minh, creditor_id: po, amount: 113_000, remaining: 113_000, status: "pending", created_at: at });
      await insertDebt({ bill_id: id, debtor_id: duy,  creditor_id: po, amount: 113_000, remaining: 113_000, status: "pending", created_at: at });

      debtsCreated += 2;
      billsCreated++;
      console.log(`  [created] "${title}" (id: ${id})`);
    }
  }

  // ── Summary ──
  console.log("\n=== Done ===");
  console.log(`Bills created:  ${billsCreated}`);
  console.log(`Bills skipped:  ${billsSkipped} (idempotent)`);
  console.log(`Debts created:  ${debtsCreated}`);
  console.log(`Check-ins:      ${checkinsCreated}`);
  console.log(`Chat messages:  ${msgsCreated}`);
  console.log(`\nGroup ID: ${GROUP_ID}`);
  console.log("PO can view activity at: https://nopay-freelunch.vercel.app");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});

/**
 * fix-uat-bill4.ts
 * Fixes Bill 4 in UAT group:
 *   - Deletes old "Ăn tối BBQ" (open bill, 3 check-ins, 0 debts)
 *   - Re-inserts as standard bill with 6 participants + 5 debts
 *   - Inserts new Bill 7 "Ăn trưa T5 mở" (open bill, 2 check-ins)
 *
 * Usage: npm run fix:uat-bill4
 * Idempotent: skips if Bill 4 already standard type.
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

const MEMBER_EMAILS = [
  "minh+uat@nopay.test",
  "an+uat@nopay.test",
  "linh+uat@nopay.test",
  "duy+uat@nopay.test",
  "tu+uat@nopay.test",
  "cxzharry@gmail.com",
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 30, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log("=== Fix UAT Bill 4 ===\n");

  // Resolve member IDs
  const { data: members, error: mErr } = await supabase
    .from("members")
    .select("id, email")
    .in("email", MEMBER_EMAILS);
  if (mErr || !members) throw new Error(`resolve members: ${mErr?.message}`);

  const m: Record<string, string> = {};
  for (const row of members) m[row.email] = row.id;

  const minh = m["minh+uat@nopay.test"];
  const an = m["an+uat@nopay.test"];
  const linh = m["linh+uat@nopay.test"];
  const duy = m["duy+uat@nopay.test"];
  const tu = m["tu+uat@nopay.test"];
  const po = m["cxzharry@gmail.com"];
  if (!minh || !po) throw new Error("Critical members not found — run seed:uat first");

  // ── Check idempotency: Bill 4 already fixed? ──
  const { data: existingBbq } = await supabase
    .from("bills")
    .select("id, bill_type")
    .eq("group_id", GROUP_ID)
    .eq("title", "Ăn tối BBQ")
    .maybeSingle();

  if (existingBbq && existingBbq.bill_type === "standard") {
    console.log("  [skip] Bill 4 already standard type — already fixed.");
  } else {
    // ── Delete old Bill 4 cascade ──
    if (existingBbq) {
      const oldId = existingBbq.id;
      console.log(`  [delete] old Bill 4 (id: ${oldId}, type: ${existingBbq.bill_type})`);

      // payment_confirmations → debts → bill_participants → bill_checkins → bills
      await supabase.from("payment_confirmations").delete().eq("bill_id", oldId);
      await supabase.from("debts").delete().eq("bill_id", oldId);
      await supabase.from("bill_participants").delete().eq("bill_id", oldId);
      await supabase.from("bill_checkins").delete().eq("bill_id", oldId);
      const { error: delErr } = await supabase.from("bills").delete().eq("id", oldId);
      if (delErr) throw new Error(`delete bill: ${delErr.message}`);
      console.log("  [deleted] old Bill 4 + cascade");
    }

    // ── Insert new Bill 4: standard, 6 participants, 5 debts ──
    const at4 = daysAgo(2);
    const share = 200_000;

    const { data: bill4, error: b4Err } = await supabase
      .from("bills")
      .insert({
        title: "Ăn tối BBQ",
        total_amount: 1_200_000,
        paid_by: minh,
        created_by: minh,
        split_type: "equal",
        bill_type: "standard",
        status: "active",
        group_id: GROUP_ID,
        created_at: at4,
      })
      .select("id")
      .single();
    if (b4Err || !bill4) throw new Error(`insert Bill 4: ${b4Err?.message}`);

    const id4 = bill4.id;

    // 6 participants
    const allMembers = [minh, an, linh, duy, tu, po];
    const { error: pErr } = await supabase.from("bill_participants").insert(
      allMembers.map((mid) => ({ bill_id: id4, member_id: mid, amount: share }))
    );
    if (pErr) throw new Error(`insert participants: ${pErr.message}`);

    // 5 debts (non-payers → Minh)
    const debtors = [an, linh, duy, tu, po];
    for (const debtor of debtors) {
      const { error: dErr } = await supabase.from("debts").insert({
        bill_id: id4,
        debtor_id: debtor,
        creditor_id: minh,
        amount: share,
        remaining: share,
        status: "pending",
        created_at: at4,
      });
      if (dErr) throw new Error(`insert debt: ${dErr.message}`);
    }

    console.log(`  [created] new Bill 4 "Ăn tối BBQ" standard (id: ${id4})`);
    console.log(`  [created] 6 participants, 5 debts @ 200k each`);

    // Verify
    const { count: pCount } = await supabase
      .from("bill_participants")
      .select("id", { count: "exact", head: true })
      .eq("bill_id", id4);
    const { count: dCount } = await supabase
      .from("debts")
      .select("id", { count: "exact", head: true })
      .eq("bill_id", id4);
    console.log(`  [verify] participants=${pCount} (expect 6), debts=${dCount} (expect 5)`);
  }

  // ── Bill 7: Open bill "Ăn trưa T5 mở" ──
  const bill7Title = "Ăn trưa T5 mở";
  const at7 = daysAgo(3);
  const datePrefix7 = at7.substring(0, 10);

  const { data: existing7 } = await supabase
    .from("bills")
    .select("id")
    .eq("group_id", GROUP_ID)
    .eq("title", bill7Title)
    .gte("created_at", `${datePrefix7}T00:00:00Z`)
    .lte("created_at", `${datePrefix7}T23:59:59Z`)
    .maybeSingle();

  if (existing7) {
    console.log(`  [skip] Bill 7 "${bill7Title}" already exists`);
  } else {
    const perPerson = 150_000; // 900k / 6 per-person rate

    const { data: bill7, error: b7Err } = await supabase
      .from("bills")
      .insert({
        title: bill7Title,
        total_amount: 900_000,
        paid_by: an,
        created_by: an,
        split_type: "equal",
        bill_type: "open",
        status: "active",
        group_id: GROUP_ID,
        created_at: at7,
      })
      .select("id")
      .single();
    if (b7Err || !bill7) throw new Error(`insert Bill 7: ${b7Err?.message}`);

    const id7 = bill7.id;

    // 2 check-ins: Linh + Tú
    for (const mid of [linh, tu]) {
      const { error: cErr } = await supabase.from("bill_checkins").insert({
        bill_id: id7,
        member_id: mid,
        added_by: an,
        checked_in_at: at7,
      });
      if (cErr && !cErr.message.includes("duplicate")) throw new Error(`checkin: ${cErr.message}`);
    }

    // Participants for checked-in members
    const { error: pErr7 } = await supabase.from("bill_participants").insert(
      [linh, tu].map((mid) => ({ bill_id: id7, member_id: mid, amount: perPerson }))
    );
    if (pErr7) throw new Error(`insert participants Bill 7: ${pErr7.message}`);

    console.log(`  [created] Bill 7 "${bill7Title}" (open, id: ${id7})`);
    console.log(`  [created] 2 check-ins (Linh + Tú), no debts yet`);
  }

  console.log("\n=== Fix complete ===");
  console.log("PO balance change: +1.000.000₫ owed to Minh (Bill 4 now has PO as debtor)");
}

main().catch((err) => {
  console.error("\nFix failed:", err.message);
  process.exit(1);
});

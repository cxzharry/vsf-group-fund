/**
 * seed-uat-bank-info.ts
 * Updates UAT personas with fake-but-realistic bank info.
 * Idempotent: skips if bank_name already set.
 *
 * Usage: npm run seed:uat-bank-info
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ────────────────────────────────────────────────────────────
// Bank info per persona
// ────────────────────────────────────────────────────────────
const BANK_DATA: Array<{
  email: string;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
}> = [
  {
    email: "minh+uat@nopay.test",
    bank_name: "Techcombank",
    bank_account_no: "1701456789",
    bank_account_name: "NGUYEN VAN MINH",
  },
  {
    email: "an+uat@nopay.test",
    bank_name: "MB Bank",
    bank_account_no: "0987654321",
    bank_account_name: "PHAM THI AN",
  },
  {
    email: "linh+uat@nopay.test",
    bank_name: "Vietcombank",
    bank_account_no: "1012345678",
    bank_account_name: "TRAN THI LINH",
  },
  {
    email: "duy+uat@nopay.test",
    bank_name: "VPBank",
    bank_account_no: "8812345678",
    bank_account_name: "LE VAN DUY",
  },
  {
    email: "tu+uat@nopay.test",
    bank_name: "ACB",
    bank_account_no: "123456789",
    bank_account_name: "VU MINH TU",
  },
];

const PO_EMAIL = "cxzharry@gmail.com";
const PO_BANK_FALLBACK = {
  bank_name: "Techcombank",
  bank_account_no: "9999888877",
  bank_account_name: "HAI DO",
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
async function getMemberByEmail(email: string): Promise<{ id: string; bank_name: string | null } | null> {
  const { data } = await supabase
    .from("members")
    .select("id, bank_name")
    .eq("email", email)
    .maybeSingle();
  return data ?? null;
}

async function updateBankInfo(
  memberId: string,
  email: string,
  info: { bank_name: string; bank_account_no: string; bank_account_name: string }
) {
  const { error } = await supabase
    .from("members")
    .update(info)
    .eq("id", memberId);

  if (error) throw new Error(`update bank info(${email}) failed: ${error.message}`);
  console.log(`  [updated] ${email} → ${info.bank_name} ${info.bank_account_no}`);
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main() {
  console.log("=== UAT Bank Info Seed ===\n");

  // Personas
  for (const row of BANK_DATA) {
    const member = await getMemberByEmail(row.email);
    if (!member) {
      console.log(`  [skip] ${row.email} — member not found (run seed:uat first)`);
      continue;
    }
    if (member.bank_name) {
      console.log(`  [skip] ${row.email} — bank already set (${member.bank_name})`);
      continue;
    }
    await updateBankInfo(member.id, row.email, {
      bank_name: row.bank_name,
      bank_account_no: row.bank_account_no,
      bank_account_name: row.bank_account_name,
    });
  }

  // PO — only set if bank_name is null/empty
  console.log("\n--- PO ---");
  const poMember = await getMemberByEmail(PO_EMAIL);
  if (!poMember) {
    console.log(`  [skip] PO ${PO_EMAIL} — member not found`);
  } else if (poMember.bank_name) {
    console.log(`  [skip] PO ${PO_EMAIL} — bank already set (${poMember.bank_name}). Verify manually.`);
  } else {
    await updateBankInfo(poMember.id, PO_EMAIL, PO_BANK_FALLBACK);
    console.log(`  [note] PO bank set to fallback TCB 9999888877. PO should verify/update.`);
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});

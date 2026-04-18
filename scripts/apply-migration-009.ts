#!/usr/bin/env tsx
/**
 * Apply migration 009 (perf indexes) to production Supabase.
 * Uses postgres-js directly via DATABASE_URL (from .env.local SUPABASE credentials).
 *
 * Usage: npx tsx scripts/apply-migration-009.ts
 */

import { readFileSync } from "fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL in .env.local");
  console.error("   Get it from: Supabase dashboard → Project Settings → Database → Connection string → URI (session mode, not pooler)");
  console.error("   Fallback: copy-paste supabase/migrations/009-perf-indexes.sql into dashboard SQL editor");
  if (!SUPABASE_URL || !SERVICE_KEY) {
    process.exit(1);
  }
  console.error("⚠️  SUPABASE_URL + SERVICE_ROLE_KEY present — using REST exec_sql fallback (requires exec_sql RPC)");
  process.exit(1);
}

const sql = readFileSync("supabase/migrations/009-perf-indexes.sql", "utf8");

console.log("📦 Connecting to Supabase Postgres...");
const client = postgres(DB_URL, { max: 1 });

try {
  console.log("▶️  Running migration 009-perf-indexes.sql...");
  await client.unsafe(sql);
  console.log("✅ Migration applied successfully");

  // Verify indexes exist
  const rows = await client`
    select indexname from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'idx_bill_participants_bill_id',
        'idx_debts_bill_id',
        'idx_debts_debtor_status',
        'idx_debts_creditor_status',
        'idx_payment_confirmations_debt_status',
        'idx_bills_group_created'
      )
    order by indexname
  `;
  console.log(`✅ Verified ${rows.length}/6 indexes present:`);
  rows.forEach((r) => console.log(`   • ${r.indexname}`));
} catch (err) {
  console.error("❌ Migration failed:", err);
  process.exit(1);
} finally {
  await client.end();
}

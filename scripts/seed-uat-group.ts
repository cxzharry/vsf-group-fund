/**
 * seed-uat-group.ts
 * Creates UAT Team group with 6 members (5 personas + PO).
 * Idempotent: safe to re-run.
 *
 * Usage: npm run seed:uat
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
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
// Persona definitions
// ────────────────────────────────────────────────────────────
const PERSONAS = [
  { email: "minh+uat@nopay.test",  displayName: "Minh Tổ Chức",  role: "admin"  as const },
  { email: "an+uat@nopay.test",    displayName: "An Payer",       role: "member" as const },
  { email: "linh+uat@nopay.test",  displayName: "Linh Mắc Nợ",   role: "member" as const },
  { email: "duy+uat@nopay.test",   displayName: "Duy Khách",      role: "member" as const },
  { email: "tu+uat@nopay.test",    displayName: "Tú Soi Số",      role: "member" as const },
];

const PO_EMAIL = "cxzharry@gmail.com";
const GROUP_NAME = "UAT Team";
const UAT_PASSWORD = "Nopay@uat2026"; // test env only

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function getOrCreateAuthUser(email: string, displayName: string): Promise<string> {
  // Try list users to find existing
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((u) => u.email === email);

  if (existing) {
    console.log(`  [skip-create] ${email} already in auth.users (id: ${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: UAT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  });

  if (error) {
    throw new Error(`createUser(${email}) failed: ${error.message}`);
  }

  console.log(`  [created] auth user ${email} (id: ${data.user.id})`);
  return data.user.id;
}

async function getOrCreateMember(
  userId: string,
  email: string,
  displayName: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) {
    console.log(`  [skip-insert] member record exists for ${email}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("members")
    .insert({ user_id: userId, display_name: displayName, email })
    .select("id")
    .single();

  if (error) throw new Error(`insert member(${email}) failed: ${error.message}`);

  console.log(`  [created] member record for ${email} (id: ${data.id})`);
  return data.id;
}

async function handlePO(): Promise<{ memberId: string; note: string }> {
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((u) => u.email === PO_EMAIL);

  if (existing) {
    const memberId = await getOrCreateMember(existing.id, PO_EMAIL, "Harry PO");
    return { memberId, note: "PO already exists — no action needed." };
  }

  // PO not in auth — send magic invite link
  const { error } = await supabase.auth.admin.inviteUserByEmail(PO_EMAIL, {
    data: { full_name: "Harry PO" },
  });
  if (error) {
    console.warn(`  [warn] inviteUserByEmail failed: ${error.message}`);
    return {
      memberId: "",
      note: `PO ${PO_EMAIL} not found in auth — invite email may have failed. PO must sign in via Google first.`,
    };
  }

  // After invite, member row is created by trigger. Wait a beat and look up.
  await new Promise((r) => setTimeout(r, 1500));
  const { data: listData2 } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const invited = listData2?.users?.find((u) => u.email === PO_EMAIL);

  if (invited) {
    const memberId = await getOrCreateMember(invited.id, PO_EMAIL, "Harry PO");
    return { memberId, note: `PO ${PO_EMAIL} invited via magic link. Must click link to activate.` };
  }

  return {
    memberId: "",
    note: `PO ${PO_EMAIL} invited but could not resolve member id yet. Run seed again after PO clicks invite link.`,
  };
}

async function getOrCreateGroup(createdByMemberId: string): Promise<{ id: string; inviteCode: string }> {
  const { data: existing } = await supabase
    .from("groups")
    .select("id, invite_code")
    .eq("name", GROUP_NAME)
    .maybeSingle();

  if (existing) {
    console.log(`  [skip] group "${GROUP_NAME}" exists (id: ${existing.id})`);
    return { id: existing.id, inviteCode: existing.invite_code };
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({ name: GROUP_NAME, created_by: createdByMemberId })
    .select("id, invite_code")
    .single();

  if (error) throw new Error(`insert group failed: ${error.message}`);

  console.log(`  [created] group "${GROUP_NAME}" (id: ${data.id}, invite: ${data.invite_code})`);
  return { id: data.id, inviteCode: data.invite_code };
}

async function addGroupMember(groupId: string, memberId: string, role: "admin" | "member") {
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) return; // already in group

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, member_id: memberId, role });

  if (error) throw new Error(`insert group_member failed: ${error.message}`);
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main() {
  console.log("=== UAT Group Seed ===\n");

  // 1. Create/get all persona users + members
  const memberRows: { email: string; memberId: string; role: "admin" | "member" }[] = [];

  console.log("--- Personas ---");
  for (const p of PERSONAS) {
    const userId = await getOrCreateAuthUser(p.email, p.displayName);
    const memberId = await getOrCreateMember(userId, p.email, p.displayName);
    memberRows.push({ email: p.email, memberId, role: p.role });
  }

  // 2. Handle PO
  console.log("\n--- PO ---");
  const { memberId: poMemberId, note: poNote } = await handlePO();
  if (poMemberId) {
    memberRows.push({ email: PO_EMAIL, memberId: poMemberId, role: "admin" });
  }
  console.log(`  [note] ${poNote}`);

  // 3. Create group (created_by = Minh's member id)
  console.log("\n--- Group ---");
  const minhMemberId = memberRows.find((r) => r.email.startsWith("minh"))?.memberId;
  if (!minhMemberId) throw new Error("Could not resolve Minh's member id");

  const { id: groupId, inviteCode } = await getOrCreateGroup(minhMemberId);

  // 4. Add all members to group
  console.log("\n--- Group Members ---");
  for (const row of memberRows) {
    if (!row.memberId) continue;
    await addGroupMember(groupId, row.memberId, row.role);
    console.log(`  [ok] ${row.email} → role=${row.role}`);
  }

  // 5. Verify
  const { data: gm, error: gmErr } = await supabase
    .from("group_members")
    .select("id, role, member_id")
    .eq("group_id", groupId);

  if (gmErr) throw new Error(`verify failed: ${gmErr.message}`);

  console.log(`\n=== Done ===`);
  console.log(`Group:       ${GROUP_NAME}`);
  console.log(`Group ID:    ${groupId}`);
  console.log(`Invite Code: ${inviteCode}`);
  console.log(`Members:     ${gm?.length ?? 0}`);
  console.log(`\nTest credentials (personas only):`);
  for (const p of PERSONAS) {
    console.log(`  ${p.email}  /  ${UAT_PASSWORD}`);
  }
  if (poNote) console.log(`\nPO note: ${poNote}`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});

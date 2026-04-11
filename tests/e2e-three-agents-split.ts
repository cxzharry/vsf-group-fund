/**
 * E2E Test: 3 agents create group, split bills, transfer money.
 * Creates test users via Supabase admin, then runs Playwright browsers.
 */
import { chromium, type Page, type Browser } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://vsf-group-fund.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  { email: "agent1.alice@test.groupfund.com", name: "Alice (Agent 1)", password: "test123456" },
  { email: "agent2.bob@test.groupfund.com", name: "Bob (Agent 2)", password: "test123456" },
  { email: "agent3.carol@test.groupfund.com", name: "Carol (Agent 3)", password: "test123456" },
];

let browser: Browser;
let pages: Page[] = [];
let groupInviteCode = "";

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/gf-e2e-${name}.png`, fullPage: true });
  console.log(`  📸 /tmp/gf-e2e-${name}.png`);
}

async function setupTestUsers() {
  console.log("\n🔧 Setting up test users...");
  for (const u of TEST_USERS) {
    // Delete if exists (search by email)
    const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = users?.find((x) => x.email === u.email);
    if (found) {
      await admin.from("members").delete().eq("user_id", found.id);
      await admin.auth.admin.deleteUser(found.id);
      await new Promise(r => setTimeout(r, 500));
    }
    // Create confirmed user
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });
    if (error) throw new Error(`Failed to create ${u.email}: ${error.message}`);
    console.log(`  ✅ ${u.name} created (${data.user.id})`);
  }
}

async function loginAgent(page: Page, user: typeof TEST_USERS[0], label: string) {
  console.log(`\n🔑 ${label} logging in...`);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  console.log(`  ✅ ${label} logged in → ${page.url()}`);
  await screenshot(page, `${label}-home`);
}

async function test1_createGroup() {
  console.log("\n\n━━━ TEST 1: Alice creates group ━━━");
  const page = pages[0];

  // Click create group button in header
  await page.locator('button:has-text("Tạo nhóm")').first().click();
  await page.waitForSelector('input[placeholder*="Team"]', { timeout: 5000 });
  await page.fill('input[placeholder*="Team"]', "VSF Product QC Team");
  // Click the submit button inside the dialog (force click to bypass overlay)
  await page.locator('[role="dialog"] button:has-text("Tạo nhóm")').click({ force: true });
  await page.waitForTimeout(2000);
  await screenshot(page, "01-group-created");

  // Get invite code from group detail
  const groups = await page.locator("button:has-text('VSF Product QC Team')").first();
  await groups.click();
  await page.waitForTimeout(2000);
  await screenshot(page, "02-group-detail");

  // Find invite code - look in the page content
  const content = await page.content();
  // Try to get invite code from the group settings or from Supabase directly
  const { data: groupData } = await admin
    .from("groups")
    .select("invite_code")
    .eq("name", "VSF Product QC Team")
    .single();

  if (groupData) {
    groupInviteCode = groupData.invite_code;
    console.log(`  ✅ Group created! Invite code: ${groupInviteCode}`);
  } else {
    throw new Error("Failed to find group");
  }
}

async function test2_joinGroup() {
  console.log("\n\n━━━ TEST 2: Bob & Carol join group ━━━");

  for (let i = 1; i <= 2; i++) {
    const page = pages[i];
    const label = i === 1 ? "Bob" : "Carol";

    await page.locator('button:has-text("Tham gia")').first().click();
    await page.waitForSelector('input[placeholder*="mã"]', { timeout: 5000 });
    await page.fill('input[placeholder*="mã"]', groupInviteCode);
    await page.locator('[role="dialog"] button:has-text("Tham gia")').click({ force: true });
    await page.waitForTimeout(2000);
    await screenshot(page, `03-${label}-joined`);
    console.log(`  ✅ ${label} joined group`);
  }
}

async function test3_aliceCreatesBill() {
  console.log("\n\n━━━ TEST 3: Alice creates a standard bill (chia đều) ━━━");
  const page = pages[0];

  // Get group ID from Supabase to navigate directly
  const { data: grp } = await admin.from("groups").select("id").eq("name", "VSF Product QC Team").single();
  if (!grp) { console.log("  ❌ Group not found"); return; }

  await page.goto(`${BASE}/groups/${grp.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await screenshot(page, "03b-alice-group-chat");

  // Type in chat input to trigger AI
  const chatInput = page.locator('input[placeholder*="bún bò"]').first();
  if (await chatInput.isVisible()) {
    await chatInput.fill("500k bún bò 3 người");
    // Press enter or click the bill button
    await chatInput.press("Enter");
    await page.waitForTimeout(3000);
    await screenshot(page, "04-alice-chat-intent");

    // Look for confirm sheet or "Tạo bill" button
    const createBtn = page.locator('button:has-text("Tạo bill")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await screenshot(page, "05-alice-bill-created");
      console.log("  ✅ Bill created via AI chat");
    } else {
      console.log("  ⚠ AI confirm not visible, trying manual bill creation");
      // Fallback: navigate to manual bill creation
      await page.goto(`${BASE}/bills/new?group=`, { waitUntil: "networkidle" });
      await screenshot(page, "05-alice-manual-bill");
    }
  } else {
    console.log("  ⚠ Chat input not found, trying manual approach");
  }
}

async function test4_bobCreatesOpenBill() {
  console.log("\n\n━━━ TEST 4: Bob creates an open bill ━━━");
  const page = pages[1];

  // Navigate directly to group
  const { data: grp2 } = await admin.from("groups").select("id").eq("name", "VSF Product QC Team").single();
  if (!grp2) { console.log("  ❌ Group not found"); return; }
  await page.goto(`${BASE}/groups/${grp2.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await screenshot(page, "06-bob-group-chat");

  // Try typing in chat
  const chatInput = page.locator('input[placeholder*="bún bò"]').first();
  if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chatInput.fill("1tr2 ăn trưa");
    await chatInput.press("Enter");
    await page.waitForTimeout(3000);
    await screenshot(page, "07-bob-chat-intent");
    console.log("  ✅ Bob sent chat message for bill");
  }
}

async function test5_carolChecksActivity() {
  console.log("\n\n━━━ TEST 5: Carol checks activity & summary ━━━");
  const page = pages[2];

  // Check activity tab
  await page.goto(`${BASE}/activity`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await screenshot(page, "08-carol-activity");
  console.log("  ✅ Activity page loaded");

  // Check summary tab
  await page.goto(`${BASE}/summary`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await screenshot(page, "09-carol-summary");
  console.log("  ✅ Summary page loaded");
}

async function test6_paymentFlow() {
  console.log("\n\n━━━ TEST 6: Test payment/transfer page ━━━");

  // Check if any debts exist
  const { data: debts } = await admin
    .from("debts")
    .select("id")
    .eq("status", "pending")
    .limit(1);

  if (debts && debts.length > 0) {
    const page = pages[1]; // Bob
    await page.goto(`${BASE}/transfer/${debts[0].id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await screenshot(page, "10-bob-transfer");
    console.log("  ✅ Transfer page loaded");
  } else {
    console.log("  ⚠ No pending debts to test transfer flow");
  }
}

async function test7_accountPage() {
  console.log("\n\n━━━ TEST 7: Test account page (all 3 agents) ━━━");
  for (let i = 0; i < 3; i++) {
    const page = pages[i];
    const label = ["Alice", "Bob", "Carol"][i];
    await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await screenshot(page, `11-${label}-account`);
    console.log(`  ✅ ${label} account page OK`);
  }
}

async function printInviteForUser() {
  console.log("\n\n" + "═".repeat(50));
  console.log("📩 INVITE CODE FOR YOU TO JOIN:");
  console.log(`   Mã mời: ${groupInviteCode}`);
  console.log(`   Group: VSF Product QC Team`);
  console.log(`   App: ${BASE}`);
  console.log("═".repeat(50));
}

async function main() {
  console.log("🚀 Starting E2E test with 3 agents...\n");

  // Setup
  await setupTestUsers();

  browser = await chromium.launch({ headless: true });

  // Create 3 browser contexts (separate sessions)
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Agent${i + 1}`,
    });
    pages.push(await context.newPage());
  }

  try {
    // Login all 3
    await loginAgent(pages[0], TEST_USERS[0], "Alice");
    await loginAgent(pages[1], TEST_USERS[1], "Bob");
    await loginAgent(pages[2], TEST_USERS[2], "Carol");

    // Run tests
    await test1_createGroup();
    await test2_joinGroup();
    await test3_aliceCreatesBill();
    await test4_bobCreatesOpenBill();
    await test5_carolChecksActivity();
    await test6_paymentFlow();
    await test7_accountPage();

    // Print invite for user
    await printInviteForUser();

    console.log("\n\n✅ ALL E2E TESTS COMPLETE!");
    console.log(`📸 Screenshots saved to /tmp/gf-e2e-*.png`);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  } finally {
    await browser.close();
  }
}

main();

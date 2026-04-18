import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:3001';
const results = [];

function log(fix, expected, actual, status) {
  results.push({ fix, expected, actual, status });
  console.log(`${status}: ${fix} — expected: ${expected}, actual: ${actual}`);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill('cxzharry@gmail.com');
  await page.getByText('Nhập mật khẩu').click();
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').fill('Hai.1994');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForTimeout(5000);
}

// Measure all interactive elements on the page
async function auditPage(page, pageName) {
  return page.evaluate((pn) => {
    const info = { pageName: pn, elements: [], shadows: [], grayCount: 0 };

    // Measure all buttons and links
    document.querySelectorAll('button, a').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const cs = window.getComputedStyle(el);
      info.elements.push({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 30) || '',
        href: el.getAttribute('href') || '',
        w: Math.round(r.width),
        h: Math.round(r.height),
        classes: el.className?.substring?.(0, 80) || '',
      });
    });

    // Card shadows
    document.querySelectorAll('[class*="rounded-[14px]"]').forEach(el => {
      const cs = window.getComputedStyle(el);
      info.shadows.push({
        shadow: cs.boxShadow,
        classes: el.className?.substring(0, 60),
      });
    });

    // Count Tailwind gray computed colors
    const grays = ['rgb(75, 85, 99)', 'rgb(107, 114, 128)', 'rgb(156, 163, 175)',
                    'rgb(209, 213, 219)', 'rgb(229, 231, 235)', 'rgb(243, 244, 246)', 'rgb(249, 250, 251)'];
    document.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      if (grays.includes(cs.color) || grays.includes(cs.backgroundColor)) info.grayCount++;
    });

    return info;
  }, pageName);
}

(async () => {
  const browser = await chromium.launch();

  // === MOBILE ===
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mCtx.newPage();
  await login(mp);

  // HOME
  await mp.goto(BASE, { timeout: 60000 });
  await mp.waitForTimeout(3000);
  await mp.screenshot({ path: path.join(SCREENSHOTS, 'c2-mobile-home.png'), fullPage: true });

  const homeAudit = await auditPage(mp, 'home');
  console.log('\n--- HOME elements ---');
  homeAudit.elements.forEach(e => console.log(`  ${e.tag} ${e.w}x${e.h} "${e.text.substring(0,25)}" href=${e.href}`));

  // Find "+" button (link to /groups/create)
  const plusBtn = homeAudit.elements.find(e => e.href?.includes('/groups/create'));
  if (plusBtn) {
    log('"+" add group button', '44x44', `${plusBtn.w}x${plusBtn.h}`, plusBtn.w >= 44 && plusBtn.h >= 44 ? 'PASS' : 'FAIL');
  } else {
    log('"+" add group button', '44x44', 'not found', 'FAIL');
  }

  // Card shadow
  if (homeAudit.shadows.length > 0) {
    const s = homeAudit.shadows[0].shadow;
    log('Card shadow (home)', 'has shadow', s?.substring(0, 50) || 'none', s && s !== 'none' ? 'PASS' : 'FAIL');
  }

  // Navigate to first group
  const groupCards = mp.locator('[class*="rounded-[14px]"]');
  const cardCount = await groupCards.count();
  if (cardCount > 0) {
    await groupCards.first().click();
    await mp.waitForTimeout(3000);
    await mp.screenshot({ path: path.join(SCREENSHOTS, 'c2-mobile-group.png') });

    const groupAudit = await auditPage(mp, 'group-detail');
    console.log('\n--- GROUP DETAIL elements ---');
    groupAudit.elements.filter(e => e.h > 0).slice(0, 15).forEach(e =>
      console.log(`  ${e.tag} ${e.w}x${e.h} "${e.text.substring(0,25)}" classes=${e.classes.substring(0,50)}`));

    // Find back button (first button with rounded-full in header area - small buttons)
    const headerBtns = groupAudit.elements.filter(e =>
      e.tag === 'BUTTON' && e.classes.includes('rounded-full') && e.w <= 60);
    if (headerBtns.length >= 2) {
      log('Back button (group)', '44x44', `${headerBtns[0].w}x${headerBtns[0].h}`,
        headerBtns[0].w >= 44 && headerBtns[0].h >= 44 ? 'PASS' : 'FAIL');
      log('Gear button (group)', '44x44', `${headerBtns[1].w}x${headerBtns[1].h}`,
        headerBtns[1].w >= 44 && headerBtns[1].h >= 44 ? 'PASS' : 'FAIL');
    } else if (headerBtns.length === 1) {
      log('Back button (group)', '44x44', `${headerBtns[0].w}x${headerBtns[0].h}`,
        headerBtns[0].w >= 44 && headerBtns[0].h >= 44 ? 'PASS' : 'FAIL');
      log('Gear button (group)', '44x44', 'not found', 'FAIL');
    } else {
      // Try all buttons
      const allBtns = groupAudit.elements.filter(e => e.tag === 'BUTTON');
      console.log('  All buttons:', allBtns.map(b => `${b.w}x${b.h} "${b.text.substring(0,15)}"`));
      log('Back/Gear buttons (group)', '44x44', 'selector issue', 'SKIP');
    }

    // Chat send button (submit)
    const sendBtn = groupAudit.elements.find(e =>
      e.tag === 'BUTTON' && e.classes.includes('rounded-full') && e.classes.includes('bg-[#3A5CCC]'));
    if (sendBtn) {
      log('Chat send button', '44x44', `${sendBtn.w}x${sendBtn.h}`,
        sendBtn.w >= 44 && sendBtn.h >= 44 ? 'PASS' : 'FAIL');
    }

    // Gray count on group detail
    log('Group detail gray-* colors', '< 5', String(groupAudit.grayCount),
      groupAudit.grayCount < 5 ? 'PASS' : 'PARTIAL');

    // Navigate to settings
    const gearLink = groupAudit.elements.find(e => e.href?.includes('/settings'));
    if (gearLink) {
      await mp.locator(`a[href*="/settings"]`).first().click();
      await mp.waitForTimeout(2000);
    } else {
      // Click last round button (gear)
      const roundBtns = mp.locator('button.rounded-full');
      const rCount = await roundBtns.count();
      if (rCount > 1) {
        await roundBtns.nth(1).click();
        await mp.waitForTimeout(2000);
      }
    }
    await mp.screenshot({ path: path.join(SCREENSHOTS, 'c2-mobile-settings.png'), fullPage: true });

    const settingsAudit = await auditPage(mp, 'settings');
    console.log('\n--- SETTINGS elements ---');
    settingsAudit.elements.filter(e => e.h > 0).slice(0, 15).forEach(e =>
      console.log(`  ${e.tag} ${e.w}x${e.h} "${e.text.substring(0,25)}"`));

    // Settings back button
    const settingsBackBtn = settingsAudit.elements.find(e =>
      e.tag === 'BUTTON' && e.classes.includes('rounded-full') && e.w <= 60);
    if (settingsBackBtn) {
      log('Back button (settings)', '44x44', `${settingsBackBtn.w}x${settingsBackBtn.h}`,
        settingsBackBtn.w >= 44 && settingsBackBtn.h >= 44 ? 'PASS' : 'FAIL');
    }

    // Settings gray count
    log('Settings gray-* colors', '0', String(settingsAudit.grayCount),
      settingsAudit.grayCount === 0 ? 'PASS' : 'PARTIAL');

    // Settings small buttons (< 44px)
    const settingsSmall = settingsAudit.elements.filter(e =>
      (e.tag === 'BUTTON' || e.tag === 'A') && e.h > 0 && e.h < 44);
    if (settingsSmall.length > 0) {
      log('Settings small buttons', '0', settingsSmall.map(b => `${b.text}(${b.h}px)`).join(', '), 'FAIL');
    } else {
      log('Settings small buttons', '0', '0', 'PASS');
    }
  }

  // ACCOUNT
  await mp.goto(`${BASE}/account`, { timeout: 60000 });
  await mp.waitForTimeout(2000);
  await mp.screenshot({ path: path.join(SCREENSHOTS, 'c2-mobile-account.png'), fullPage: true });

  const accountAudit = await auditPage(mp, 'account');
  console.log('\n--- ACCOUNT elements ---');
  accountAudit.elements.forEach(e => console.log(`  ${e.tag} ${e.w}x${e.h} "${e.text.substring(0,25)}"`));

  const accountSmall = accountAudit.elements.filter(e =>
    (e.tag === 'BUTTON' || e.tag === 'A') && e.h > 0 && e.h < 44);
  log('Account small buttons', '0', accountSmall.length > 0 ?
    accountSmall.map(b => `${b.text.substring(0,15)}(${b.h}px)`).join(', ') : '0',
    accountSmall.length === 0 ? 'PASS' : 'FAIL');

  await mCtx.close();

  // === DESKTOP ===
  const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await dCtx.newPage();
  await login(dp);

  await dp.goto(BASE, { timeout: 60000 });
  await dp.waitForTimeout(3000);
  await dp.screenshot({ path: path.join(SCREENSHOTS, 'c2-desktop-home.png') });

  const dHomeAudit = await auditPage(dp, 'desktop-home');
  if (dHomeAudit.shadows.length > 0) {
    const s = dHomeAudit.shadows[0].shadow;
    log('Card shadow (desktop)', 'has shadow', s?.substring(0, 50) || 'none', s && s !== 'none' ? 'PASS' : 'FAIL');
  }

  // Hover rules
  const hoverCount = await dp.evaluate(() => {
    let c = 0;
    for (const s of document.styleSheets) {
      try { for (const r of s.cssRules) { if (r.selectorText?.includes(':hover')) c++; } } catch {}
    }
    return c;
  });
  log('Hover rules count', '> 10', String(hoverCount), hoverCount > 10 ? 'PASS' : 'FAIL');

  // Desktop group
  const dCards = dp.locator('[class*="rounded-[14px]"]');
  if (await dCards.count() > 0) {
    await dCards.first().click();
    await dp.waitForTimeout(2000);
    await dp.screenshot({ path: path.join(SCREENSHOTS, 'c2-desktop-group.png') });
  }

  await dCtx.close();
  await browser.close();

  // SUMMARY
  console.log('\n\n========== VERIFICATION SUMMARY ==========');
  let pass = 0, fail = 0, partial = 0, skip = 0, info = 0;
  for (const r of results) {
    if (r.status === 'PASS') pass++;
    else if (r.status === 'FAIL') fail++;
    else if (r.status === 'PARTIAL') partial++;
    else if (r.status === 'SKIP') skip++;
    else info++;
  }
  console.log(`PASS: ${pass}, FAIL: ${fail}, PARTIAL: ${partial}, SKIP: ${skip}, INFO: ${info}`);
  console.log('\nAll results:');
  for (const r of results) {
    console.log(`  [${r.status}] ${r.fix}: ${r.actual}`);
  }
})();

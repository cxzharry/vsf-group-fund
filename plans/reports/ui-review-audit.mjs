/**
 * UI/UX Design Review — Playwright Audit Script
 * Captures screenshots at mobile (390x844) and desktop (1440x900)
 * Checks CSS values for design token compliance
 */
import { chromium } from 'playwright';

const BASE = 'https://nopay-freelunch.vercel.app';
const SHOTS = '/Users/haido/vsf-group-fund/plans/reports/screenshots';
const EMAIL = 'cxzharry@gmail.com';
const PW = 'Hai.1994';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, mobile: true, scale: 3 },
  { name: 'desktop', width: 1440, height: 900, mobile: false, scale: 2 },
];

// All findings collected here
const findings = [];
let findingId = 0;

function add(page, vp, sev, cat, issue, fix, data) {
  findings.push({ id: ++findingId, page, viewport: vp, severity: sev, category: cat, issue, fix, data: data || null });
}

function rgbHex(rgb) {
  if (!rgb) return '';
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb;
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/ui-review-${name}.png`, fullPage: true });
  console.log(`  -> ${name}.png`);
}

// Audit computed CSS for multiple selectors
async function css(page, sels) {
  return page.evaluate((s) => {
    const r = {};
    for (const [k, sel] of Object.entries(s)) {
      const el = document.querySelector(sel);
      if (!el) { r[k] = null; continue; }
      const c = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      r[k] = {
        pad: c.padding, padL: c.paddingLeft, padR: c.paddingRight,
        fs: c.fontSize, fw: c.fontWeight, ff: c.fontFamily,
        color: c.color, bg: c.backgroundColor,
        br: c.borderRadius, border: c.border, shadow: c.boxShadow,
        lh: c.lineHeight, w: Math.round(b.width), h: Math.round(b.height),
        top: Math.round(b.top), left: Math.round(b.left),
        gap: c.gap, display: c.display, maxW: c.maxWidth,
        margin: c.margin,
      };
    }
    return r;
  }, sels);
}

// Audit all tappable elements for 44px min
async function tapTargets(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44)) {
        out.push({
          tag: el.tagName, text: el.textContent?.trim().slice(0, 40),
          w: Math.round(r.width), h: Math.round(r.height),
          cls: el.className?.toString().slice(0, 80),
          aria: el.getAttribute('aria-label') || '',
        });
      }
    });
    return out;
  });
}

// Check for icon buttons missing aria-label
async function a11y(page) {
  return page.evaluate(() => {
    const missing = [];
    document.querySelectorAll('button').forEach(btn => {
      const txt = btn.textContent?.trim();
      if (!txt && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
        missing.push({ html: btn.outerHTML.slice(0, 120), cls: btn.className?.toString().slice(0, 80) });
      }
    });
    return missing;
  });
}

// Audit all card-like elements
async function auditCards(page) {
  return page.evaluate(() => {
    // Cards are <a> links with rounded-[14px] on home
    const cards = document.querySelectorAll('a[href*="/groups/"]');
    return Array.from(cards).map((el, i) => {
      const c = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        i, pad: c.padding, br: c.borderRadius, bg: c.backgroundColor,
        shadow: c.boxShadow, h: Math.round(b.height), w: Math.round(b.width),
      };
    });
  });
}

// Check all unique colors on page
async function pageColors(page) {
  return page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('*').forEach(el => {
      const c = getComputedStyle(el);
      [c.color, c.backgroundColor, c.borderColor].forEach(v => {
        if (v && !v.includes('rgba(0, 0, 0, 0)')) set.add(v);
      });
    });
    return { body: getComputedStyle(document.body).backgroundColor, colors: Array.from(set).slice(0, 40) };
  });
}

// Count hover CSS rules
async function hoverCount(page) {
  return page.evaluate(() => {
    let n = 0;
    try {
      for (const s of document.styleSheets) {
        try { for (const r of s.cssRules) { if (r.selectorText?.includes(':hover')) n++; } } catch {}
      }
    } catch {}
    return n;
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n========== ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ==========\n`);

    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();

    // ── 1. LOGIN PAGE ──
    console.log(`[${vp.name}] 1. Login page`);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, `${vp.name}-01-login-otp`);

    let loginCSS = await css(page, {
      heading: 'h1',
      subtitle: 'h1 + p, p.text-\\[15px\\]',
      emailInput: 'input[type="email"]',
      submitBtn: 'button[type="submit"]',
      container: '.max-w-\\[430px\\]',
      icon: 'div[style*="3A5CCC"]',
    });
    console.log('  login css:', JSON.stringify(loginCSS, null, 2).slice(0, 600));

    // Check heading
    if (loginCSS.heading) {
      const fs = parseFloat(loginCSS.heading.fs);
      if (Math.abs(fs - 28) > 1) add('Login', vp.name, 'P2', 'Typography', `H1 font-size=${loginCSS.heading.fs} (expect 28px)`, 'Set text-[28px]');
      if (loginCSS.heading.fw !== '700') add('Login', vp.name, 'P2', 'Typography', `H1 font-weight=${loginCSS.heading.fw} (expect 700)`, 'Set font-bold');
    }

    // Check submit button height >= 44
    if (loginCSS.submitBtn) {
      if (loginCSS.submitBtn.h < 44) add('Login', vp.name, 'P1', 'Touch Targets', `Submit btn height=${loginCSS.submitBtn.h}px (<44)`, 'Set min-h-[44px]');
    }

    // Check app icon border-radius (should be ~22px)
    if (loginCSS.icon) {
      const br = parseFloat(loginCSS.icon.br);
      if (Math.abs(br - 22) > 2) add('Login', vp.name, 'P3', 'Visual Polish', `App icon border-radius=${loginCSS.icon.br} (expect ~22px)`, 'Set rounded-[22px]');
    }

    // Switch to password mode
    const pwBtn = page.getByText(/nh[aậ]p m[aậ]t kh[aẩ]u/i);
    if (await pwBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pwBtn.click();
      await page.waitForTimeout(800);
    }
    await shot(page, `${vp.name}-01b-login-pw`);

    // Login tap targets
    const loginTaps = await tapTargets(page);
    for (const t of loginTaps) {
      if (t.text && !t.text.includes('Dùng OTP')) {
        add('Login', vp.name, 'P1', 'Touch Targets', `"${t.text}" ${t.w}x${t.h}px (<44px min)`, 'Increase tap target');
      }
    }

    // Fill and login
    const emailInput = page.locator('input[type="email"]');
    const pwInput = page.locator('input[type="password"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) await emailInput.fill(EMAIL);
    if (await pwInput.isVisible({ timeout: 2000 }).catch(() => false)) await pwInput.fill(PW);
    await page.waitForTimeout(300);

    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) await submitBtn.click();
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle').catch(() => {});

    // ── 2. HOME / GROUPS LIST ──
    console.log(`[${vp.name}] 2. Home page`);
    await page.waitForTimeout(2000);
    await shot(page, `${vp.name}-02-home`);

    const homeCSS = await css(page, {
      header: 'header h1',
      chipBar: 'header .rounded-\\[12px\\]',
      addBtn: 'header button',
      mainContent: 'main',
      body: 'body',
    });
    console.log('  home css:', JSON.stringify(homeCSS, null, 2).slice(0, 600));

    // Header font
    if (homeCSS.header) {
      const fs = parseFloat(homeCSS.header.fs);
      if (Math.abs(fs - 28) > 1) add('Home', vp.name, 'P2', 'Typography', `Header font-size=${homeCSS.header.fs} (expect 28px)`, 'text-[28px]');
      if (homeCSS.header.fw !== '700') add('Home', vp.name, 'P2', 'Typography', `Header font-weight=${homeCSS.header.fw} (expect 700)`, 'font-bold');
      // Check left padding (should be 16px from container)
      if (homeCSS.header.left !== 16) {
        // Not an error if there's a sidebar on desktop
        if (vp.name === 'mobile' && Math.abs(homeCSS.header.left - 16) > 2)
          add('Home', vp.name, 'P2', 'Spacing', `Header left=${homeCSS.header.left}px (expect 16px)`, 'Check px-4');
      }
    }

    // Add button (circle) touch target
    if (homeCSS.addBtn) {
      if (homeCSS.addBtn.h < 36 || homeCSS.addBtn.w < 36)
        add('Home', vp.name, 'P2', 'Touch Targets', `Add button ${homeCSS.addBtn.w}x${homeCSS.addBtn.h}px`, 'Increase to >=36px');
    }

    // Main content padding
    if (homeCSS.mainContent) {
      const pl = parseFloat(homeCSS.mainContent.padL);
      const pr = parseFloat(homeCSS.mainContent.padR);
      if (Math.abs(pl - 16) > 1) add('Home', vp.name, 'P2', 'Spacing', `Main padding-left=${homeCSS.mainContent.padL} (expect 16px)`, 'px-4');
      if (Math.abs(pr - 16) > 1) add('Home', vp.name, 'P2', 'Spacing', `Main padding-right=${homeCSS.mainContent.padR} (expect 16px)`, 'px-4');
    }

    // Cards audit
    const cards = await auditCards(page);
    console.log('  cards:', JSON.stringify(cards, null, 2).slice(0, 400));
    for (const c of cards) {
      const br = parseFloat(c.br);
      if (Math.abs(br - 14) > 2) add('Home', vp.name, 'P2', 'Visual Polish', `Card[${c.i}] border-radius=${c.br} (expect 14px)`, 'rounded-[14px]');
      if (c.h !== 88) add('Home', vp.name, 'P3', 'Spacing', `Card[${c.i}] height=${c.h}px (expect 88px)`, 'h-[88px]');
      const bgHex = rgbHex(c.bg);
      if (bgHex && bgHex !== '#FFFFFF') add('Home', vp.name, 'P3', 'Colors', `Card[${c.i}] bg=${bgHex} (expect #FFFFFF)`, 'bg-white');
    }
    // Consistency
    if (cards.length > 1) {
      const pads = new Set(cards.map(c => c.pad));
      if (pads.size > 1) add('Home', vp.name, 'P2', 'Spacing', `Inconsistent card padding: ${[...pads].join(' vs ')}`, 'Standardize padding');
    }

    // Chip bar
    if (homeCSS.chipBar) {
      const br = parseFloat(homeCSS.chipBar.br);
      if (Math.abs(br - 12) > 2) add('Home', vp.name, 'P3', 'Visual Polish', `Chip bar border-radius=${homeCSS.chipBar.br} (expect 12px)`, 'rounded-[12px]');
    }

    // Home tap targets
    const homeTaps = await tapTargets(page);
    for (const t of homeTaps) {
      add('Home', vp.name, 'P1', 'Touch Targets', `"${t.text || t.aria}" ${t.w}x${t.h}px (<44px)`, 'Increase tap target');
    }

    // Body bg color
    const colors = await pageColors(page);
    const bodyHex = rgbHex(colors.body);
    if (bodyHex && bodyHex !== '#F2F2F7') add('Home', vp.name, 'P2', 'Colors', `Body bg=${bodyHex} (expect #F2F2F7)`, 'bg-[#F2F2F7]');

    // Desktop-specific checks
    if (vp.name === 'desktop') {
      const desktopCSS = await css(page, {
        sidebar: 'aside',
        sidebarBrand: 'aside span',
        mainArea: 'main',
      });
      console.log('  desktop layout:', JSON.stringify(desktopCSS, null, 2).slice(0, 400));

      if (!desktopCSS.sidebar) add('Home', 'desktop', 'P1', 'Responsive', 'Desktop sidebar not found', 'Ensure DesktopNav renders on sm+');
      if (desktopCSS.mainArea) {
        if (desktopCSS.mainArea.w > 900)
          add('Home', 'desktop', 'P2', 'Responsive', `Main area width=${desktopCSS.mainArea.w}px (too wide)`, 'Add max-w constraint');
      }

      const hovers = await hoverCount(page);
      console.log(`  hover rules: ${hovers}`);
      if (hovers < 3) add('Home', 'desktop', 'P2', 'Visual Polish', `Only ${hovers} hover CSS rules found`, 'Add hover states to cards/buttons');
    }

    // A11y
    const homeA11y = await a11y(page);
    for (const m of homeA11y) {
      add('Home', vp.name, 'P2', 'Accessibility', `Icon btn missing aria-label: ${m.html.slice(0, 60)}`, 'Add aria-label');
    }

    // ── 3. GROUP DETAIL ──
    console.log(`[${vp.name}] 3. Group detail`);
    const firstGroupLink = page.locator('a[href*="/groups/"]').first();
    if (await firstGroupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstGroupLink.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    await shot(page, `${vp.name}-03-group-detail`);

    const groupCSS = await css(page, {
      header: 'header',
      headerTitle: 'header h1, header p, header span',
      backBtn: 'header button',
      settingsBtn: 'header a[href*="settings"], header button:last-child',
      chatInput: 'input[placeholder]',
      sendBtn: 'button[aria-label]',
      inputBar: '.border-t',
    });
    console.log('  group detail css:', JSON.stringify(groupCSS, null, 2).slice(0, 600));

    // Header height
    if (groupCSS.header) {
      if (groupCSS.header.h < 44) add('Group Detail', vp.name, 'P2', 'Spacing', `Header height=${groupCSS.header.h}px (<44)`, 'min-h-[52px]');
    }

    // Chat input
    if (groupCSS.chatInput) {
      if (groupCSS.chatInput.h < 40) add('Group Detail', vp.name, 'P2', 'Touch Targets', `Chat input height=${groupCSS.chatInput.h}px (<40)`, 'h-10');
      const br = parseFloat(groupCSS.chatInput.br);
      if (Math.abs(br - 20) > 2) add('Group Detail', vp.name, 'P3', 'Visual Polish', `Chat input border-radius=${groupCSS.chatInput.br} (expect 20px)`, 'rounded-[20px]');
    }

    // Send/bill button
    if (groupCSS.sendBtn) {
      if (groupCSS.sendBtn.h < 44 || groupCSS.sendBtn.w < 44)
        add('Group Detail', vp.name, 'P1', 'Touch Targets', `Send btn ${groupCSS.sendBtn.w}x${groupCSS.sendBtn.h}px (<44)`, 'h-11 w-11');
    }

    // Group detail a11y
    const groupA11y = await a11y(page);
    for (const m of groupA11y.slice(0, 5)) {
      add('Group Detail', vp.name, 'P2', 'Accessibility', `Icon btn missing aria-label: ${m.html.slice(0, 60)}`, 'Add aria-label');
    }

    // Group detail tap targets
    const groupTaps = await tapTargets(page);
    for (const t of groupTaps.slice(0, 5)) {
      add('Group Detail', vp.name, 'P1', 'Touch Targets', `"${t.text || t.aria}" ${t.w}x${t.h}px`, 'Min 44px');
    }

    // ── 4. GROUP SETTINGS ──
    console.log(`[${vp.name}] 4. Group settings`);
    // Navigate to settings via URL
    const currentUrl = page.url();
    const groupIdMatch = currentUrl.match(/\/groups\/([^/]+)/);
    if (groupIdMatch) {
      await page.goto(`${BASE}/groups/${groupIdMatch[1]}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await shot(page, `${vp.name}-04-settings`);

      const settingsCSS = await css(page, {
        header: 'header',
        backBtn: 'header button',
        nameCard: '.rounded-2xl',
        inviteCode: '.font-mono',
        memberItem: '.border-b',
        leaveBtn: 'button.w-full',
      });
      console.log('  settings css:', JSON.stringify(settingsCSS, null, 2).slice(0, 500));

      // Settings page uses gray-400 and gray-900 instead of design tokens
      // Check back button size
      if (settingsCSS.backBtn) {
        if (settingsCSS.backBtn.h < 44 || settingsCSS.backBtn.w < 44)
          add('Settings', vp.name, 'P1', 'Touch Targets', `Back btn ${settingsCSS.backBtn.w}x${settingsCSS.backBtn.h}px (<44)`, 'h-11 w-11');
        // Color check — should use #3A5CCC not gray-600
        const colorHex = rgbHex(settingsCSS.backBtn.color);
        if (colorHex && !colorHex.includes('3A5CCC'))
          add('Settings', vp.name, 'P2', 'Colors', `Back btn color=${colorHex} (expect #3A5CCC)`, 'text-[#3A5CCC]');
      }

      // Check settings uses Tailwind gray-* instead of design tokens
      const settingsColorsCheck = await page.evaluate(() => {
        const els = document.querySelectorAll('.text-gray-400, .text-gray-500, .text-gray-900, .border-gray-100, .border-gray-200, .bg-gray-50, .bg-gray-100');
        return els.length;
      });
      if (settingsColorsCheck > 0)
        add('Settings', vp.name, 'P2', 'Colors', `${settingsColorsCheck} elements use Tailwind gray-* instead of design tokens (#1C1C1E, #8E8E93, #E5E5EA)`, 'Replace gray-* with design token colors');

      // Member avatar check
      const memberAvatarCSS = await css(page, {
        avatar: '.rounded-full.bg-\\[\\#3A5CCC\\]\\/10, .rounded-full[class*="bg-"]',
      });
      if (memberAvatarCSS.avatar) {
        if (memberAvatarCSS.avatar.h < 36) add('Settings', vp.name, 'P3', 'Spacing', `Member avatar ${memberAvatarCSS.avatar.w}x${memberAvatarCSS.avatar.h}px (small)`, 'Consider h-10 w-10');
      }

      // Settings tap targets
      const settingsTaps = await tapTargets(page);
      for (const t of settingsTaps.slice(0, 5)) {
        add('Settings', vp.name, 'P1', 'Touch Targets', `"${t.text || t.aria}" ${t.w}x${t.h}px`, 'Min 44px');
      }
    }

    // ── 5. ACCOUNT PAGE ──
    console.log(`[${vp.name}] 5. Account page`);
    await page.goto(`${BASE}/account`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await shot(page, `${vp.name}-05-account`);

    const accountCSS = await css(page, {
      header: 'header',
      avatar: '.rounded-full.h-20, div[style*="3A5CCC"].rounded-full',
      userName: '.text-\\[17px\\]',
      email: '.text-sm.text-\\[\\#8E8E93\\]',
      bankSection: '.rounded-2xl.bg-white',
      signOutBtn: 'button.text-\\[\\#FF3B30\\]',
      editBtn: '.text-\\[\\#3A5CCC\\]',
    });
    console.log('  account css:', JSON.stringify(accountCSS, null, 2).slice(0, 600));

    // Avatar should be round
    if (accountCSS.avatar) {
      const br = accountCSS.avatar.br;
      if (!br.includes('9999') && parseFloat(br) < 40 && !br.includes('50%'))
        add('Account', vp.name, 'P2', 'Visual Polish', `Avatar border-radius=${br} (expect 50%)`, 'rounded-full');
      if (accountCSS.avatar.h !== 80 || accountCSS.avatar.w !== 80)
        add('Account', vp.name, 'P3', 'Spacing', `Avatar ${accountCSS.avatar.w}x${accountCSS.avatar.h}px (expect 80x80)`, 'h-20 w-20');
    }

    // Sign out tap target
    if (accountCSS.signOutBtn) {
      if (accountCSS.signOutBtn.h < 44) add('Account', vp.name, 'P2', 'Touch Targets', `Sign out btn height=${accountCSS.signOutBtn.h}px (<44)`, 'Add py for 44px');
    }

    // Account tap targets
    const accountTaps = await tapTargets(page);
    for (const t of accountTaps.slice(0, 5)) {
      add('Account', vp.name, 'P1', 'Touch Targets', `"${t.text || t.aria}" ${t.w}x${t.h}px`, 'Min 44px');
    }

    // ── 6. BILL CONFIRM SHEET ──
    console.log(`[${vp.name}] 6. Bill confirm (navigate to group, type, submit)`);
    // Go back to group detail
    if (groupIdMatch) {
      await page.goto(`${BASE}/groups/${groupIdMatch[1]}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Type in chat
      const chatIn = page.locator('input[placeholder*="bún bò"], input[placeholder]').last();
      if (await chatIn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await chatIn.fill('100k test');
        await page.waitForTimeout(500);
        await chatIn.press('Enter');
        await page.waitForTimeout(4000);
        await shot(page, `${vp.name}-06-bill-sheet`);

        // Check for sheet/dialog
        const sheetCSS = await css(page, {
          sheet: '[role="dialog"], [class*="sheet"], [class*="drawer"], [data-state="open"]',
          sheetOverlay: '[data-state="open"][class*="overlay"], .fixed.inset-0',
        });
        console.log('  sheet css:', JSON.stringify(sheetCSS, null, 2).slice(0, 400));

        if (sheetCSS.sheet) {
          const br = parseFloat(sheetCSS.sheet.br);
          if (br > 0 && Math.abs(br - 20) > 4)
            add('Bill Sheet', vp.name, 'P3', 'Visual Polish', `Sheet border-radius=${sheetCSS.sheet.br} (expect ~20px top)`, 'rounded-t-[20px]');
        }
      } else {
        console.log('  Chat input not visible, skipping bill sheet');
      }
    }

    // ── 7. DEBTS/TRANSFER ──
    console.log(`[${vp.name}] 7. Debts/Transfer pages`);
    await page.goto(`${BASE}/debts`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const debtUrl = page.url();
    if (debtUrl.includes('debt')) {
      await shot(page, `${vp.name}-07-debts`);
    }

    // Try transfer page
    await page.goto(`${BASE}/summary`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const summaryUrl = page.url();
    if (summaryUrl.includes('summary')) {
      await shot(page, `${vp.name}-07b-summary`);
    }

    // ── FONT CHECK across all text ──
    console.log(`[${vp.name}] Font check`);
    const nonInterFonts = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('h1,h2,h3,p,span,a,button,label').forEach(el => {
        if (!el.textContent?.trim()) return;
        const ff = getComputedStyle(el).fontFamily.toLowerCase();
        if (!ff.includes('inter') && !ff.includes('system-ui') && !ff.includes('-apple-system')) {
          bad.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 30), ff: ff.slice(0, 60) });
        }
      });
      return bad;
    });
    for (const f of nonInterFonts.slice(0, 3)) {
      add('Global', vp.name, 'P2', 'Typography', `<${f.tag}> "${f.text}" uses "${f.ff}" not Inter`, 'Set font-family to Inter');
    }

    // ── BOTTOM NAV CHECK ──
    if (vp.name === 'mobile') {
      // Go home to see bottom nav
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const navCSS = await css(page, {
        nav: 'nav',
        navLink: 'nav a',
      });
      console.log('  bottom nav:', JSON.stringify(navCSS, null, 2).slice(0, 300));
      if (navCSS.nav) {
        if (navCSS.nav.h < 56) add('Home', 'mobile', 'P2', 'Touch Targets', `Bottom nav height=${navCSS.nav.h}px (<56)`, 'h-14');
      }
      if (navCSS.navLink) {
        const fs = parseFloat(navCSS.navLink.fs);
        if (Math.abs(fs - 10) > 1) add('Home', 'mobile', 'P3', 'Typography', `Nav label font-size=${navCSS.navLink.fs} (expect 10px)`, 'text-[10px]');
      }
    }

    await ctx.close();
  }

  // ========== OUTPUT ==========
  console.log('\n\n============================');
  console.log(`TOTAL FINDINGS: ${findings.length}`);
  console.log('============================\n');
  console.log(JSON.stringify(findings, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error('SCRIPT FAILED:', err.message);
  console.error(err.stack);
  // Still output partial findings
  console.log('\nPARTIAL FINDINGS:', JSON.stringify(findings, null, 2));
  process.exit(1);
});

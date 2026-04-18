import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const SCREENSHOTS = '/Users/haido/vsf-group-fund/plans/reports/screenshots';
mkdirSync(SCREENSHOTS, { recursive: true });

const TOKENS = {
  primary: '#3A5CCC', green: '#34C759', red: '#FF3B30', orange: '#FF9500',
  text1: '#1C1C1E', text2: '#8E8E93', text3: '#AEAEB2',
  border: '#E5E5EA', bg: '#F2F2F7', card: '#FFFFFF',
};

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function login(page) {
  await page.goto('https://nopay-freelunch.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email"]');
  await emailInput.fill('cxzharry@gmail.com');
  await page.waitForTimeout(500);

  // Click "mat khau" button
  const pwBtn = page.locator('button:has-text("mat khau"), button:has-text("mật khẩu"), button:has-text("Mat khau"), button:has-text("Mật khẩu"), a:has-text("mat khau"), a:has-text("mật khẩu")');
  await pwBtn.first().click();
  await page.waitForTimeout(1000);

  // Fill password
  const pwInput = page.locator('input[type="password"], input[name="password"]');
  await pwInput.fill('Hai.1994');
  await page.waitForTimeout(500);

  // Submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("Dang nhap"), button:has-text("Đăng nhập")');
  await submitBtn.first().click();

  await page.waitForTimeout(5000);
}

async function auditPage(page, pageName) {
  return await page.evaluate((pName) => {
    const issues = [];

    // 1. Touch target audit
    const interactives = document.querySelectorAll('button, a, [role="button"], input, select, textarea, [tabindex]');
    const smallTargets = [];
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        const text = (el.textContent || '').trim().slice(0, 30);
        const tag = el.tagName.toLowerCase();
        const cls = (el.className || '').toString().slice(0, 60);
        smallTargets.push({ tag, text, w: Math.round(rect.width), h: Math.round(rect.height), cls });
      }
    });
    if (smallTargets.length > 0) {
      issues.push({ type: 'touch-targets', count: smallTargets.length, items: smallTargets.slice(0, 15) });
    }

    // 2. Font check
    const body = document.body;
    const bodyFont = getComputedStyle(body).fontFamily;
    const hasInter = bodyFont.toLowerCase().includes('inter');
    issues.push({ type: 'font', family: bodyFont.slice(0, 80), hasInter });

    // 3. Tailwind gray usage - check computed colors for gray-ish values that aren't design tokens
    const grayElements = [];
    const designColors = ['rgb(28, 28, 30)', 'rgb(142, 142, 147)', 'rgb(174, 174, 178)', 'rgb(229, 229, 234)', 'rgb(242, 242, 247)', 'rgb(255, 255, 255)', 'rgb(58, 92, 204)', 'rgb(52, 199, 89)', 'rgb(255, 59, 48)', 'rgb(255, 149, 0)', 'rgba(0, 0, 0, 0)'];
    const allEls = document.querySelectorAll('*');
    let grayCount = 0;
    allEls.forEach(el => {
      const style = getComputedStyle(el);
      const color = style.color;
      // Check for Tailwind gray shades not in our tokens
      const grayPatterns = [
        'rgb(107, 114, 128)', // gray-500
        'rgb(75, 85, 99)',    // gray-600
        'rgb(55, 65, 81)',    // gray-700
        'rgb(31, 41, 55)',    // gray-800
        'rgb(17, 24, 39)',    // gray-900
        'rgb(156, 163, 175)', // gray-400
        'rgb(209, 213, 219)', // gray-300
        'rgb(229, 231, 235)', // gray-200
        'rgb(243, 244, 246)', // gray-100
        'rgb(249, 250, 251)', // gray-50
      ];
      if (grayPatterns.includes(color)) {
        grayCount++;
        if (grayElements.length < 8) {
          const text = (el.textContent || '').trim().slice(0, 25);
          grayElements.push({ tag: el.tagName, text, color, cls: (el.className || '').toString().slice(0, 50) });
        }
      }
    });
    if (grayCount > 0) {
      issues.push({ type: 'tailwind-grays', count: grayCount, samples: grayElements });
    }

    // 4. Border-radius check on cards
    const cards = document.querySelectorAll('[class*="rounded"]');
    const radiusIssues = [];
    cards.forEach(el => {
      const br = getComputedStyle(el).borderRadius;
      const rect = el.getBoundingClientRect();
      // Only check visible elements of card-like size
      if (rect.width > 100 && rect.height > 40) {
        const brVal = parseFloat(br);
        const cls = (el.className || '').toString();
        if (cls.includes('card') || (rect.height >= 70 && rect.height <= 120 && rect.width > 300)) {
          if (brVal !== 14) {
            radiusIssues.push({ expected: '14px', actual: br, w: Math.round(rect.width), h: Math.round(rect.height) });
          }
        }
      }
    });
    if (radiusIssues.length > 0) {
      issues.push({ type: 'card-radius', items: radiusIssues.slice(0, 5) });
    }

    // 5. Padding check on main content
    const main = document.querySelector('main') || document.querySelector('[class*="px-4"]');
    if (main) {
      const pl = getComputedStyle(main).paddingLeft;
      const pr = getComputedStyle(main).paddingRight;
      issues.push({ type: 'main-padding', left: pl, right: pr });
    }

    // 6. Shadow check on cards
    const cardLinks = document.querySelectorAll('a[class*="rounded"], div[class*="rounded-"]');
    let noShadowCards = 0;
    cardLinks.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 60) {
        const shadow = getComputedStyle(el).boxShadow;
        if (shadow === 'none' || !shadow) noShadowCards++;
      }
    });
    issues.push({ type: 'card-shadows', noShadowCount: noShadowCards });

    // 7. Hover rules count
    let hoverRules = 0;
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes(':hover')) hoverRules++;
          }
        } catch(e) {}
      }
    } catch(e) {}
    issues.push({ type: 'hover-rules', count: hoverRules });

    return { page: pName, issues };
  }, pageName);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const allResults = {};

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const prefix = `ui-review-260413-${vp.name}`;
    const results = [];

    // 1. Login page (before login)
    console.log('1. Login page...');
    await page.goto('https://nopay-freelunch.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOTS}/${prefix}-login.png`, fullPage: true });
    results.push(await auditPage(page, 'login'));

    // Login
    console.log('   Logging in...');
    await login(page);

    // 2. Home
    console.log('2. Home page...');
    await page.screenshot({ path: `${SCREENSHOTS}/${prefix}-home.png`, fullPage: true });
    results.push(await auditPage(page, 'home'));

    // 3. Group detail
    console.log('3. Group detail...');
    const groupCard = page.locator('a[href*="/groups/"]').first();
    try {
      await groupCard.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS}/${prefix}-group.png`, fullPage: true });
      results.push(await auditPage(page, 'group-detail'));
    } catch (e) {
      console.log('   Could not click group card:', e.message.slice(0, 80));
    }

    // 4. Settings
    console.log('4. Settings...');
    try {
      // Look for gear/settings button in the header area
      const settingsBtn = page.locator('button:has(svg), a[href*="settings"]').filter({ has: page.locator('svg') });
      const buttons = await settingsBtn.all();
      // Find the gear button (usually last svg button in header, or one with specific size)
      let clicked = false;
      for (const btn of buttons) {
        const box = await btn.boundingBox();
        if (box && box.y < 80) { // In header area
          const text = await btn.textContent();
          if (!text || text.trim() === '') { // Icon-only button = likely gear
            await btn.click();
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) {
        // Try href-based
        const settingsLink = page.locator('a[href*="settings"]').first();
        await settingsLink.click({ timeout: 3000 });
      }
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS}/${prefix}-settings.png`, fullPage: true });
      results.push(await auditPage(page, 'settings'));
    } catch (e) {
      console.log('   Could not open settings:', e.message.slice(0, 80));
    }

    // 5. Account
    console.log('5. Account...');
    try {
      if (vp.name === 'mobile') {
        // Bottom nav tab
        const accountTab = page.locator('nav a:has-text("khoan"), nav a:has-text("Tài"), a:has-text("Tài khoản")').first();
        await accountTab.click({ timeout: 5000 });
      } else {
        const accountLink = page.locator('a:has-text("Tài khoản"), a[href*="account"]').first();
        await accountLink.click({ timeout: 5000 });
      }
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS}/${prefix}-account.png`, fullPage: true });
      results.push(await auditPage(page, 'account'));
    } catch (e) {
      console.log('   Could not open account:', e.message.slice(0, 80));
    }

    allResults[vp.name] = results;
    await context.close();
  }

  await browser.close();

  // Output JSON for report generation
  console.log('\n\n===JSON_START===');
  console.log(JSON.stringify(allResults, null, 2));
  console.log('===JSON_END===');
}

run().catch(e => { console.error(e); process.exit(1); });

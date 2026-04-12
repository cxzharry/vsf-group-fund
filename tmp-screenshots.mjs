import { chromium } from 'playwright';

const browser = await chromium.launch();

// Login helper
async function login(page) {
  await page.goto('https://nopay-freelunch.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'cxzharry@gmail.com');
  await page.locator('button', { hasText: 'mật khẩu' }).click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').fill('Hai.1994');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
}

// Mobile screenshots
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mobile.newPage();
await login(mp);
await mp.screenshot({ path: '/tmp/qc-mobile-home.png' });

// Navigate to account tab
await mp.click('nav a:last-child');
await mp.waitForTimeout(2000);
await mp.screenshot({ path: '/tmp/qc-mobile-account.png' });

// Desktop screenshots
const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dp = await desktop.newPage();
await login(dp);
await dp.screenshot({ path: '/tmp/qc-desktop-home.png' });

await dp.click('nav a:last-child, aside a:last-child');
await dp.waitForTimeout(2000);
await dp.screenshot({ path: '/tmp/qc-desktop-account.png' });

console.log('Screenshots taken');
await browser.close();

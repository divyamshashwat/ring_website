// Phone without WebGL: the page must stay usable and show stills.
import { chromium, devices } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-3d-apis'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.argv[2] ?? 'http://localhost:3100/', { waitUntil: 'load' });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'qa/nowebgl-top.png' });
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45));
await page.waitForTimeout(2500);
await page.screenshot({ path: 'qa/nowebgl-mid.png' });
console.log('errors:', errors.length ? errors : 'none', 'height', await page.evaluate(() => document.documentElement.scrollHeight));
await browser.close();

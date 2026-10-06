// Visual QA helper: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs]
import { chromium } from 'playwright';
const [url, out, w = '1440', h = '900', wait = '6000', scrollY = '0'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(+wait);
if (+scrollY) {
  // scroll in steps so scrubbed timelines and Lenis follow naturally
  for (let i = 1; i <= 10; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((+scrollY * i) / 10));
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(3500);
}
await page.screenshot({ path: out });
await browser.close();

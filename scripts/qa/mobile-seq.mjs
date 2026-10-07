// node mseq.mjs <url> <outprefix> <comma list of scroll fractions of page or px with 'px' suffix or 'sel:selector'>
import { chromium, devices } from 'playwright';
const [url, out, list = '0'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(7000);
let cur = 0;
let i = 0;
for (const item of list.split(',')) {
  let target;
  if (item.startsWith('sel:')) target = await page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY : 0; }, item.slice(4));
  else if (item.endsWith('px')) target = parseFloat(item);
  else if (item.endsWith('vh')) target = parseFloat(item) / 100 * 844;
  else target = parseFloat(item);
  const steps = 12;
  for (let k = 1; k <= steps; k++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(cur + ((target - cur) * k) / steps));
    await page.waitForTimeout(90);
  }
  cur = target;
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}-${String(i++).padStart(2, '0')}.png` });
}
console.log('errors:', errs.length ? errs : 'none');
await browser.close();

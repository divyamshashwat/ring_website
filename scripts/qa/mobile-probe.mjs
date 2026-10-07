// Emulates a phone, scrolls the whole page slowly, and reports errors and live WebGL contexts.
import { chromium, devices } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:3100/';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  const t = m.text();
  if ((m.type() === 'error' || m.type() === 'warning') && !/Clock|preload|404|WebGL-0x|GPU stall/.test(t)) errors.push(m.type() + ': ' + t.slice(0, 200));
});
await page.addInitScript(() => {
  window.__ctx = { created: 0, lost: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const c = orig.call(this, type, ...rest);
    if (c && /webgl/.test(type) && !this.__counted) {
      this.__counted = true;
      window.__ctx.created++;
      this.addEventListener('webglcontextlost', () => window.__ctx.lost++);
    }
    return c;
  };
});
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(8000);
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const live = () => page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, ...window.__ctx, y: Math.round(scrollY) }));
console.log('page height', height, await live());
for (let y = 0; y < height; y += 700) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(900);
  if (y % 2800 === 0) console.log(await live());
}
console.log('end', await live());
console.log('errors:', errors.length ? errors.slice(0, 20) : 'none');
await browser.close();

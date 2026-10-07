// Measures when the loader closes relative to the first rendered 3D frame.
import { chromium, devices } from 'playwright';
const mode = process.argv[2] ?? 'none';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: mode === 'nowebgl' ? ['--disable-3d-apis'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto('http://localhost:3100/', { waitUntil: 'commit' });
await page.waitForSelector('[aria-label="Loading"]', { state: 'detached', timeout: 30000 });
console.log(`[${mode}] loader closed after ${((Date.now() - t0) / 1000).toFixed(1)}s, canvases: ${await page.evaluate(() => document.querySelectorAll('canvas').length)}`);
await browser.close();

// Simulates privacy-browser WebGL blocking in several ways and checks the 3D still starts.
//   node scripts/qa/brave-sim.mjs <mode> [url]
//   modes: proto | locked | instance | throws
import { chromium, devices } from 'playwright';
const mode = process.argv[2] ?? 'proto';
const url = process.argv[3] ?? 'http://localhost:3100/?debug';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
await ctx.addInitScript((mode) => {
  const ctors = [WebGL2RenderingContext, WebGLRenderingContext];
  if (mode === 'proto') for (const C of ctors) C.prototype.getShaderPrecisionFormat = () => null;
  if (mode === 'locked') for (const C of ctors) Object.defineProperty(C.prototype, 'getShaderPrecisionFormat', { value: () => null, writable: false, configurable: false });
  if (mode === 'throws') for (const C of ctors) C.prototype.getShaderPrecisionFormat = () => { throw new Error('blocked'); };
  if (mode === 'instance') {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...a) {
      const c = orig.apply(this, a);
      if (c && /webgl/.test(a[0])) Object.defineProperty(c, 'getShaderPrecisionFormat', { value: () => null, writable: false, configurable: false });
      return c;
    };
  }
}, mode);
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(9000);
const panel = await page.evaluate(() => [...document.querySelectorAll('div')].map((d) => d.textContent).find((t) => t?.startsWith('VYOMA 3D diagnostics')) ?? '');
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
const lines = panel.split('\n').filter((l) => /error|stage|no 3D|compat/.test(l));
console.log(`[${mode}] canvases=${canvases} pageErrors=${pageErrors.length}\n  ` + lines.join('\n  '));
await page.screenshot({ path: `qa/brave-${mode}.png` });
await browser.close();

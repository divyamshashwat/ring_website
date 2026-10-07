// Simulates Brave Shields on iOS: getShaderPrecisionFormat returns null.
import { chromium, devices } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
await ctx.addInitScript(() => {
  for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) C.prototype.getShaderPrecisionFormat = () => null;
});
const page = await ctx.newPage();
await page.goto(process.argv[2] ?? 'http://localhost:3100/?debug', { waitUntil: 'load' });
await page.waitForTimeout(9000);
const panel = await page.evaluate(() => [...document.querySelectorAll('div')].map((d) => d.textContent).find((t) => t?.startsWith('VYOMA 3D diagnostics')) ?? '');
console.log(panel.split('\n').filter((l) => /webgl2|error|stage|no 3D/.test(l)).join('\n'));
await page.screenshot({ path: 'qa/brave-sim.png' });
await browser.close();

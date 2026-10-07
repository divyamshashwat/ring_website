// Simulates hostile or flaky WebGL environments and checks the 3D still starts.
//   node scripts/qa/brave-sim.mjs <mode> [url]
//   modes:
//     proto | locked | instance | throws  getShaderPrecisionFormat withheld (Brave Shields, four ways)
//     params      getParameter / getContextAttributes answer null as well
//     lost        the context is created lost and restored half a second later
//     nomodel     the GLB model and decoders fail to download (procedural fallback)
//     none        no interference
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
  if (mode === 'proto' || mode === 'params') for (const C of ctors) C.prototype.getShaderPrecisionFormat = () => null;
  if (mode === 'params')
    for (const C of ctors) {
      const gp = C.prototype.getParameter;
      C.prototype.getParameter = function (p) {
        return p === this.VERSION || p === this.MAX_TEXTURE_SIZE || p === this.SHADING_LANGUAGE_VERSION ? null : gp.call(this, p);
      };
      C.prototype.getContextAttributes = () => null;
    }
  if (mode === 'locked') for (const C of ctors) Object.defineProperty(C.prototype, 'getShaderPrecisionFormat', { value: () => null, writable: false, configurable: false });
  if (mode === 'throws') for (const C of ctors) C.prototype.getShaderPrecisionFormat = () => { throw new Error('blocked'); };
  if (mode === 'instance' || mode === 'lost') {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...a) {
      const c = orig.apply(this, a);
      if (c && /webgl/.test(a[0]) && !this.__seen) {
        this.__seen = true;
        if (mode === 'instance') Object.defineProperty(c, 'getShaderPrecisionFormat', { value: () => null, writable: false, configurable: false });
        if (mode === 'lost') {
          const ext = c.getExtension('WEBGL_lose_context');
          ext.loseContext();
          setTimeout(() => ext.restoreContext(), 500);
        }
      }
      return c;
    };
  }
}, mode);
const page = await ctx.newPage();
if (mode === 'nomodel') await page.route(/\.(glb)$|\/decoders\//, (r) => r.abort());
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(10000);
const panel = await page.evaluate(() => [...document.querySelectorAll('div')].map((d) => d.textContent).filter((t) => t?.includes('VYOMA 3D diagnostics')).pop() ?? '');
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
const lines = panel.split('\n').filter((l) => /error|stage|no 3D|compat|context|model|first frame|shader/.test(l));
console.log(`[${mode}] canvases=${canvases} pageErrors=${pageErrors.length} ${pageErrors.slice(0, 2).join(' / ')}\n  ` + lines.join('\n  '));
await page.screenshot({ path: `qa/brave-${mode}.png` });
await browser.close();

// Phone checks per page: horizontal overflow, touch targets under 44px, text under 12px.
//   node scripts/qa/mobile-checks.mjs [path ...]
import { chromium, devices } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/collections', '/products/moonga-ring', '/gemstones', '/gemstones/moonga', '/zodiac', '/find-your-stone', '/configure', '/craftsmanship', '/our-story', '/journal', '/bag', '/checkout', '/wishlist', '/consultation', '/contact', '/track-order', '/care'];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
for (const p of paths) {
  const page = await ctx.newPage();
  await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const W = innerWidth;
    const overflow = document.documentElement.scrollWidth - W;
    const small = [];
    for (const el of document.querySelectorAll('a, button, input, select, [role=button], [role=radio], [role=tab]')) {
      if (el.closest('[aria-hidden="true"]') || el.closest('footer .wordmark')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (el.closest('p, li > p, dd') && cs.display === 'inline') continue; // inline links in running text
      // effective target includes a ::before hit area (house links)
      const before = getComputedStyle(el, '::before');
      let h = b.height, w = b.width;
      if (before.content !== 'none' && before.position === 'absolute') {
        h += -parseFloat(before.top || 0) - parseFloat(before.bottom || 0);
        w += -parseFloat(before.left || 0) - parseFloat(before.right || 0);
      }
      if (cs.display === 'inline') h = Math.max(h, b.height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
      if (h < 43.5 || w < 24) small.push(`${el.tagName.toLowerCase()}.${(el.className?.baseVal ?? el.className ?? '').toString().split(' ')[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 22)}" ${Math.round(w)}×${Math.round(h)}`);
    }
    let tiny = 0;
    const tinyEx = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (parseFloat(cs.fontSize) < 12 && !el.closest('[aria-hidden="true"]')) {
        tiny++;
        if (tinyEx.length < 3) tinyEx.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${cs.fontSize} "${el.textContent.trim().slice(0, 20)}"`);
      }
    }
    return { overflow, small: [...new Set(small)], tiny, tinyEx, height: document.documentElement.scrollHeight };
  });
  console.log(`${p}  height=${r.height}  overflow=${r.overflow}  small=${r.small.length}  tiny=${r.tiny}`);
  for (const s of r.small.slice(0, 8)) console.log('   small:', s);
  for (const s of r.tinyEx) console.log('   tiny:', s);
  await page.close();
}
await browser.close();

/**
 * Renders a still of every product from its real 3D model, for listings,
 * thumbnails and social cards.
 *
 *   npm run build && npm start   (in another terminal)
 *   npm run renders              (BASE_URL defaults to http://localhost:3000)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { products } from '../lib/data/products';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const out = join(root, 'public/images/renders');
mkdirSync(out, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  for (const p of products) {
    // renders always use the full-quality tier, whatever machine produces them
    await page.goto(`${base}/studio?product=${p.slug}&tier=high`, { waitUntil: 'load' });
    await page.waitForSelector('main[data-ready="true"]', { timeout: 90000 });
    await page.waitForTimeout(6000);
    const png = await page.screenshot({ timeout: 120000 });
    await sharp(png).webp({ quality: 84 }).toFile(join(out, `${p.slug}.webp`));
    console.log('rendered', p.slug);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { stoneVolume } from '@/lib/3d/geometry/stones';
import { gemstoneBySlug } from './gemstones';
import type { Configuration, Gemstone, StoneSize } from './types';

/**
 * Indicative pricing. In production these rates come from the inventory /
 * bullion service; the UI always labels configured prices as indicative.
 */
export const GOLD_RATE_PER_GRAM = { '18k': 7900, '22k': 9600 } as const;
const MAKING_CHARGE = 0.16;
const STYLE_METAL_GRAMS = { classic: 5.6, minimal: 3.4, heritage: 7.2, contemporary: 6.4 } as const;
const TYPE_METAL_GRAMS = { pendant: 3.1, bracelet: 18 } as const;

export function stoneShapeFor(gem: Gemstone, size: StoneSize, customCarats?: number) {
  const key = size === 'custom' ? 'medium' : size;
  let [l, w] = gem.sizes[key];
  if (size === 'custom' && customCarats) {
    // scale the medium stone uniformly to reach the requested weight
    const base = caratsFor(gem, 'medium');
    const k = Math.cbrt(customCarats / base);
    l *= k;
    w *= k;
  }
  return { cut: gem.cut, a: l / 20, b: w / 20 };
}

export function caratsFor(gem: Gemstone, size: StoneSize, customCarats?: number) {
  if (size === 'custom' && customCarats) return customCarats;
  const volume = stoneVolume(stoneShapeFor(gem, size));
  return Math.round(volume * gem.gemmology.specificGravity * 5 * 100) / 100;
}

export function metalGrams(config: Configuration) {
  if (config.type !== 'ring') return TYPE_METAL_GRAMS[config.type];
  return STYLE_METAL_GRAMS[config.style] * (0.85 + config.size * 0.022);
}

export function estimatePrice(config: Configuration) {
  const gem = gemstoneBySlug(config.stone);
  if (!gem) return 0;
  const carats = caratsFor(gem, config.stoneSize, config.customCarats);
  const metal = metalGrams(config) * GOLD_RATE_PER_GRAM[config.purity] * (1 + MAKING_CHARGE);
  const stone = carats * gem.pricePerCarat;
  // round to the nearest ₹500 – prices should look considered, not computed
  return Math.round((metal + stone) / 500) * 500;
}

export const formatPrice = (value: number) => '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

import { create } from 'zustand';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { purityAvailable } from '@/lib/data/options';
import type { Configuration } from '@/lib/data/types';

export const DEFAULT_CONFIGURATION: Configuration = {
  type: 'ring',
  stone: 'moonga',
  metal: 'yellow-gold',
  purity: '22k',
  stoneSize: 'medium',
  style: 'classic',
  size: 7,
};

interface ConfiguratorState {
  config: Configuration;
  set: <K extends keyof Configuration>(key: K, value: Configuration[K]) => void;
  replace: (config: Configuration) => void;
}

export const useConfigurator = create<ConfiguratorState>((set) => ({
  config: DEFAULT_CONFIGURATION,
  set: (key, value) =>
    set((state) => {
      const config = { ...state.config, [key]: value };
      // keep combinations valid: 22K only exists in yellow gold
      if (!purityAvailable(config.metal, config.purity)) config.purity = '18k';
      return { config };
    }),
  replace: (config) => set({ config }),
}));

const KEYS: (keyof Configuration)[] = ['type', 'stone', 'metal', 'purity', 'stoneSize', 'style', 'size', 'customCarats'];

/** /configure?stone=moonga&metal=yellow-gold&purity=22k … */
export function configToSearch(config: Configuration) {
  const params = new URLSearchParams();
  for (const k of KEYS) {
    const v = config[k];
    if (v === undefined || v === DEFAULT_CONFIGURATION[k as keyof Configuration]) continue;
    params.set(k === 'stoneSize' ? 'stone-size' : k === 'customCarats' ? 'carats' : k, String(v));
  }
  return params.toString();
}

export function configFromSearch(search: URLSearchParams | Record<string, string | string[] | undefined>): Configuration {
  const get = (k: string) => {
    const v = search instanceof URLSearchParams ? search.get(k) : search[k];
    return Array.isArray(v) ? v[0] : (v ?? undefined);
  };
  const config: Configuration = { ...DEFAULT_CONFIGURATION };
  const stone = get('stone');
  if (stone && gemstoneBySlug(stone)) config.stone = stone;
  const metal = get('metal');
  if (metal === 'yellow-gold' || metal === 'rose-gold' || metal === 'white-gold') config.metal = metal;
  const purity = get('purity');
  if (purity === '18k' || purity === '22k') config.purity = purity;
  const stoneSize = get('stone-size');
  if (stoneSize === 'small' || stoneSize === 'medium' || stoneSize === 'large' || stoneSize === 'custom') config.stoneSize = stoneSize;
  const style = get('style');
  if (style === 'classic' || style === 'minimal' || style === 'heritage' || style === 'contemporary') config.style = style;
  const type = get('type');
  if (type === 'ring' || type === 'pendant' || type === 'bracelet') config.type = type;
  const size = Number(get('size'));
  if (size >= 4 && size <= 13) config.size = size;
  const carats = Number(get('carats'));
  if (carats > 0 && carats < 40) config.customCarats = carats;
  if (!purityAvailable(config.metal, config.purity)) config.purity = '18k';
  return config;
}

import type { RingStyle } from '@/lib/3d/geometry/jewellery';
import type { MetalId, Purity, StoneSize, Intention } from './types';

export const METAL_OPTIONS: { id: MetalId; label: string; note: string }[] = [
  { id: 'yellow-gold', label: 'Yellow gold', note: 'Warm, traditional. The classical setting for most Navratna.' },
  { id: 'rose-gold', label: 'Rose gold', note: 'Gold alloyed with copper for a soft blush.' },
  { id: 'white-gold', label: 'White gold', note: 'Rhodium-finished for a cool, quiet white.' },
];

export const PURITY_OPTIONS: { id: Purity; label: string; note: string }[] = [
  { id: '18k', label: '18K', note: '75% gold. Firmer, holds fine detail.' },
  { id: '22k', label: '22K', note: '91.6% gold. Richer colour; yellow gold only.' },
];

export const STONE_SIZE_OPTIONS: { id: StoneSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
  { id: 'custom', label: 'Custom' },
];

export const STYLE_OPTIONS: { id: RingStyle; label: string; note: string }[] = [
  { id: 'classic', label: 'Classic', note: 'A rounded bezel on swelling shoulders.' },
  { id: 'minimal', label: 'Minimal', note: 'A fine band and a knife-edge bezel.' },
  { id: 'heritage', label: 'Heritage', note: 'Milgrain, twisted wire and granulation.' },
  { id: 'contemporary', label: 'Contemporary', note: 'Squared profile, flush flat bezel.' },
];

/** US sizes with approximate Indian equivalents */
export const RING_SIZES: { us: number; india: number }[] = [
  { us: 5, india: 9 },
  { us: 6, india: 12 },
  { us: 7, india: 14 },
  { us: 8, india: 16 },
  { us: 9, india: 18 },
  { us: 10, india: 20 },
  { us: 11, india: 23 },
  { us: 12, india: 25 },
];

export const INTENTIONS: { id: Intention; label: string; line: string }[] = [
  { id: 'focus', label: 'Focus', line: 'Steadiness of attention' },
  { id: 'confidence', label: 'Confidence', line: 'A quieter kind of courage' },
  { id: 'clarity', label: 'Clarity', line: 'Of thought and of speech' },
  { id: 'prosperity', label: 'Prosperity', line: 'Growth, in its widest sense' },
  { id: 'protection', label: 'Protection', line: 'Worn as a keepsake' },
  { id: 'vitality', label: 'Vitality', line: 'Energy and resolve' },
  { id: 'calm', label: 'Calm', line: 'Composure and ease' },
  { id: 'harmony', label: 'Harmony', line: 'In relationships and in life' },
];

/** 22K is only offered in yellow gold: rose and white 22K alloys are too soft and unstable in colour. */
export const purityAvailable = (metal: MetalId, purity: Purity) => purity === '18k' || metal === 'yellow-gold';

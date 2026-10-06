import type { CutType } from '@/lib/3d/geometry/stones';
import type { JewelleryType, RingStyle } from '@/lib/3d/geometry/jewellery';

export type MetalId = 'yellow-gold' | 'rose-gold' | 'white-gold';
export type Purity = '18k' | '22k';
export type StoneSize = 'small' | 'medium' | 'large' | 'custom';
export type Intention = 'focus' | 'confidence' | 'clarity' | 'prosperity' | 'protection' | 'vitality' | 'calm' | 'harmony';

export interface Planet {
  name: string;
  vedic: string;
}

export interface Gemstone {
  slug: string;
  /** traditional Indian name, used as the display name */
  name: string;
  englishName: string;
  /** Navratna = one of the nine classical planetary stones; uparatna = a secondary / substitute stone */
  group: 'navratna' | 'uparatna';
  planet: Planet;
  epithet: string;
  /** Traditional associations — always presented as tradition, never as outcome. */
  traditionalAssociations: string[];
  intentions: Intention[];
  traditionNote: string;
  description: string;
  /** Verifiable gemmological facts */
  gemmology: {
    species: string;
    hardness: string;
    refractiveIndex: string;
    specificGravity: number;
    typicalOrigins: string[];
    treatments: string;
  };
  cut: CutType;
  cutLabel: string;
  /** length × width in millimetres */
  sizes: Record<Exclude<StoneSize, 'custom'>, [number, number]>;
  /** indicative price per carat, INR, for fine natural material */
  pricePerCarat: number;
  /** UI swatch only – the 3D material is defined in lib/3d/materials */
  swatch: string;
}

export interface Configuration {
  type: JewelleryType;
  stone: string;
  metal: MetalId;
  purity: Purity;
  stoneSize: StoneSize;
  style: RingStyle;
  /** US ring size; ignored for pendants and bracelets */
  size: number;
  /** custom target weight in carats (only when stoneSize = custom) */
  customCarats?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  type: JewelleryType;
  gemstone: string;
  configuration: Configuration;
  /**
   * Per-piece stone record. Origin and treatment are never guessed: they stay
   * null until the inventory record carries the laboratory report, and the UI
   * then reads "Stated on the laboratory report".
   */
  stoneDetails: {
    weightCarats: number;
    dimensionsMm: [number, number];
    origin: string | null;
    treatment: string | null;
    certification: string;
  };
  metalWeightGrams: number;
  sizes: number[];
  price: number;
  currency: 'INR';
  /** Optional authored GLB. When absent the procedural model is generated from the configuration. */
  modelPath?: string;
  /** Pre-rendered still, generated from the 3D model (npm run renders). */
  thumbnail: string;
  description: string;
  story: string;
  featured?: boolean;
}

export interface JournalArticle {
  slug: string;
  title: string;
  dek: string;
  category: 'Gemstones' | 'Guidance' | 'Craft' | 'Tradition';
  readingMinutes: number;
  date: string;
  stone?: string;
  body: { heading?: string; paragraphs: string[] }[];
}

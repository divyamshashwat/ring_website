import { gemstoneBySlug } from './gemstones';
import { caratsFor, estimatePrice, metalGrams, stoneShapeFor } from './pricing';
import type { Configuration, Product } from './types';

type ProductSeed = Omit<Product, 'id' | 'price' | 'currency' | 'stoneDetails' | 'metalWeightGrams' | 'thumbnail' | 'sizes' | 'gemstone'> & {
  stoneDetails: Pick<Product['stoneDetails'], 'origin' | 'treatment'>;
};

const RING_SIZES = [5, 6, 7, 8, 9, 10, 11, 12];

const seeds: ProductSeed[] = [
  {
    slug: 'moonga-ring',
    name: 'The Moonga Ring',
    subtitle: 'The Mars stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'moonga', metal: 'yellow-gold', purity: '22k', stoneSize: 'medium', style: 'classic', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    modelPath: '/models/rings/vyoma-classic-moonga.glb',
    featured: true,
    description:
      'A single oval of natural precious coral, held in a rounded 22K bezel that rises from gently swelling shoulders. The house signature.',
    story:
      'We look for coral with an even, saturated body and a fine, closed grain — the kind that takes a polish like warm wax. The bezel is formed by hand and burnished over the stone so that nothing interrupts its outline.',
  },
  {
    slug: 'lehsunia-ring',
    name: 'The Lehsunia Ring',
    subtitle: 'The Ketu stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'lehsunia', metal: 'yellow-gold', purity: '18k', stoneSize: 'medium', style: 'heritage', size: 8 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description:
      'A chrysoberyl cat’s eye cut high to gather its silk into one sharp line, framed in milgrain and a hand-twisted wire.',
    story:
      'A cat’s eye is cut for its line, not its weight. Our cutters orient the rough so the silk runs exactly across the dome, then raise the cabochon until the eye opens and closes cleanly as the stone turns.',
  },
  {
    slug: 'neelam-ring',
    name: 'The Neelam Ring',
    subtitle: 'The Saturn stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'neelam', metal: 'white-gold', purity: '18k', stoneSize: 'medium', style: 'minimal', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description: 'A clear blue sapphire on a fine white-gold band. Nothing between the stone and the light.',
    story: 'The knife-edge bezel was drawn to be as thin as the metal allows while still holding the stone securely for a lifetime of wear.',
  },
  {
    slug: 'pukhraj-ring',
    name: 'The Pukhraj Ring',
    subtitle: 'The Jupiter stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'pukhraj', metal: 'yellow-gold', purity: '22k', stoneSize: 'medium', style: 'classic', size: 9 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description: 'Yellow sapphire in high-carat gold — two warm golds, one mineral and one metal, set against each other.',
    story: 'We match the purity of the gold to the warmth of the stone, so the bezel reads as a continuation of the sapphire rather than a frame around it.',
  },
  {
    slug: 'panna-ring',
    name: 'The Panna Ring',
    subtitle: 'The Mercury stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'panna', metal: 'yellow-gold', purity: '18k', stoneSize: 'medium', style: 'contemporary', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description: 'An octagonal step-cut emerald set flush in a squared contemporary band.',
    story: 'Step cuts are honest: their long, quiet facets show everything inside the stone. We choose emeralds whose garden of inclusions is part of their beauty.',
  },
  {
    slug: 'manik-ring',
    name: 'The Manik Ring',
    subtitle: 'The Sun stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'manik', metal: 'yellow-gold', purity: '22k', stoneSize: 'medium', style: 'heritage', size: 8 },
    stoneDetails: { origin: null, treatment: null },
    description: 'A ruby in a heritage setting of milgrain and twisted wire, with granulation on each shoulder.',
    story: 'Granulation — tiny spheres of gold fused to a surface — is one of the oldest techniques in Indian goldsmithing. Here it is reduced to three grains on each shoulder.',
  },
  {
    slug: 'gomed-ring',
    name: 'The Gomed Ring',
    subtitle: 'The Rahu stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'gomed', metal: 'white-gold', purity: '18k', stoneSize: 'medium', style: 'classic', size: 9 },
    stoneDetails: { origin: null, treatment: null },
    description: 'Cinnamon-coloured hessonite in white gold, after the tradition of setting Gomed in white metal.',
    story: 'Hessonite has a slightly liquid quality inside — swirls that gemmologists call the treacle effect. We cut for depth so the colour gathers at the centre.',
  },
  {
    slug: 'heera-ring',
    name: 'The Heera Ring',
    subtitle: 'The Venus stone',
    type: 'ring',
    configuration: { type: 'ring', stone: 'heera', metal: 'white-gold', purity: '18k', stoneSize: 'medium', style: 'minimal', size: 6 },
    stoneDetails: { origin: null, treatment: null },
    description: 'A natural round brilliant diamond, bezel-set on a fine band.',
    story: 'A full bezel protects the girdle of the diamond and turns the stone into a single point of light.',
  },
  {
    slug: 'moti-pendant',
    name: 'The Moti Pendant',
    subtitle: 'The Moon stone',
    type: 'pendant',
    configuration: { type: 'pendant', stone: 'moti', metal: 'white-gold', purity: '18k', stoneSize: 'medium', style: 'classic', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description: 'A single round pearl in a white-gold cup, hung from a softly elongated bail.',
    story: 'A pearl is judged by its lustre. We select for a sharp, deep reflection — when you can see the window behind you in the pearl, it is the right one.',
  },
  {
    slug: 'moonga-pendant',
    name: 'The Moonga Pendant',
    subtitle: 'The Mars stone',
    type: 'pendant',
    configuration: { type: 'pendant', stone: 'moonga', metal: 'rose-gold', purity: '18k', stoneSize: 'small', style: 'classic', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    description: 'Red coral in rose gold — a quieter pairing than yellow gold, warm against the skin.',
    story: 'Worn close to the heart, the oval is set vertically and the bail is hidden behind the bezel.',
  },
  {
    slug: 'rajavarta-kada',
    name: 'The Rajavarta Kada',
    subtitle: 'A Saturn uparatna',
    type: 'bracelet',
    configuration: { type: 'bracelet', stone: 'lapis-lazuli', metal: 'yellow-gold', purity: '18k', stoneSize: 'large', style: 'heritage', size: 7 },
    stoneDetails: { origin: null, treatment: null },
    featured: true,
    description: 'An open kada in 18K gold with a lapis cabochon and ball finials, after the cuffs worn across India for centuries.',
    story: 'The kada opens just enough to slip over the wrist. The lapis is chosen for its flecks of natural pyrite — gold inside the stone, echoed by gold around it.',
  },
];

function toProduct(seed: ProductSeed, index: number): Product {
  const gem = gemstoneBySlug(seed.configuration.stone);
  if (!gem) throw new Error(`Unknown gemstone ${seed.configuration.stone}`);
  const config: Configuration = seed.configuration;
  const shape = stoneShapeFor(gem, config.stoneSize);
  return {
    ...seed,
    id: `vy-${String(index + 1).padStart(3, '0')}`,
    gemstone: gem.slug,
    currency: 'INR',
    sizes: seed.type === 'ring' ? RING_SIZES : [],
    price: estimatePrice(config),
    metalWeightGrams: Math.round(metalGrams(config) * 10) / 10,
    thumbnail: `/images/renders/${seed.slug}.webp`,
    stoneDetails: {
      ...seed.stoneDetails,
      weightCarats: caratsFor(gem, config.stoneSize),
      dimensionsMm: [Math.round(shape.a * 200) / 10, Math.round(shape.b * 200) / 10],
      certification: 'Independent gemmological laboratory report, issued per stone',
    },
  };
}

export const products: Product[] = seeds.map(toProduct);

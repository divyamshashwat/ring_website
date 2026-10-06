import { gemstones } from '@/lib/data/gemstones';
import { journal } from '@/lib/data/journal';
import { METAL_OPTIONS, PURITY_OPTIONS, RING_SIZES, STONE_SIZE_OPTIONS, STYLE_OPTIONS } from '@/lib/data/options';
import { products } from '@/lib/data/products';
import type { Gemstone, JournalArticle, Product } from '@/lib/data/types';

/**
 * Catalogue repository.
 *
 * Presentation code only talks to these async service functions. Today they
 * read static modules; swapping in Supabase / PostgreSQL / MongoDB means
 * implementing `CatalogRepository` and changing `repository` below — no UI
 * changes required.
 */
export interface CatalogRepository {
  products(): Promise<Product[]>;
  gemstones(): Promise<Gemstone[]>;
  articles(): Promise<JournalArticle[]>;
}

const staticRepository: CatalogRepository = {
  products: async () => products,
  gemstones: async () => gemstones,
  articles: async () => journal,
};

const repository: CatalogRepository = staticRepository;

export async function getProducts(filter?: { gemstone?: string; type?: Product['type'] }) {
  const all = await repository.products();
  return all.filter((p) => (!filter?.gemstone || p.gemstone === filter.gemstone) && (!filter?.type || p.type === filter.type));
}

export async function getProductBySlug(slug: string) {
  return (await repository.products()).find((p) => p.slug === slug) ?? null;
}

export async function getGemstones(group?: Gemstone['group']) {
  const all = await repository.gemstones();
  return group ? all.filter((g) => g.group === group) : all;
}

export async function getGemstoneBySlug(slug: string) {
  return (await repository.gemstones()).find((g) => g.slug === slug) ?? null;
}

export async function getArticles() {
  return [...(await repository.articles())].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticleBySlug(slug: string) {
  return (await repository.articles()).find((a) => a.slug === slug) ?? null;
}

/** Everything the configurator needs to render its options. */
export async function getConfigurations() {
  return {
    stones: (await repository.gemstones()).map(({ slug, name, englishName, swatch, group, cutLabel, sizes }) => ({ slug, name, englishName, swatch, group, cutLabel, sizes })),
    metals: METAL_OPTIONS,
    purities: PURITY_OPTIONS,
    stoneSizes: STONE_SIZE_OPTIONS,
    styles: STYLE_OPTIONS,
    ringSizes: RING_SIZES,
  };
}

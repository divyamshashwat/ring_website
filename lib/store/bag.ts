import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Configuration } from '@/lib/data/types';

export interface BagItem {
  key: string;
  productSlug?: string;
  name: string;
  configuration: Configuration;
  price: number;
  quantity: number;
}

interface BagState {
  items: BagItem[];
  wishlist: string[];
  lastAdded: string | null;
  add: (item: Omit<BagItem, 'key' | 'quantity'>) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  toggleWish: (slug: string) => void;
  dismissAdded: () => void;
}

const keyFor = (c: Configuration, slug?: string) => [slug ?? 'custom', c.type, c.stone, c.metal, c.purity, c.stoneSize, c.style, c.size, c.customCarats ?? ''].join('|');

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: [],
      wishlist: [],
      lastAdded: null,
      add: (item) =>
        set((state) => {
          const key = keyFor(item.configuration, item.productSlug);
          const existing = state.items.find((i) => i.key === key);
          const items = existing
            ? state.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
            : [...state.items, { ...item, key, quantity: 1 }];
          return { items, lastAdded: key };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) => set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(5, quantity)) } : i)) })),
      clear: () => set({ items: [] }),
      toggleWish: (slug) => set((s) => ({ wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((w) => w !== slug) : [...s.wishlist, slug] })),
      dismissAdded: () => set({ lastAdded: null }),
    }),
    {
      name: 'vyoma-bag',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, wishlist: s.wishlist }),
    },
  ),
);

export const bagCount = (items: BagItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const bagTotal = (items: BagItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);

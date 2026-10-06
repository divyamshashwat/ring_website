'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { CanvasTexture, MeshPhysicalMaterial, Texture } from 'three';
import gsap from 'gsap';
import { createMetalMaterial, metalTarget } from '@/lib/3d/materials/metal';
import { createGemMaterial, setGemDim, type GemMaterial } from '@/lib/3d/materials/gemstone';
import { createHallmarkTexture, createScratchTexture, updateHallmarkTexture } from '@/lib/3d/textures/metalTextures';
import type { MetalId, Purity } from '@/lib/data/types';

/**
 * One material library per canvas: materials and textures are created once,
 * shared by every part, tweened in place (never swapped for colour changes),
 * and disposed with the canvas.
 */
export interface MaterialLibrary {
  metal: MeshPhysicalMaterial;
  shank: MeshPhysicalMaterial;
  gem: (slug: string) => GemMaterial;
  setMetal: (metal: MetalId, purity: Purity, animate: boolean) => void;
  allGems: () => GemMaterial[];
  /** brightness multiplier per stone (used by transitions); read by every stone renderer */
  setDim: (slug: string, value: number) => void;
  getDim: (slug: string) => number;
}

const Context = createContext<MaterialLibrary | null>(null);

export function useMaterials() {
  const lib = useContext(Context);
  if (!lib) throw new Error('useMaterials must be used inside <MaterialLibraryProvider>');
  return lib;
}

export function MaterialLibraryProvider({ children, metal = 'yellow-gold', purity = '22k' }: { children: ReactNode; metal?: MetalId; purity?: Purity }) {
  const lib = useMemo(() => {
    const textures: Texture[] = [];
    const scratches = createScratchTexture(1024);
    const hallmark: CanvasTexture = createHallmarkTexture(`VYOMA  ${purity.toUpperCase()}`);
    textures.push(scratches, hallmark);
    const metalMaterial = createMetalMaterial(metal, purity, { roughness: scratches });
    const shank = createMetalMaterial(metal, purity, { roughness: scratches, bump: hallmark });
    const gems = new Map<string, GemMaterial>();
    const dims = new Map<string, number>();
    let currentPurity = purity;

    const library: MaterialLibrary & { dispose: () => void } = {
      metal: metalMaterial,
      shank,
      gem(slug) {
        let m = gems.get(slug);
        if (!m) {
          m = createGemMaterial(slug);
          gems.set(slug, m);
        }
        return m;
      },
      allGems: () => [...gems.values()],
      setDim(slug, value) {
        dims.set(slug, value);
        const m = gems.get(slug);
        if (m) setGemDim(m, value);
      },
      getDim: (slug) => dims.get(slug) ?? 1,
      setMetal(nextMetal, nextPurity, animate) {
        const target = metalTarget(nextMetal, nextPurity);
        for (const m of [metalMaterial, shank]) {
          gsap.killTweensOf([m, m.color]);
          if (animate) {
            // the actual PBR properties move: base reflectance, roughness, anisotropy
            gsap.to(m.color, { r: target.color.r, g: target.color.g, b: target.color.b, duration: 0.9, ease: 'power3.inOut' });
            gsap.to(m, { roughness: target.roughness, anisotropy: target.anisotropy, duration: 0.9, ease: 'power3.inOut' });
          } else {
            m.color.copy(target.color);
            m.roughness = target.roughness;
            m.anisotropy = target.anisotropy;
          }
        }
        if (nextPurity !== currentPurity) {
          currentPurity = nextPurity;
          updateHallmarkTexture(hallmark, `VYOMA  ${nextPurity.toUpperCase()}`);
        }
      },
      dispose() {
        metalMaterial.dispose();
        shank.dispose();
        gems.forEach((g) => g.dispose());
        textures.forEach((t) => t.dispose());
      },
    };
    return library;
    // the library lives for the lifetime of the canvas; metal changes go through setMetal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => lib.dispose(), [lib]);
  return <Context.Provider value={lib}>{children}</Context.Provider>;
}

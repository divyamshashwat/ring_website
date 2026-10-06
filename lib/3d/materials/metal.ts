import { Color, LinearSRGBColorSpace, MeshPhysicalMaterial, type Texture } from 'three';
import type { MetalId, Purity } from '@/lib/data/types';

/**
 * Metals are defined by their measured base reflectance (F0) in linear RGB,
 * not by a "gold-looking" sRGB colour. metalness is always 1.
 */
interface MetalSpec {
  f0: [number, number, number];
  roughness: number;
  anisotropy: number;
}

const METALS: Record<MetalId, Record<Purity, MetalSpec>> = {
  'yellow-gold': {
    '18k': { f0: [0.95, 0.73, 0.4], roughness: 0.15, anisotropy: 0 },
    '22k': { f0: [0.98, 0.72, 0.33], roughness: 0.16, anisotropy: 0 },
  },
  'rose-gold': {
    '18k': { f0: [0.93, 0.64, 0.52], roughness: 0.15, anisotropy: 0 },
    '22k': { f0: [0.95, 0.66, 0.46], roughness: 0.16, anisotropy: 0 },
  },
  // rhodium-plated white gold: slightly warm and a touch rougher so it never reads as chrome
  'white-gold': {
    '18k': { f0: [0.8, 0.79, 0.76], roughness: 0.18, anisotropy: 0 },
    '22k': { f0: [0.81, 0.79, 0.75], roughness: 0.19, anisotropy: 0 },
  },
};

export const metalSpec = (metal: MetalId, purity: Purity) => METALS[metal][purity];

export function createMetalMaterial(metal: MetalId, purity: Purity, maps: { roughness?: Texture | null; bump?: Texture | null } = {}) {
  const spec = metalSpec(metal, purity);
  const material = new MeshPhysicalMaterial({
    metalness: 1,
    roughness: spec.roughness,
    anisotropy: spec.anisotropy,
    anisotropyRotation: 0,
    envMapIntensity: 1.15,
  });
  material.color.setRGB(...spec.f0, LinearSRGBColorSpace);
  if (maps.roughness) material.roughnessMap = maps.roughness;
  if (maps.bump) {
    material.bumpMap = maps.bump;
    material.bumpScale = 0.6;
  }
  material.name = 'Metal';
  return material;
}

/** Target values for a metal; used by GSAP to tween the actual material properties. */
export function metalTarget(metal: MetalId, purity: Purity) {
  const spec = metalSpec(metal, purity);
  return { color: new Color().setRGB(...spec.f0, LinearSRGBColorSpace), roughness: spec.roughness, anisotropy: spec.anisotropy };
}

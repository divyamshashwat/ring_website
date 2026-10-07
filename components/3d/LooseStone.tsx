'use client';

import { forwardRef, useEffect, useMemo } from 'react';
import type { Mesh } from 'three';
import { buildStoneGeometry } from '@/lib/3d/geometry/stones';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { stoneShapeFor } from '@/lib/data/pricing';
import type { StoneSize } from '@/lib/data/types';
import Gem from './GemstoneMaterial';
import { useQuality } from './QualityContext';

/**
 * A loose gemstone, centred on its own visual middle and normalised to a
 * given display size so stones of very different carat weights compose well.
 */
const LooseStone = forwardRef<Mesh, { slug: string; size?: StoneSize; displaySize?: number }>(function LooseStone({ slug, size = 'medium', displaySize }, ref) {
  const quality = useQuality();
  const geometry = useMemo(() => {
    const gem = gemstoneBySlug(slug)!;
    const g = buildStoneGeometry(stoneShapeFor(gem, size), quality);
    g.computeBoundingBox();
    const box = g.boundingBox!;
    g.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
    if (displaySize) {
      const s = displaySize / Math.max(box.max.x - box.min.x, box.max.z - box.min.z, box.max.y - box.min.y);
      g.scale(s, s, s);
    }
    g.computeBoundingSphere();
    return g;
  }, [slug, size, displaySize, quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <Gem ref={ref} slug={slug} geometry={geometry} />;
});

export default LooseStone;

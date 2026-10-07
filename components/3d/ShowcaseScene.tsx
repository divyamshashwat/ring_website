'use client';

import type { Configuration } from '@/lib/data/types';
import ProductModel from './ProductModel';
import { ProductStill } from './Fallbacks';
import Viewer from './Viewer';

/** A single display object for editorial product presentation (no visible controls). */
export default function ShowcaseScene({ config, label }: { config: Configuration; label: string }) {
  const bracelet = config.type === 'bracelet';
  const pendant = config.type === 'pendant';
  return (
    <Viewer
      controls={false}
      wheelZoom={false}
      metal={config.metal}
      purity={config.purity}
      cameraDuration={1.2}
      pose={bracelet ? { position: [0, 2.4, 15.5], target: [0, -0.1, 0], fov: 25 } : pendant ? { position: [0, 0.3, 4.6], target: [0, 0, 0], fov: 25 } : { position: [0, 0.85, 6.8], target: [0, 0.05, 0], fov: 25 }}
      restPitch={pendant ? 0.1 : 0.6}
      restYaw={pendant ? 0.35 : -0.62}
      shadow={bracelet ? -2.25 : pendant ? -1.0 : -1.32}
      fallback={<ProductStill config={config} />}
      label={label}
    >
      <ProductModel config={config} />
    </Viewer>
  );
}

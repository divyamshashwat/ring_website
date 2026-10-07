'use client';

import type { Configuration } from '@/lib/data/types';
import ProductModel from './ProductModel';
import { ProductStill } from './Fallbacks';
import Viewer from './Viewer';

export default function RingViewer({ config, modelPath, className, label }: { config: Configuration; modelPath?: string; className?: string; label?: string }) {
  const bracelet = config.type === 'bracelet';
  const pendant = config.type === 'pendant';
  return (
    <Viewer
      className={className}
      metal={config.metal}
      purity={config.purity}
      pose={bracelet ? { position: [0, 2.2, 15], target: [0, 0, 0], fov: 26 } : pendant ? { position: [0, 0.3, 5], target: [0, 0, 0], fov: 26 } : { position: [0, 0.7, 6.6], target: [0, 0.05, 0], fov: 26 }}
      restPitch={pendant ? 0.1 : 0.6}
      restYaw={pendant ? 0.3 : -0.62}
      shadow={bracelet ? -2.2 : pendant ? -0.95 : -1.3}
      fallback={<ProductStill config={config} />}
      label={label ?? 'Interactive 3D model'}
    >
      <ProductModel config={config} modelPath={modelPath} />
    </Viewer>
  );
}

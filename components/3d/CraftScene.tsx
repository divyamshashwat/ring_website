'use client';

import { ContactShadows } from '@react-three/drei';
import { useCallback, useMemo, useRef } from 'react';
import type { Configuration } from '@/lib/data/types';
import CameraRig, { type CameraDriver } from './CameraRig';
import StudioEnvironment from './Environment';
import LightingRig from './LightingRig';
import { MaterialLibraryProvider } from './MaterialLibrary';
import ProductModel, { type ProductLayout } from './ProductModel';
import Stage from './Stage';

export const CRAFT_CONFIG: Configuration = { type: 'ring', stone: 'lehsunia', metal: 'yellow-gold', purity: '22k', stoneSize: 'medium', style: 'heritage', size: 7 };

type V3 = [number, number, number];
export interface CraftStop {
  position: V3;
  target: V3;
  fov: number;
}

/** Camera stops for the macro tour, derived from the actual model's layout. */
export function craftStops(l: ProductLayout): CraftStop[] {
  const S = l.stone;
  const c = l.center;
  const R = l.innerRadius;
  const phi = 0.36;
  const shoulder: V3 = [(R + 0.27) * Math.sin(phi) - c.x, (R + 0.27) * Math.cos(phi) - c.y, 0];
  const bottom: V3 = [0, -R - c.y + 0.02, 0];
  return [
    { position: [3.6, 2.3, 5.4], target: [0, 0.1, 0], fov: 24 },
    { position: [S.x + 1.05, S.y + 0.8, S.z + 1.35], target: [S.x, S.y + 0.02, S.z], fov: 22 },
    { position: [shoulder[0] + 1.15, shoulder[1] + 0.35, 1.05], target: shoulder, fov: 22 },
    { position: [bottom[0] + 0.05, bottom[1] + 0.95, 1.3], target: bottom, fov: 24 },
    { position: [0.35, -0.15, 4.6], target: [0, -0.05, 0], fov: 24 },
  ];
}

export default function CraftScene({ driver, onLayout }: { driver: CameraDriver; onLayout: (l: ProductLayout) => void }) {
  const layoutOnce = useRef(false);
  const handleLayout = useCallback(
    (l: ProductLayout) => {
      if (layoutOnce.current) return;
      layoutOnce.current = true;
      onLayout(l);
    },
    [onLayout],
  );
  const config = useMemo(() => CRAFT_CONFIG, []);
  return (
    <Stage style={{ width: '100%', height: '100%' }} camera={{ position: [3.6, 2.3, 5.4], fov: 24 }} ariaLabel="Macro views of a heritage ring: bezel, milgrain, granulation, hallmark and polish">
      <MaterialLibraryProvider metal="yellow-gold" purity="22k">
        <StudioEnvironment />
        <LightingRig follow={0.1} drift={0.12} />
        <CameraRig driver={driver} parallax={0.03} />
        <ProductModel config={config} animateChanges={false} onLayout={handleLayout} />
        <ContactShadows position={[0, -1.32, 0]} opacity={0.22} scale={7} blur={3} far={2.4} resolution={256} color="#4b3b2b" frames={1} />
      </MaterialLibraryProvider>
    </Stage>
  );
}

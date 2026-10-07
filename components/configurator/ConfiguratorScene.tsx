'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Mesh, SphereGeometry } from 'three';
import ProductModel, { type SwapKind } from '@/components/3d/ProductModel';
import { useMaterials } from '@/components/3d/MaterialLibrary';
import { ProductStill } from '@/components/3d/Fallbacks';
import Viewer, { type ViewerApi } from '@/components/3d/Viewer';
import { GEM_SPECS } from '@/lib/3d/materials/gemstone';
import type { Configuration } from '@/lib/data/types';

/**
 * Compiles every rasterised gem material once, off the critical path, so the
 * first switch to a new stone never hitches mid-transition.
 */
function Warmup() {
  const lib = useMaterials();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const id = setTimeout(() => {
      const geometry = new SphereGeometry(0.001, 4, 4);
      const meshes = Object.keys(GEM_SPECS)
        .filter((slug) => !GEM_SPECS[slug].refraction)
        .map((slug) => {
          const m = new Mesh(geometry, lib.gem(slug));
          m.frustumCulled = false;
          m.position.set(0, -50, 0);
          scene.add(m);
          return m;
        });
      gl.compileAsync(scene, camera)
        .catch(() => undefined)
        .finally(() => {
          meshes.forEach((m) => scene.remove(m));
          geometry.dispose();
        });
    }, 1200);
    return () => clearTimeout(id);
  }, [lib, gl, scene, camera]);
  return null;
}

export default function ConfiguratorScene({ config, label }: { config: Configuration; label: string }) {
  const api = useRef<ViewerApi | null>(null);
  const sweep = useRef<(() => void) | null>(null);
  const bracelet = config.type === 'bracelet';
  const pendant = config.type === 'pendant';

  const onSwap = (kind: SwapKind) => {
    if (kind === 'stone') {
      // the ring turns, the camera leans in, light passes across the new stone
      api.current?.nudge(0.55);
      api.current?.push();
      setTimeout(() => sweep.current?.(), 380);
    } else {
      api.current?.nudge(0.3);
    }
  };

  return (
    <Viewer
      apiRef={api}
      sweepRef={sweep}
      metal={config.metal}
      purity={config.purity}
      pose={bracelet ? { position: [0, 2.4, 15.5], target: [0, -0.1, 0], fov: 25 } : pendant ? { position: [0, 0.35, 5.2], target: [0, 0, 0], fov: 25 } : { position: [0, 0.95, 7.0], target: [0, 0.05, 0], fov: 25 }}
      restPitch={pendant ? 0.1 : 0.62}
      restYaw={pendant ? 0.35 : -0.62}
      shadow={bracelet ? -2.25 : pendant ? -1.0 : -1.32}
      fallback={<ProductStill config={config} />}
      label={label}
      extras={<Warmup />}
      cameraDuration={1.4}
    >
      <ProductModel config={config} onSwap={onSwap} />
    </Viewer>
  );
}

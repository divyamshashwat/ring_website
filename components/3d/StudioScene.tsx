'use client';

import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Configuration } from '@/lib/data/types';
import type { CameraStateName } from '@/lib/3d/cameraStates';
import CameraRig from './CameraRig';
import StudioEnvironment from './Environment';
import LightingRig from './LightingRig';
import { MaterialLibraryProvider } from './MaterialLibrary';
import ProductModel from './ProductModel';
import Stage from './Stage';

/** Deterministic still-life used for product renders and visual QA. */
function Still({ config, modelPath, yaw, pitch }: { config: Configuration; modelPath?: string; yaw: number; pitch: number }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.set(pitch, yaw, 0);
  });
  return (
    <group ref={g}>
      <ProductModel config={config} modelPath={modelPath} animateChanges={false} />
    </group>
  );
}

export default function StudioScene({
  config,
  modelPath,
  yaw = -0.62,
  pitch = 0.62,
  camera = 'PRODUCT',
  onReady,
}: {
  config: Configuration;
  modelPath?: string;
  yaw?: number;
  pitch?: number;
  camera?: CameraStateName;
  onReady?: () => void;
}) {
  const shadowY = config.type === 'bracelet' ? -2.1 : config.type === 'pendant' ? -0.9 : -1.25;
  return (
    <Stage className="studio-stage" style={{ width: '100%', height: '100%' }} persistent maxDpr={1} onReady={onReady}>
      <MaterialLibraryProvider metal={config.metal} purity={config.purity}>
        <StudioEnvironment />
        <LightingRig follow={0} drift={0} />
        <CameraRig state={camera} parallax={0} duration={0} pose={config.type === 'bracelet' ? { position: [0, 2.4, 15], target: [0, 0, 0], fov: 26 } : undefined} />
        <Still config={config} modelPath={modelPath} yaw={yaw} pitch={pitch} />
        <ContactShadows position={[0, shadowY, 0]} opacity={0.32} scale={8} blur={2.6} far={2.2} resolution={512} color="#4b3b2b" frames={1} />
      </MaterialLibraryProvider>
    </Stage>
  );
}

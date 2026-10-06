'use client';

import { Environment as DreiEnvironment, Lightformer } from '@react-three/drei';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Scene } from 'three';

/**
 * Studio reflection environments, built from softboxes and rendered once into
 * cube maps (frames = 1 — no per-frame cost).
 *
 *  - Metal studio: a darker room with large diffused lights, so polished gold has
 *    contrast to reflect instead of reading as flat yellow.
 *  - Gem tent: a bright, diffused light tent — how coloured stones are
 *    photographed — used by the ray-traced faceted stones.
 */
const GemEnvContext = createContext<Scene | null>(null);
export const useGemEnvScene = () => useContext(GemEnvContext);

function Softboxes({ front = 1.6 }: { front?: number }) {
  return (
    <>
      {/* large overhead key softbox */}
      <Lightformer form="rect" intensity={2.6} color="#fffdf9" position={[0, 6, 1.5]} rotation-x={Math.PI / 2} scale={[9, 4, 1]} />
      {/* front-left softbox */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-5, 1.6, 4]} rotation-y={Math.PI / 3.2} scale={[3.5, 6, 1]} />
      {/* right strip — the long rim highlight along the shank */}
      <Lightformer form="rect" intensity={3.2} color="#ffffff" position={[5.5, 1, -1]} rotation-y={-Math.PI / 2.1} scale={[0.7, 8, 1]} />
      {/* left strip behind */}
      <Lightformer form="rect" intensity={1.4} color="#fffaf2" position={[-5, 0.5, -3.5]} rotation-y={Math.PI / 4} scale={[0.5, 7, 1]} />
      {/* back horizon band */}
      <Lightformer form="rect" intensity={1.0} color="#fffdf8" position={[0, 0.6, -7]} scale={[12, 0.6, 1]} />
      {/* warm fill bouncing up from the ivory table */}
      <Lightformer form="rect" intensity={0.7} color="#ffd9a6" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[12, 4, 1]} />
      {/* soft bank behind the camera — lights every surface that faces the viewer */}
      <Lightformer form="rect" intensity={front} color="#fffcf6" position={[0, 1.2, 9]} rotation-y={Math.PI} scale={[7, 3.2, 1]} />
      {/* small hard card for crisp specular sparkles */}
      <Lightformer form="circle" intensity={6} color="#ffffff" position={[2.4, 4, 4]} scale={0.6} />
    </>
  );
}

export default function StudioEnvironment({ resolution = 256, children }: { resolution?: number; children?: ReactNode }) {
  const gemScene = useMemo(() => new Scene(), []);
  return (
    <GemEnvContext.Provider value={gemScene}>
      <DreiEnvironment resolution={resolution} frames={1}>
        <color attach="background" args={['#4d4945']} />
        <Softboxes />
      </DreiEnvironment>
      <DreiEnvironment resolution={resolution} frames={1} scene={gemScene}>
        <color attach="background" args={['#c9c4bc']} />
        <Softboxes front={2.4} />
        {/* dark flags give faceted stones their contrast pattern */}
        <Lightformer form="rect" intensity={0} color="#000000" position={[0, 3, -4]} scale={[3, 3, 1]} />
      </DreiEnvironment>
      {children}
    </GemEnvContext.Provider>
  );
}

'use client';

import { Environment as DreiEnvironment, Lightformer } from '@react-three/drei';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { AdditiveBlending, BackSide, CanvasTexture, Color, DoubleSide, MeshBasicMaterial, Scene, ShaderMaterial, SRGBColorSpace, type Texture } from 'three';

/**
 * Studio reflection environments, rendered once into cube maps (frames = 1 — no per-frame cost).
 *
 *  - Metal light box: how jewellery is photographed. A bright, smoothly graded
 *    tent (bright overhead, soft grey horizon, warm table below) so a curved band
 *    reflects a continuous gradient and reads as round; soft-edged softboxes for
 *    the long highlights; dark cards for the crisp edge lines that give polished
 *    gold its definition. No hard-edged shapes anywhere: a hard rectangle
 *    reflected in a curved band is what makes metal look flat and cartoon-like.
 *  - Gem tent: brighter and more even, used by the ray-traced faceted stones.
 */
const GemEnvContext = createContext<Scene | null>(null);
export const useGemEnvScene = () => useContext(GemEnvContext);

/** A rounded rectangle whose brightness falls off smoothly to nothing at its edges. */
function softTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // distance to the edge of a rounded square, 0 at the edge, 1 well inside
      const u = Math.abs(x / (size - 1) - 0.5) * 2;
      const v = Math.abs(y / (size - 1) - 0.5) * 2;
      const d = Math.pow(Math.pow(u, 6) + Math.pow(v, 6), 1 / 6);
      const t = Math.min(1, Math.max(0, (1 - d) / 0.42));
      const a = t * t * (3 - 2 * t);
      const i = (y * size + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

let shared: Texture | null = null;
const getSoft = () => (shared ??= softTexture());

/** A soft-edged light source (adds light to the tent behind it). */
function Softbox({ color = '#ffffff', intensity = 1, ...props }: { color?: string; intensity?: number } & Record<string, unknown>) {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getSoft(),
        color: new Color(color).multiplyScalar(intensity),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: DoubleSide,
      }),
    [color, intensity],
  );
  useEffect(() => () => material.dispose(), [material]);
  return <Lightformer {...props}>{<primitive object={material} attach="material" />}</Lightformer>;
}

/** A soft-edged black card: the dark reflections that outline polished metal. */
function Flag({ opacity = 1, ...props }: { opacity?: number } & Record<string, unknown>) {
  const material = useMemo(
    () => new MeshBasicMaterial({ map: getSoft(), color: '#000000', transparent: true, opacity, depthWrite: false, toneMapped: false, side: DoubleSide }),
    [opacity],
  );
  useEffect(() => () => material.dispose(), [material]);
  return <Lightformer {...props}>{<primitive object={material} attach="material" />}</Lightformer>;
}

/** The tent itself: a vertical gradient sphere in linear HDR values. */
type RGB = [number, number, number];
const linear = (c: RGB) => new Color().setRGB(c[0], c[1], c[2]);

function Tent({ top, horizon, low, floor }: { top: RGB; horizon: RGB; low: RGB; floor: RGB }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTop: { value: linear(top) },
          uHorizon: { value: linear(horizon) },
          uLow: { value: linear(low) },
          uFloor: { value: linear(floor) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uLow; uniform vec3 uFloor;
          varying vec3 vDir;
          void main() {
            float y = normalize(vDir).y;
            vec3 c = mix(uHorizon, uTop, smoothstep(0.0, 0.85, y));
            c = mix(c, uLow, smoothstep(0.0, -0.22, y));
            c = mix(c, uFloor, smoothstep(-0.22, -0.9, y));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [top.join(), horizon.join(), low.join(), floor.join()],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} scale={40}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  );
}

function MetalLightBox() {
  return (
    <>
      {/* bright overhead, soft grey horizon, a darker band where the table meets the tent, warm bounce below */}
      <Tent top={[1.25, 1.22, 1.17]} horizon={[0.62, 0.6, 0.57]} low={[0.12, 0.11, 0.1]} floor={[0.36, 0.32, 0.27]} />
      {/* large overhead softbox */}
      <Softbox intensity={1.8} color="#fffaf2" position={[0, 7, 1]} rotation-x={Math.PI / 2} scale={[11, 6, 1]} />
      {/* tall front-left softbox */}
      <Softbox intensity={1.5} position={[-6, 1.8, 5]} target={[0, 0, 0]} scale={[4.5, 8, 1]} />
      {/* long right strip: the rim highlight along the shank */}
      <Softbox intensity={2.6} position={[6.5, 1, -0.5]} target={[0, 0, 0]} scale={[1.4, 10, 1]} />
      {/* back-left strip */}
      <Softbox intensity={1.2} color="#fff8ee" position={[-5.5, 0.8, -5]} target={[0, 0, 0]} scale={[1.2, 9, 1]} />
      {/* soft bank behind the camera: lights every surface that faces the viewer */}
      <Softbox intensity={0.9} color="#fffcf6" position={[0, 1, 10]} target={[0, 0, 0]} scale={[10, 4, 1]} />
      {/* small hot card for the sparkle highlights */}
      <Softbox intensity={5} position={[2.6, 4.4, 4]} target={[0, 0, 0]} scale={[1.1, 1.1, 1]} />
      {/* dark cards: the edge lines that make polished gold read as metal */}
      <Flag position={[-7.5, 0.2, 1.5]} target={[0, 0, 0]} scale={[3.5, 9, 1]} opacity={0.92} />
      <Flag position={[5.5, -0.2, 5.5]} target={[0, 0, 0]} scale={[3, 7, 1]} opacity={0.75} />
      <Flag position={[1.5, 0.6, -8]} target={[0, 0, 0]} scale={[5, 3.5, 1]} opacity={0.55} />
    </>
  );
}

function GemTent() {
  return (
    <>
      <Tent top={[0.8, 0.79, 0.76]} horizon={[0.46, 0.45, 0.43]} low={[0.14, 0.135, 0.13]} floor={[0.32, 0.3, 0.28]} />
      <Softbox intensity={2.4} color="#fffdf9" position={[0, 7, 1.5]} rotation-x={Math.PI / 2} scale={[10, 5, 1]} />
      <Softbox intensity={1.8} position={[-5, 1.6, 4]} target={[0, 0, 0]} scale={[4, 7, 1]} />
      <Softbox intensity={3} position={[5.5, 1, -1]} target={[0, 0, 0]} scale={[1, 9, 1]} />
      <Softbox intensity={2.4} color="#fffcf6" position={[0, 1.2, 9]} target={[0, 0, 0]} scale={[8, 3.5, 1]} />
      <Softbox intensity={7} position={[2.4, 4, 4]} target={[0, 0, 0]} scale={[0.9, 0.9, 1]} />
      {/* dark flags give faceted stones their contrast pattern */}
      <Flag position={[0, 3, -5]} target={[0, 0, 0]} scale={[3.5, 3.5, 1]} opacity={0.9} />
      <Flag position={[-6, -0.5, -2]} target={[0, 0, 0]} scale={[2, 6, 1]} opacity={0.7} />
    </>
  );
}

export default function StudioEnvironment({ resolution = 512, children }: { resolution?: number; children?: ReactNode }) {
  const gemScene = useMemo(() => new Scene(), []);
  return (
    <GemEnvContext.Provider value={gemScene}>
      <DreiEnvironment resolution={resolution} frames={1}>
        <MetalLightBox />
      </DreiEnvironment>
      <DreiEnvironment resolution={Math.min(resolution, 256)} frames={1} scene={gemScene}>
        <GemTent />
      </DreiEnvironment>
      {children}
    </GemEnvContext.Provider>
  );
}

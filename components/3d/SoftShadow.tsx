'use client';

import { forwardRef, useEffect, useMemo } from 'react';
import { CanvasTexture, Color, MeshBasicMaterial, SRGBColorSpace, type Mesh } from 'three';

let texture: CanvasTexture | null = null;
function shadowTexture() {
  if (texture) return texture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.62)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A soft contact shadow drawn as a single textured quad. It costs nothing per
 * frame, unlike a live shadow pass, so phones get a grounded piece too.
 */
const SoftShadow = forwardRef<Mesh, { y?: number; width?: number; depth?: number; opacity?: number; color?: string }>(function SoftShadow(
  { y = -1.3, width = 3.2, depth = 1.6, opacity = 0.32, color = '#4b3b2b' },
  ref,
) {
  const material = useMemo(
    () => new MeshBasicMaterial({ map: shadowTexture(), color: new Color(color), transparent: true, opacity, depthWrite: false, toneMapped: false }),
    [color, opacity],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation-x={-Math.PI / 2} scale={[width, depth, 1]} material={material} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
});

export default SoftShadow;

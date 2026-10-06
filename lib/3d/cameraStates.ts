import type { PerspectiveCamera } from 'three';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** horizontal shift of the subject as a fraction of the viewport width (+ = right) */
  offsetX?: number;
}

/** Named cinematic camera states. Units are centimetres; the ring is ~2.4 cm tall. */
export const CAMERA_STATES = {
  HERO: { position: [0, 0.55, 7.6], target: [0, 0.12, 0], fov: 26, offsetX: 0.2 },
  PRODUCT: { position: [0, 0.75, 6.6], target: [0, 0.05, 0], fov: 26, offsetX: 0 },
  MACRO: { position: [0.5, 2.0, 2.4], target: [0, 1.25, 0], fov: 22, offsetX: 0 },
  DETAIL: { position: [1.6, 1.4, 3.2], target: [0, 0.9, 0], fov: 22, offsetX: 0 },
  CONFIGURATOR: { position: [0, 0.95, 7.0], target: [0, 0.08, 0], fov: 25, offsetX: 0 },
  STONE: { position: [0, 0.5, 3.6], target: [0, 0, 0], fov: 24, offsetX: 0 },
  EDITORIAL: { position: [3.2, 0.9, 6.2], target: [0, 0.1, 0], fov: 24, offsetX: -0.14 },
} satisfies Record<string, CameraPose>;

export type CameraStateName = keyof typeof CAMERA_STATES;

/** Off-centre framing via film offset: keeps product-photography perspective (no skew). */
export function applyScreenOffset(camera: PerspectiveCamera, fraction: number) {
  const tan = Math.tan((camera.fov * Math.PI) / 360);
  const filmWidth = camera.getFilmWidth();
  const aspectWidth = 2 * tan * camera.aspect;
  // left += near * filmOffset / filmWidth; we want the frustum to shift by -fraction of its width
  const offset = (-fraction * aspectWidth * filmWidth) / 1;
  if (Math.abs(camera.filmOffset - offset) > 1e-4) {
    camera.filmOffset = offset;
    return true;
  }
  return false;
}

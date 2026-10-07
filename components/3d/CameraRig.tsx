'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import gsap from 'gsap';
import { applyScreenOffset, CAMERA_STATES, type CameraPose, type CameraStateName } from '@/lib/3d/cameraStates';
import { pointer } from '@/lib/pointer';
import { prefersReducedMotion } from '@/lib/motion';

/** Mutable camera values. Scroll timelines write into a driver; the rig reads it every frame. */
export interface CameraDriver {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
  offsetX: number;
  /** optional look-at override (e.g. follow a moving object), blended in by lw (0–1) */
  lx?: number;
  ly?: number;
  lz?: number;
  lw?: number;
}

export const poseToDriver = (pose: CameraPose): CameraDriver => ({
  px: pose.position[0],
  py: pose.position[1],
  pz: pose.position[2],
  tx: pose.target[0],
  ty: pose.target[1],
  tz: pose.target[2],
  fov: pose.fov,
  offsetX: pose.offsetX ?? 0,
});

export interface ZoomRef {
  value: number;
  target: number;
  min: number;
  max: number;
}

interface CameraRigProps {
  /** named state – transitions are animated with GSAP, never cut */
  state?: CameraStateName;
  pose?: CameraPose;
  /** an external driver (e.g. a ScrollTrigger timeline) takes precedence over state */
  driver?: CameraDriver;
  zoom?: ZoomRef;
  /** pointer parallax in scene units */
  parallax?: number;
  duration?: number;
  /** subject offset override for narrow screens */
  offsetX?: number;
}

const look = new Vector3();
const lookOverride = new Vector3();
const pos = new Vector3();

export default function CameraRig({ state = 'PRODUCT', pose, driver, zoom, parallax = 0.12, duration = 1.6, offsetX }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const current = useRef<CameraDriver>(poseToDriver(pose ?? CAMERA_STATES[state]));
  const smoothPointer = useRef({ x: 0, y: 0 });

  const poseKey = pose ? JSON.stringify(pose) : state;
  useEffect(() => {
    if (driver) return;
    const next = poseToDriver(pose ?? CAMERA_STATES[state]);
    if (offsetX !== undefined) next.offsetX = offsetX;
    const tween = gsap.to(current.current, { ...next, duration: prefersReducedMotion() ? 0 : duration, ease: 'expo.inOut', overwrite: true });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey, driver, duration, offsetX]);

  useFrame((_, dt) => {
    const d = driver ?? current.current;
    const sp = smoothPointer.current;
    sp.x = MathUtils.damp(sp.x, pointer.nx, 2.5, dt);
    sp.y = MathUtils.damp(sp.y, pointer.ny, 2.5, dt);
    if (zoom) zoom.value = MathUtils.damp(zoom.value, zoom.target, 6, dt);
    // portrait screens have a narrow horizontal field of view: pull back so the object still fits
    const aspect = size.width / Math.max(size.height, 1);
    const fit = driver || aspect >= 0.95 ? 1 : Math.min(2.1, Math.pow(0.95 / aspect, 0.85));
    const z = (zoom?.value ?? 1) * fit;

    look.set(d.tx, d.ty, d.tz);
    if (d.lw) look.lerp(lookOverride.set(d.lx ?? 0, d.ly ?? 0, d.lz ?? 0), d.lw);
    pos.set(d.px, d.py, d.pz).sub(look).multiplyScalar(z).add(look);
    pos.x += sp.x * parallax;
    pos.y -= sp.y * parallax * 0.6;
    camera.position.copy(pos);
    camera.lookAt(look);

    let dirty = false;
    if (Math.abs(camera.fov - d.fov) > 1e-3) {
      camera.fov = d.fov;
      dirty = true;
    }
    const narrow = size.width < 820;
    if (applyScreenOffset(camera, narrow ? 0 : d.offsetX)) dirty = true;
    if (dirty) camera.updateProjectionMatrix();
  });

  return null;
}

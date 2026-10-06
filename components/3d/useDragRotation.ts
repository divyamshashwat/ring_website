'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import type { ZoomRef } from './CameraRig';

export interface DragState {
  yaw: number;
  pitch: number;
  vYaw: number;
  vPitch: number;
  dragging: boolean;
  lastInteraction: number;
  /** 0 = user in control, 1 = idle motion fully blended in */
  idle: number;
  enabled: boolean;
}

interface Options {
  enabled?: boolean;
  zoom?: ZoomRef;
  /** zoom with the wheel (only for dedicated viewers – never on scrolling pages without a lenis-prevent wrapper) */
  wheel?: boolean;
  pitchLimit?: number;
  sensitivity?: number;
}

/**
 * Physical drag rotation: the object follows the pointer, keeps its momentum on
 * release, and decays with exponential damping. Pinch and (optionally) wheel
 * zoom. Horizontal drags rotate; vertical touch drags remain page scroll
 * (canvas uses touch-action: pan-y).
 */
export function useDragRotation({ enabled = true, zoom, wheel = false, pitchLimit = 0.7, sensitivity = 1 }: Options = {}) {
  const gl = useThree((s) => s.gl);
  const state = useRef<DragState>({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, dragging: false, lastInteraction: -10, idle: 1, enabled });
  state.current.enabled = enabled;

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'pan-y';
    const pointers = new Map<number, { x: number; y: number }>();
    let last = { x: 0, y: 0, t: 0 };
    let pinch = 0;
    const s = state.current;

    const down = (e: PointerEvent) => {
      if (!s.enabled) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        s.dragging = true;
        s.vYaw = s.vPitch = 0;
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        el.setPointerCapture(e.pointerId);
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
      s.lastInteraction = performance.now() / 1000;
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      s.lastInteraction = performance.now() / 1000;
      if (pointers.size === 2 && zoom) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) zoom.target = MathUtils.clamp(zoom.target * (pinch / dist), zoom.min, zoom.max);
        pinch = dist;
        return;
      }
      if (!s.dragging) return;
      const now = performance.now();
      const dt = Math.max((now - last.t) / 1000, 1 / 240);
      const k = (2.8 * sensitivity) / Math.max(el.clientWidth, 1);
      const dYaw = (e.clientX - last.x) * k * Math.PI;
      const dPitch = (e.clientY - last.y) * k * Math.PI * 0.6;
      s.yaw += dYaw;
      s.pitch = MathUtils.clamp(s.pitch + dPitch, -pitchLimit, pitchLimit);
      // low-pass the velocity so a release carries believable momentum
      s.vYaw = MathUtils.lerp(s.vYaw, dYaw / dt, 0.4);
      s.vPitch = MathUtils.lerp(s.vPitch, dPitch / dt, 0.4);
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
      if (pointers.size === 0) {
        s.dragging = false;
        // a pause before release means the user stopped – no fling
        if (performance.now() - last.t > 80) s.vYaw = s.vPitch = 0;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!zoom || !s.enabled) return;
      e.preventDefault();
      zoom.target = MathUtils.clamp(zoom.target * Math.exp(e.deltaY * 0.0012), zoom.min, zoom.max);
      s.lastInteraction = performance.now() / 1000;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    if (wheel) el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, zoom, wheel, pitchLimit, sensitivity]);

  return state;
}

/**
 * Integrates momentum, then blends into a slow, breathing idle motion once the
 * user has let go for a moment. Call inside useFrame.
 */
export function stepDragRotation(s: DragState, dt: number, time: number, opts: { autoRotate: boolean; restPitch?: number; idleDelay?: number; speed?: number }) {
  const { autoRotate, restPitch = 0, idleDelay = 2.2, speed = 0.22 } = opts;
  const since = performance.now() / 1000 - s.lastInteraction;
  const wantsIdle = !s.dragging && since > idleDelay;
  s.idle = MathUtils.damp(s.idle, wantsIdle ? 1 : 0, wantsIdle ? 0.8 : 6, dt);
  if (!s.dragging) {
    s.yaw += s.vYaw * dt;
    s.pitch += s.vPitch * dt;
    const decay = Math.exp(-dt * 3.4);
    s.vYaw *= decay;
    s.vPitch *= decay;
    // pitch springs back softly toward rest
    s.pitch = MathUtils.damp(s.pitch, restPitch, 1.4 * s.idle + 0.3, dt);
  }
  if (autoRotate) {
    // never a constant robotic spin: the turn breathes
    const breathe = 0.65 + 0.35 * Math.sin(time * 0.35);
    s.yaw += speed * breathe * s.idle * dt;
  }
}

'use client';

import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import type { Group } from 'three';
import type { CameraPose } from '@/lib/3d/cameraStates';
import type { MetalId, Purity } from '@/lib/data/types';
import { prefersReducedMotion } from '@/lib/motion';
import CameraRig, { type ZoomRef } from './CameraRig';
import StudioEnvironment from './Environment';
import LightingRig from './LightingRig';
import { MaterialLibraryProvider } from './MaterialLibrary';
import SoftShadow from './SoftShadow';
import Stage from './Stage';
import { armTurn, stepDragRotation, useDragRotation } from './useDragRotation';
import styles from './Viewer.module.css';

export interface ViewerApi {
  reset: () => void;
  zoom: (factor: number) => void;
  setAutoRotate: (on: boolean) => void;
  /** one more slow revolution */
  turn: () => void;
  /** a physical nudge: the object turns by `yaw` and settles */
  nudge: (yaw: number) => void;
  /** a brief camera push toward the object */
  push: () => void;
}

interface InteractiveProps {
  children: ReactNode;
  zoom: ZoomRef;
  apiRef: MutableRefObject<ViewerApi | null>;
  autoRotate: MutableRefObject<boolean>;
  restPitch: number;
  restYaw: number;
  wheel: boolean;
}

/** Wraps any object in physical drag rotation with inertia and a single introductory turn. */
function Interactive({ children, zoom, apiRef, autoRotate, restPitch, restYaw, wheel }: InteractiveProps) {
  const group = useRef<Group>(null);
  const drag = useDragRotation({ zoom, wheel, pitchLimit: 1.1 });

  useEffect(() => {
    drag.current.yaw = restYaw;
    drag.current.pitch = restPitch;
    apiRef.current = {
      reset: () => {
        const s = drag.current;
        const turns = Math.round((s.yaw - restYaw) / (Math.PI * 2));
        s.vYaw = s.vPitch = 0;
        s.lastInteraction = performance.now() / 1000;
        gsap.to(s, { yaw: restYaw + turns * Math.PI * 2, pitch: restPitch, duration: prefersReducedMotion() ? 0 : 1.4, ease: 'expo.inOut' });
        gsap.to(zoom, { target: 1, duration: 0.01 });
      },
      zoom: (f) => {
        zoom.target = Math.min(zoom.max, Math.max(zoom.min, zoom.target * f));
        drag.current.lastInteraction = performance.now() / 1000;
      },
      setAutoRotate: (on) => {
        autoRotate.current = on;
      },
      turn: () => {
        autoRotate.current = true;
        armTurn(drag.current);
      },
      nudge: (yaw) => {
        const s = drag.current;
        s.lastInteraction = performance.now() / 1000;
        gsap.to(s, { yaw: s.yaw + yaw, duration: prefersReducedMotion() ? 0 : 1.0, ease: 'power3.inOut' });
      },
      push: () => {
        if (prefersReducedMotion()) return;
        const base = zoom.target;
        gsap.timeline().to(zoom, { target: base * 0.86, duration: 0.4, ease: 'power2.out' }).to(zoom, { target: base, duration: 0.9, ease: 'expo.out' }, '+=0.15');
      },
    };
  }, [apiRef, drag, zoom, restPitch, restYaw, autoRotate]);

  useFrame((state, dt) => {
    stepDragRotation(drag.current, dt, state.clock.elapsedTime, { autoRotate: autoRotate.current && !prefersReducedMotion(), restPitch, speed: 0.24 });
    group.current?.rotation.set(drag.current.pitch, drag.current.yaw, 0);
  });

  return <group ref={group}>{children}</group>;
}

interface ViewerProps {
  children: ReactNode;
  pose: CameraPose;
  className?: string;
  metal?: MetalId;
  purity?: Purity;
  controls?: boolean;
  shadow?: number | false;
  restPitch?: number;
  restYaw?: number;
  wheelZoom?: boolean;
  label: string;
  autoRotate?: boolean;
  /** external access to the viewer (e.g. the configurator reacting to changes) */
  apiRef?: MutableRefObject<ViewerApi | null>;
  sweepRef?: MutableRefObject<(() => void) | null>;
  /** extra scene content outside the rotating group */
  extras?: ReactNode;
  cameraDuration?: number;
  fallback?: ReactNode;
}

/**
 * Product / gemstone viewer: drag to rotate (inertial), pinch or wheel to zoom,
 * reset, and a "Turn" button. On first view the piece turns once, then rests.
 */
export default function Viewer({
  children,
  pose,
  className,
  metal = 'yellow-gold',
  purity = '22k',
  controls = true,
  shadow = -1.3,
  restPitch = 0.45,
  restYaw = -0.6,
  wheelZoom = true,
  label,
  autoRotate: autoDefault = true,
  apiRef,
  sweepRef,
  extras,
  cameraDuration = 0,
  fallback,
}: ViewerProps) {
  const zoom = useMemo<ZoomRef>(() => ({ value: 1, target: 1, min: 0.45, max: 1.6 }), []);
  const ownApi = useRef<ViewerApi | null>(null);
  const api = apiRef ?? ownApi;
  const auto = useRef(autoDefault);
  return (
    <div className={`${styles.viewer} ${className ?? ''}`} data-lenis-prevent={wheelZoom ? '' : undefined} data-cursor="rotate">
      <div className={styles.canvasArea}>
      <Stage style={{ position: 'absolute', inset: 0 }} camera={{ position: pose.position, fov: pose.fov }} ariaLabel={label} fallback={fallback}>
        <MaterialLibraryProvider metal={metal} purity={purity}>
          <StudioEnvironment />
          <LightingRig follow={0.12} sweepRef={sweepRef} />
          <CameraRig pose={pose} zoom={zoom} parallax={0.04} duration={cameraDuration} />
          <Interactive zoom={zoom} apiRef={api} autoRotate={auto} restPitch={restPitch} restYaw={restYaw} wheel={wheelZoom}>
            {children}
          </Interactive>
          {shadow !== false && <ShadowFloor y={shadow} />}
          {extras}
        </MaterialLibraryProvider>
      </Stage>
      </div>
      {controls && (
        <div className={styles.controls} data-cursor="default">
          <span className={`${styles.hint} micro`}>
            <span className={styles.hintFine}>Drag to rotate</span>
            <span className={styles.hintTouch}>Swipe sideways to turn</span>
          </span>
          <div className={styles.buttons}>
            <button type="button" data-zoom onClick={() => api.current?.zoom(0.8)} aria-label="Zoom in">
              +
            </button>
            <button type="button" data-zoom onClick={() => api.current?.zoom(1.25)} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={() => api.current?.reset()} className="micro">
              Reset
            </button>
            <button type="button" className="micro" onClick={() => api.current?.turn()} aria-label="Turn the piece once">
              Turn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShadowFloor({ y }: { y: number }) {
  return <SoftShadow y={y} width={3.4} depth={1.7} opacity={0.3} />;
}

'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, Vector3, type Group } from 'three';
import gsap from 'gsap';
import type { Gemstone } from '@/lib/data/types';
import CameraRig, { type CameraDriver } from './CameraRig';
import StudioEnvironment from './Environment';
import LightingRig from './LightingRig';
import LooseStone from './LooseStone';
import { MaterialLibraryProvider } from './MaterialLibrary';
import Stage from './Stage';

export interface ConstellationState {
  hovered: string | null;
  /** set when a stone is chosen: the camera travels into it */
  entering: string | null;
}

interface Props {
  stones: Gemstone[];
  state: ConstellationState;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string) => void;
}

interface Slot {
  slug: string;
  home: Vector3;
  size: number;
  phase: number;
}

function layout(stones: Gemstone[], aspect: number): Slot[] {
  const nav = stones.filter((s) => s.group === 'navratna');
  const upa = stones.filter((s) => s.group === 'uparatna');
  const slots: Slot[] = [];
  if (aspect >= 1) {
    // a shallow arc for the nine, a quieter line behind for the uparatna
    const w = Math.min(10.4, 6.4 * aspect);
    nav.forEach((g, i) => {
      const t = i / (nav.length - 1) - 0.5;
      slots.push({ slug: g.slug, home: new Vector3(t * w, 0.35 - Math.pow(t * 2, 2) * 0.35, -Math.abs(t) * 1.2), size: 0.78, phase: i * 0.7 });
    });
    upa.forEach((g, i) => {
      const t = i / (upa.length - 1) - 0.5;
      slots.push({ slug: g.slug, home: new Vector3(t * w * 0.42, -1.55, -1.6), size: 0.5, phase: i * 1.3 + 0.4 });
    });
  } else {
    // portrait: a 3 × 3 grid of the nine, uparatna in a row beneath
    nav.forEach((g, i) => {
      const c = (i % 3) - 1;
      const r = Math.floor(i / 3) - 1;
      slots.push({ slug: g.slug, home: new Vector3(c * 1.55, -r * 1.6 + 0.9, 0), size: 0.9, phase: i * 0.7 });
    });
    upa.forEach((g, i) => {
      const t = i / (upa.length - 1) - 0.5;
      slots.push({ slug: g.slug, home: new Vector3(t * 3.9, -2.45, 0), size: 0.6, phase: i * 1.3 });
    });
  }
  return slots;
}

function Constellation({ stones, state, onHover, onSelect, driver }: Props & { driver: CameraDriver }) {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const slots = useMemo(() => layout(stones, aspect), [stones, aspect]);
  const groups = useRef<(Group | null)[]>([]);
  const live = useRef(slots.map(() => ({ x: 0, y: 0, z: 0, s: 1, spin: Math.random() * 6 })));

  useEffect(() => {
    live.current = slots.map((s) => ({ x: s.home.x, y: s.home.y, z: s.home.z, s: 1, spin: Math.random() * 6 }));
  }, [slots]);

  // entering a stone: the camera travels into it
  useEffect(() => {
    if (!state.entering) return;
    const i = slots.findIndex((s) => s.slug === state.entering);
    if (i < 0) return;
    const p = slots[i].home;
    gsap.to(driver, { px: p.x, py: p.y + 0.15, pz: p.z + 1.1, tx: p.x, ty: p.y, tz: p.z, fov: 30, duration: 1.1, ease: 'expo.inOut' });
  }, [state.entering, slots, driver]);

  useFrame((clock, dt) => {
    const t = clock.clock.elapsedTime;
    const hoveredIndex = slots.findIndex((s) => s.slug === state.hovered);
    const focus = hoveredIndex >= 0 ? slots[hoveredIndex].home : null;
    slots.forEach((slot, i) => {
      const g = groups.current[i];
      const l = live.current[i];
      if (!g || !l) return;
      const isFocus = i === hoveredIndex;
      // neighbours drift away from the focused stone, falling off with distance
      let push = 0;
      if (focus && !isFocus && Math.abs(slot.home.y - focus.y) < 1) {
        const dx = slot.home.x - focus.x;
        push = Math.sign(dx) * 0.42 * Math.exp(-Math.abs(dx) / 1.6);
      }
      const float = Math.sin(t * 0.6 + slot.phase) * 0.06;
      l.x = MathUtils.damp(l.x, slot.home.x + push, 4, dt);
      l.y = MathUtils.damp(l.y, slot.home.y + float + (isFocus ? 0.08 : 0), 4, dt);
      l.z = MathUtils.damp(l.z, slot.home.z + (isFocus ? 0.7 : focus ? -0.15 : 0), 4, dt);
      l.s = MathUtils.damp(l.s, isFocus ? 1.38 : focus ? 0.92 : 1, 5, dt);
      l.spin += dt * (isFocus ? 0.9 : 0.18);
      g.position.set(l.x, l.y, l.z);
      g.scale.setScalar(l.s * slot.size);
      g.rotation.set(0.55 + Math.sin(t * 0.4 + slot.phase) * 0.12, l.spin, Math.sin(t * 0.3 + slot.phase) * 0.08);
    });
  });

  return (
    <>
      {slots.map((slot, i) => (
        <group
          key={slot.slug}
          ref={(g) => {
            groups.current[i] = g;
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(slot.slug);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(slot.slug);
          }}
        >
          <LooseStone slug={slot.slug} displaySize={1} />
        </group>
      ))}
    </>
  );
}

export default function ConstellationScene(props: Props) {
  const driver = useMemo<CameraDriver>(() => ({ px: 0, py: 0.4, pz: 11, tx: 0, ty: -0.2, tz: 0, fov: 30, offsetX: 0, offsetY: 0 }), []);
  const narrow = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;
  useEffect(() => {
    if (narrow) Object.assign(driver, { px: 0, py: 0.2, pz: 15, ty: -0.3 });
  }, [narrow, driver]);
  return (
    <Stage style={{ width: '100%', height: '100%' }} maxDpr={1.5} camera={{ position: [0, 0.4, 11], fov: 30 }} ariaLabel="The nine Navratna stones and four uparatna, floating in space">
      <MaterialLibraryProvider>
        <StudioEnvironment />
        <LightingRig follow={0.3} drift={0.08} />
        <CameraRig driver={driver} parallax={0.25} />
        <Constellation {...props} driver={driver} />
      </MaterialLibraryProvider>
    </Stage>
  );
}

'use client';

import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Euler, MathUtils, Quaternion, Vector3, type BufferGeometry, type Group, type Mesh } from 'three';
import { products } from '@/lib/data/products';
import { pointer } from '@/lib/pointer';
import { useUI } from '@/lib/store/ui';
import CameraRig, { type CameraDriver } from './CameraRig';
import StudioEnvironment from './Environment';
import Gem from './GemstoneMaterial';
import LightingRig from './LightingRig';
import { MaterialLibraryProvider } from './MaterialLibrary';
import ProductModel, { type ProductModelHandle } from './ProductModel';
import ProgressReporter from './ProgressReporter';
import { useQuality } from './QualityContext';
import Stage from './Stage';
import { stepDragRotation, useDragRotation } from './useDragRotation';

/** Values written by the hero's scroll timeline and read every frame. */
export interface HeroDriver {
  camera: CameraDriver;
  pitch: number;
  yaw: number;
  /** 0 = idle float, 1 = settled */
  settle: number;
  ringY: number;
  /** 0 = stone set in ring, 1 = stone lifted free and centred */
  lift: number;
  stoneScale: number;
  /** enables dragging the loose stone */
  interactive: number;
}

const HERO_PRODUCT = products.find((p) => p.slug === 'moonga-ring')!;

const p0 = new Vector3();
const q0 = new Quaternion();
const s0 = new Vector3();
const p1 = new Vector3();
const q1 = new Quaternion();
const qSpin = new Quaternion();
const e1 = new Euler();
const Y = new Vector3(0, 1, 0);

function HeroRing({ driver }: { driver: HeroDriver }) {
  const quality = useQuality();
  const ring = useRef<Group>(null);
  const model = useRef<ProductModelHandle>(null);
  const loose = useRef<Group>(null);
  const shadow = useRef<Group>(null);
  const [stoneGeometry, setStoneGeometry] = useState<BufferGeometry | null>(null);
  const smooth = useRef({ x: 0, y: 0 });
  const drag = useDragRotation({ enabled: false, pitchLimit: 0.9 });
  const setCursor = useUI((s) => s.setCursor);
  useEffect(() => () => setCursor('default'), [setCursor]);

  useEffect(() => {
    const mesh = model.current?.stone?.getObjectByName('stone') as Mesh | undefined;
    if (mesh) setStoneGeometry(mesh.geometry);
  }, []);

  useFrame((state, dt) => {
    const g = ring.current;
    const m = model.current;
    if (!g || !m) return;
    const t = state.clock.elapsedTime;
    const d = driver;
    const sp = smooth.current;
    sp.x = MathUtils.damp(sp.x, pointer.nx, 2.2, dt);
    sp.y = MathUtils.damp(sp.y, pointer.ny, 2.2, dt);
    const free = 1 - d.settle;
    // a slow, weighted float — never a constant spin
    const sway = Math.sin(t * 0.21) * 0.32 * free + Math.sin(t * 0.13) * 0.08;
    const bob = Math.sin(t * 0.55) * 0.035;
    g.rotation.set(d.pitch + sp.y * 0.12, d.yaw + sway + sp.x * 0.32, Math.sin(t * 0.17) * 0.03 * free);
    g.position.set(0, d.ringY + bob, 0);
    if (shadow.current) shadow.current.position.y = d.ringY - 1.42;

    // the lifted stone: interpolate from its seat in the ring to its own pedestal in space
    const ringStone = m.stone;
    const l = loose.current;
    const lifted = d.lift > 0.001 && !!l && !!stoneGeometry;
    ringStone.visible = !lifted;
    if (l) l.visible = lifted;
    drag.current.enabled = d.interactive > 0.5;
    if (lifted && l) {
      stepDragRotation(drag.current, dt, t, { autoRotate: true, speed: 0.25, restPitch: 0 });
      ringStone.updateWorldMatrix(true, false);
      ringStone.matrixWorld.decompose(p0, q0, s0);
      p1.set(0, 0, 0);
      e1.set(0.82 + drag.current.pitch, 0, 0.12);
      q1.setFromEuler(e1);
      qSpin.setFromAxisAngle(Y, drag.current.yaw);
      q1.multiply(qSpin);
      const e = d.lift;
      l.position.lerpVectors(p0, p1, e);
      l.quaternion.slerpQuaternions(q0, q1, e);
      l.scale.setScalar(MathUtils.lerp(s0.x, d.stoneScale, e));
    }
  });

  return (
    <>
      <group ref={ring} onPointerOver={() => setCursor('view')} onPointerOut={() => setCursor('default')}>
        <ProductModel ref={model} config={HERO_PRODUCT.configuration} modelPath={HERO_PRODUCT.modelPath} animateChanges={false} />
      </group>
      <group ref={loose} visible={false} onPointerOver={() => setCursor(driver.interactive > 0.5 ? 'rotate' : 'default')} onPointerOut={() => setCursor('default')}>
        {stoneGeometry && <Gem slug="moonga" geometry={stoneGeometry} />}
      </group>
      {quality !== 'low' && (
        <group ref={shadow}>
          <ContactShadows opacity={0.3} scale={7} blur={2.8} far={2.4} resolution={quality === 'high' ? 512 : 256} color="#4b3b2b" frames={Infinity} />
        </group>
      )}
    </>
  );
}

export default function HeroScene({ driver, className }: { driver: HeroDriver; className?: string }) {
  const setSceneReady = useUI((s) => s.setSceneReady);
  return (
    <Stage className={className} style={{ width: '100%', height: '100%' }} persistent camera={{ position: [0, 0.55, 7.6], fov: 26 }} onReady={setSceneReady} ariaLabel="The Moonga Ring in 22K yellow gold, an interactive 3D model">
      <MaterialLibraryProvider metal="yellow-gold" purity="22k">
        <StudioEnvironment />
        <LightingRig follow={0.22} drift={0.05} />
        <CameraRig driver={driver.camera} parallax={0.08} />
        <HeroRing driver={driver} />
        <ProgressReporter />
      </MaterialLibraryProvider>
    </Stage>
  );
}

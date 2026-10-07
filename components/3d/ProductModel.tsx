'use client';

import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Component, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Box3, BufferGeometry, Group, Mesh, Vector3 } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { buildJewellery, type JewelleryParts } from '@/lib/3d/geometry/jewellery';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { stoneShapeFor } from '@/lib/data/pricing';
import type { Configuration } from '@/lib/data/types';
import { prefersReducedMotion } from '@/lib/motion';
import { useMaterials } from './MaterialLibrary';
import Gem from './GemstoneMaterial';
import { report } from '@/lib/diag';

export interface ProductLayout {
  /** world-space centre offset applied to the model */
  center: Vector3;
  /** stone girdle position after centring */
  stone: Vector3;
  radius: number;
  innerRadius: number;
}

export interface ProductModelHandle {
  root: Group;
  body: Group;
  stone: Group;
  layout: ProductLayout | null;
}

export type SwapKind = 'stone' | 'geometry' | 'metal';

interface ProductModelProps {
  config: Configuration;
  /** authored GLB with meshes named shank / metal / stone. Falls back to procedural geometry. */
  modelPath?: string;
  animateChanges?: boolean;
  onSwap?: (kind: SwapKind) => void;
  onLayout?: (layout: ProductLayout) => void;
}

const DRACO_PATH = '/decoders/draco/';
let ktx2: KTX2Loader | null = null;

function geometryKey(c: Configuration) {
  return [c.type, c.style, c.stone, c.stoneSize, c.customCarats ?? '', c.type === 'ring' ? c.size : ''].join('|');
}

function useProceduralParts(config: Configuration): JewelleryParts {
  // full density on every device: smooth silhouettes cost almost nothing to draw
  const quality = 'high';
  const key = geometryKey(config);
  const parts = useMemo(() => {
    const gem = gemstoneBySlug(config.stone) ?? gemstoneBySlug('moonga')!;
    return buildJewellery({
      type: config.type,
      style: config.style,
      stone: stoneShapeFor(gem, config.stoneSize, config.customCarats),
      size: config.size,
      quality,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, quality]);
  useEffect(
    () => () => {
      parts.shank.dispose();
      parts.metal.dispose();
      parts.stone.dispose();
    },
    [parts],
  );
  return parts;
}

function useGlbParts(path: string): JewelleryParts {
  const gl = useThree((s) => s.gl);
  const gltf = useGLTF(path, DRACO_PATH, false, (loader) => {
    if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(gl);
    (loader as unknown as GLTFLoader).setKTX2Loader(ktx2);
  });
  return useMemo(() => {
    const found: Partial<Record<'shank' | 'metal' | 'stone', BufferGeometry>> = {};
    const extra: BufferGeometry[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!(o as Mesh).isMesh) return;
      const mesh = o as Mesh;
      const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      const name = mesh.name.toLowerCase();
      if (name.startsWith('stone')) found.stone = g;
      else if (name.startsWith('shank')) found.shank = g;
      else if (name.startsWith('metal') && !found.metal) found.metal = g;
      else extra.push(g);
    });
    if (!found.stone || !found.shank) throw new Error(`${path}: expected meshes named "shank" and "stone"`);
    // stones animate around their own centre
    const box = new Box3().setFromBufferAttribute(found.stone.getAttribute('position') as never);
    const c = box.getCenter(new Vector3());
    const girdle = new Vector3(c.x, box.min.y + (box.max.y - box.min.y) * 0.25, c.z);
    found.stone.translate(-girdle.x, -girdle.y, -girdle.z);
    const metal = found.metal ?? new BufferGeometry();
    return { shank: found.shank, metal, stone: found.stone, stoneOffset: girdle, stoneRotation: [0, 0, 0, 'XYZ'], radius: box.max.y + 0.1 };
  }, [gltf, path]);
}

function computeLayout(parts: JewelleryParts, config: Configuration): ProductLayout {
  const box = new Box3();
  for (const g of [parts.shank, parts.metal]) {
    if (!g.getAttribute('position')) continue;
    g.computeBoundingBox();
    box.union(g.boundingBox!);
  }
  parts.stone.computeBoundingBox();
  const sb = parts.stone.boundingBox!.clone().translate(parts.stoneOffset);
  box.union(sb);
  const center = box.getCenter(new Vector3());
  if (config.type === 'pendant') center.set(center.x, center.y, 0);
  const size = box.getSize(new Vector3());
  return {
    center,
    stone: parts.stoneOffset.clone().sub(center),
    radius: Math.max(size.x, size.y, size.z) / 2,
    innerRadius: config.type === 'ring' ? (11.63 + 0.8128 * config.size) / 20 : 0,
  };
}

const Assembly = forwardRef<ProductModelHandle, ProductModelProps & { parts: JewelleryParts; shown: Configuration; stoneSlug: string }>(function Assembly(
  { parts, shown, stoneSlug, onLayout },
  ref,
) {
  const lib = useMaterials();
  const root = useRef<Group>(null!);
  const body = useRef<Group>(null!);
  const stone = useRef<Group>(null!);
  const stoneMesh = useRef<Mesh>(null!);
  const layout = useMemo(() => computeLayout(parts, shown), [parts, shown]);
  const handle = useRef<ProductModelHandle>({ root: null!, body: null!, stone: null!, layout: null });

  useImperativeHandle(ref, () => {
    handle.current.root = root.current;
    handle.current.body = body.current;
    handle.current.stone = stone.current;
    handle.current.layout = layout;
    return handle.current;
  }, [layout]);

  useLayoutEffect(() => {
    onLayout?.(layout);
  }, [layout, onLayout]);

  return (
    <group ref={root}>
      <group ref={body} position={[-layout.center.x, -layout.center.y, -layout.center.z]}>
        <mesh geometry={parts.shank} material={shown.type === 'ring' ? lib.shank : lib.metal} name="shank" />
        <mesh geometry={parts.metal} material={lib.metal} name="metal" />
        <group ref={stone} position={parts.stoneOffset} rotation={parts.stoneRotation}>
          <Gem ref={stoneMesh} slug={stoneSlug} geometry={parts.stone} />
        </group>
      </group>
    </group>
  );
});

/**
 * Handles configuration changes as physical transitions rather than swaps:
 *  - metal / purity: the material's PBR values are tweened in place
 *  - stone: the current stone dims and settles back, the new one is revealed
 *  - style / size: a brief settle while the geometry is rebuilt
 */
function useTransitions(config: Configuration, animate: boolean, onSwap?: (kind: SwapKind) => void) {
  const lib = useMaterials();
  const [shown, setShown] = useState(config);
  const pending = useRef<gsap.core.Timeline | null>(null);
  const handleRef = useRef<ProductModelHandle | null>(null);
  const first = useRef(true);

  useEffect(() => {
    lib.setMetal(config.metal, config.purity, !first.current && animate && !prefersReducedMotion());
    first.current = false;
    // metal changes never rebuild anything
    setShown((s) => (s.metal === config.metal && s.purity === config.purity ? s : { ...s, metal: config.metal, purity: config.purity }));
  }, [config.metal, config.purity, lib, animate]);

  useEffect(() => {
    const stoneChanged = config.stone !== shown.stone;
    const geometryChanged = geometryKey(config) !== geometryKey(shown);
    if (!stoneChanged && !geometryChanged) return;
    const h = handleRef.current;
    if (!animate || !h?.stone || prefersReducedMotion()) {
      setShown(config);
      return;
    }
    pending.current?.kill();
    const oldSlug = shown.stone;
    const newSlug = config.stone;
    const dim = { v: 1 };
    const tl = gsap.timeline();
    onSwap?.(stoneChanged ? 'stone' : 'geometry');
    if (stoneChanged) {
      tl.to(dim, { v: 0.12, duration: 0.38, ease: 'power2.in', onUpdate: () => lib.setDim(oldSlug, dim.v) })
        .to(h.stone.scale, { x: 0.86, y: 0.86, z: 0.86, duration: 0.38, ease: 'power2.in' }, 0)
        .add(() => {
          lib.setDim(oldSlug, 1);
          lib.setDim(newSlug, 0.12);
          setShown(config);
        })
        .set({}, {}, '+=0.04')
        .add(() => {
          const s = handleRef.current?.stone;
          if (!s) return;
          s.scale.setScalar(0.86);
          gsap.to(s.scale, { x: 1, y: 1, z: 1, duration: 0.62, ease: 'expo.out' });
          const reveal = { v: 0.12 };
          gsap.to(reveal, { v: 1, duration: 0.6, ease: 'power2.out', onUpdate: () => lib.setDim(newSlug, reveal.v) });
        });
    } else {
      tl.to(h.root.scale, { x: 0.965, y: 0.965, z: 0.965, duration: 0.22, ease: 'power2.in' })
        .add(() => setShown(config))
        .to(h.root.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'expo.out' }, '+=0.04');
    }
    pending.current = tl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stone, geometryKey(config)]);

  useEffect(() => () => void pending.current?.kill(), []);

  return { shown, handleRef };
}

function ProceduralProduct(props: ProductModelProps & { forwarded: React.Ref<ProductModelHandle> }) {
  const { shown, handleRef } = useTransitions(props.config, props.animateChanges ?? true, props.onSwap);
  const parts = useProceduralParts(shown);
  return (
    <Assembly
      {...props}
      ref={(h) => {
        handleRef.current = h;
        assignRef(props.forwarded, h);
      }}
      parts={parts}
      shown={shown}
      stoneSlug={shown.stone}
    />
  );
}

function GlbProduct(props: ProductModelProps & { modelPath: string; forwarded: React.Ref<ProductModelHandle> }) {
  const { shown, handleRef } = useTransitions(props.config, props.animateChanges ?? true, props.onSwap);
  const parts = useGlbParts(props.modelPath);
  return (
    <Assembly
      {...props}
      ref={(h) => {
        handleRef.current = h;
        assignRef(props.forwarded, h);
      }}
      parts={parts}
      shown={shown}
      stoneSlug={shown.stone}
    />
  );
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as React.MutableRefObject<T | null>).current = value;
}

/** If the authored model cannot be downloaded or decoded, the same piece is built procedurally. */
class GlbBoundary extends Component<{ path: string; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    report('model', `${this.props.path}: ${error.message} — building it procedurally instead`);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Renders any jewellery configuration, from an authored GLB or procedurally. */
const ProductModel = forwardRef<ProductModelHandle, ProductModelProps>(function ProductModel(props, ref) {
  const procedural = <ProceduralProduct {...props} forwarded={ref} />;
  if (!props.modelPath) return procedural;
  return (
    <GlbBoundary path={props.modelPath} fallback={procedural}>
      <GlbProduct {...props} modelPath={props.modelPath} forwarded={ref} />
    </GlbBoundary>
  );
});

export default ProductModel;

export const preloadModel = (path: string) => useGLTF.preload(path, DRACO_PATH);

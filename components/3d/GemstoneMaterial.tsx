'use client';

import { MeshRefractionMaterial } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { AdditiveBlending, Color, MeshPhysicalMaterial, type BufferGeometry, type Mesh, type ShaderMaterial, type Texture } from 'three';
import { bindGemMesh, GEM_SPECS } from '@/lib/3d/materials/gemstone';
import { useMaterials } from './MaterialLibrary';
import { useGemEnvScene } from './Environment';
import { useQuality } from './QualityContext';

/** Waits for the gem light-tent environment to exist (created by <StudioEnvironment> on mount). */
function useSceneEnvironment() {
  const scene = useThree((s) => s.scene);
  const gemScene = useGemEnvScene();
  const source = gemScene ?? scene;
  const [env, setEnv] = useState<Texture | null>(source.environment);
  useFrame(() => {
    if (!env && source.environment) setEnv(source.environment);
  });
  return env;
}

interface GemProps {
  slug: string;
  geometry: BufferGeometry;
  /** force the rasterised physical material (e.g. on very weak devices) */
  simple?: boolean;
}

/**
 * A gemstone mesh. Cabochons, pearls and opaque stones use the physical gem
 * material system; faceted stones are ray traced through their own facets
 * with a specular surface layer on top for crisp reflections.
 */
const Gem = forwardRef<Mesh, GemProps>(function Gem({ slug, geometry, simple }, ref) {
  const lib = useMaterials();
  const spec = GEM_SPECS[slug];
  const env = useSceneEnvironment();
  const refraction = spec?.refraction && !simple && env ? spec.refraction : null;
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    if (!refraction && meshRef.current) bindGemMesh(meshRef.current);
  }, [refraction, geometry]);

  useEffect(() => {
    if (!spec?.tentLit || !env) return;
    const m = lib.gem(slug);
    m.envMap = env;
    m.needsUpdate = true;
  }, [spec, env, lib, slug]);

  const setRefs = (m: Mesh | null) => {
    meshRef.current = m;
    if (typeof ref === 'function') ref(m);
    else if (ref) ref.current = m;
  };

  if (refraction && env) {
    return <RefractedGem key={geometry.uuid} slug={slug} geometry={geometry} env={env} spec={refraction} ref={setRefs} />;
  }
  return <mesh ref={setRefs} geometry={geometry} material={lib.gem(slug)} name="stone" />;
});

export default Gem;

const RefractedGem = forwardRef<Mesh, { slug: string; geometry: BufferGeometry; env: Texture; spec: NonNullable<(typeof GEM_SPECS)[string]['refraction']> }>(
  function RefractedGem({ slug, geometry, env, spec }, ref) {
    const lib = useMaterials();
    // phones trace fewer internal bounces: most of the look, a fraction of the GPU time
    const bounces = useQuality() === 'low' ? Math.min(2, spec.bounces) : spec.bounces;
    const mesh = useRef<Mesh>(null);
    const base = useMemo(() => new Color(spec.color).multiplyScalar(spec.gain ?? 1.15), [spec.color, spec.gain]);
    // the surface layer: diffuse black, so only true specular reflection is added on top
    const surface = useMemo(
      () =>
        new MeshPhysicalMaterial({
          color: '#000000',
          roughness: 0.02,
          metalness: 0,
          ior: spec.ior,
          envMapIntensity: 1.3,
          transparent: true,
          blending: AdditiveBlending,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      [spec.ior],
    );
    useEffect(() => () => surface.dispose(), [surface]);

    useFrame(() => {
      const dim = lib.getDim(slug);
      const u = (mesh.current?.material as ShaderMaterial | undefined)?.uniforms?.color;
      if (u) (u.value as Color).copy(base).multiplyScalar(dim);
      surface.envMapIntensity = 1.3 * dim;
    });

    return (
      <group>
        <mesh
          ref={(m) => {
            mesh.current = m;
            if (typeof ref === 'function') ref(m);
            else if (ref) ref.current = m;
          }}
          geometry={geometry}
          name="stone"
        >
          {/* note: no ref here – drei keeps its own internal material ref */}
          <MeshRefractionMaterial
            envMap={env}
            bounces={bounces}
            ior={spec.ior}
            fresnel={spec.fresnel ?? 0.6}
            aberrationStrength={spec.aberration}
            fastChroma
            color={base}
            toneMapped
          />
        </mesh>
        <mesh geometry={geometry} material={surface} renderOrder={2} />
      </group>
    );
  },
);

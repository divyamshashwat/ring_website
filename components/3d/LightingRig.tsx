'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type MutableRefObject } from 'react';
import { MathUtils, Vector3, type DirectionalLight, type PointLight } from 'three';
import gsap from 'gsap';
import { sharedGemUniforms } from '@/lib/3d/materials/gemstone';
import { pointer } from '@/lib/pointer';

interface LightingRigProps {
  /** how much the environment turns with the cursor (radians) */
  follow?: number;
  /** slow ambient drift of the reflections */
  drift?: number;
  baseRotation?: number;
  /** imperative light sweep, used when a stone is changed */
  sweepRef?: MutableRefObject<(() => void) | null>;
}

const KEY = new Vector3(2.2, 5, 3.2);

export default function LightingRig({ follow = 0.18, drift = 0.06, baseRotation = 0, sweepRef }: LightingRigProps) {
  const scene = useThree((s) => s.scene);
  const key = useRef<DirectionalLight>(null);
  const sweep = useRef<PointLight>(null);
  const rot = useRef(baseRotation);
  const tmp = useRef(new Vector3());

  useEffect(() => {
    if (!sweepRef) return;
    sweepRef.current = () => {
      const light = sweep.current;
      if (!light) return;
      gsap.killTweensOf([light, light.position]);
      light.position.set(-3, 2.4, 2.5);
      gsap.fromTo(light, { intensity: 0 }, { intensity: 22, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1, repeatDelay: 0.25 });
      gsap.to(light.position, { x: 3, duration: 1.1, ease: 'power2.inOut' });
    };
    return () => {
      sweepRef.current = null;
    };
  }, [sweepRef]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target = baseRotation + pointer.nx * follow + Math.sin(t * 0.12) * drift;
    rot.current = MathUtils.damp(rot.current, target, 2.2, dt);
    scene.environmentRotation.set(0, rot.current, 0);
    // keep the gem shaders' key-light direction aligned with the rotated environment
    const k = tmp.current.copy(KEY).applyAxisAngle(new Vector3(0, 1, 0), -rot.current).normalize();
    sharedGemUniforms.uKeyDir.value.copy(k);
    if (key.current) key.current.position.copy(k).multiplyScalar(8);
  });

  return (
    <>
      {/* the light box does most of the work; these only add a sparkle and shape the stones */}
      <ambientLight intensity={0.04} color="#fff7ee" />
      <directionalLight ref={key} intensity={0.7} color="#fff5e8" position={[2.2, 5, 3.2]} />
      <directionalLight intensity={0.25} color="#ffffff" position={[-4, 1.5, -3]} />
      <pointLight ref={sweep} intensity={0} distance={10} decay={1.4} color="#fffaf0" position={[-3, 2.4, 2.5]} />
    </>
  );
}

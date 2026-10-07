'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { products } from '@/lib/data/products';
import { configFromSearch } from '@/lib/store/configurator';
import type { CameraStateName } from '@/lib/3d/cameraStates';

const StudioScene = dynamic(() => import('@/components/3d/StudioScene'), { ssr: false });

export default function StudioClient() {
  const [ready, setReady] = useState(false);
  const [params] = useState<Record<string, string | undefined>>(() => (typeof window === 'undefined' ? {} : Object.fromEntries(new URLSearchParams(window.location.search))));
  const product = products.find((p) => p.slug === params.product);
  const config = product?.configuration ?? configFromSearch(params as Record<string, string>);
  return (
    <main style={{ position: 'fixed', inset: 0, zIndex: 1100, background: params.transparent ? 'transparent' : 'var(--ivory)' }} data-ready={ready ? 'true' : 'false'}>
      <StudioScene
        config={config}
        modelPath={params.glb ? product?.modelPath : undefined}
        yaw={params.yaw ? Number(params.yaw) : undefined}
        pitch={params.pitch ? Number(params.pitch) : undefined}
        camera={(params.camera as CameraStateName) ?? 'PRODUCT'}
        onReady={() => setReady(true)}
      />
    </main>
  );
}

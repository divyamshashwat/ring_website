'use client';

import type { StoneSize } from '@/lib/data/types';
import LooseStone from './LooseStone';
import Viewer from './Viewer';

export default function GemstoneViewer({ slug, size = 'medium', className, controls = true, label }: { slug: string; size?: StoneSize; className?: string; controls?: boolean; label?: string }) {
  return (
    <Viewer
      className={className}
      pose={{ position: [0, 0.4, 4.2], target: [0, 0, 0], fov: 24 }}
      restPitch={0.7}
      restYaw={0}
      shadow={-0.95}
      controls={controls}
      label={label ?? 'Interactive 3D gemstone'}
    >
      <LooseStone slug={slug} size={size} displaySize={1.25} />
    </Viewer>
  );
}

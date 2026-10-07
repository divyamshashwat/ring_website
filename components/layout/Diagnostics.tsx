'use client';

import { useEffect, useState } from 'react';
import { getDiag, subscribeDiag } from '@/lib/diag';
import { detectQuality } from '@/lib/3d/quality';

/** On-screen 3D diagnostics, only when the URL contains ?debug. */
export default function Diagnostics() {
  const [on, setOn] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    setOn(new URLSearchParams(window.location.search).has('debug'));
    return subscribeDiag(() => force((n) => n + 1));
  }, []);
  if (!on) return null;
  const d = getDiag();
  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 2000,
        maxHeight: '45vh',
        overflow: 'auto',
        background: '#1a1815',
        color: '#f8f7f3',
        font: '11px/1.45 ui-monospace, Menlo, monospace',
        padding: 12,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {`VYOMA 3D diagnostics
ua: ${navigator.userAgent}
screen: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}  tier: ${detectQuality()}
webgl2: ${d.webgl2}  gpu: ${d.renderer || '—'}
${d.events.length ? d.events.map((e) => `[${e.t}ms] ${e.kind}: ${e.detail}`).join('\n') : 'no 3D errors recorded'}`}
    </div>
  );
}

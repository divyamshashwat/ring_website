'use client';

import { useEffect, useState } from 'react';
import { debugEnabled, getDiag, subscribeDiag } from '@/lib/diag';
import { detectQuality } from '@/lib/3d/quality';

/** On-screen 3D diagnostics, only when the URL contains ?debug. */
export default function Diagnostics() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    setOn(debugEnabled() || new URLSearchParams(window.location.search).has('debug'));
    return subscribeDiag(() => force((n) => n + 1));
  }, []);
  if (!on) return null;
  const d = getDiag();
  const line = (e: { t: number; kind: string; detail: string }) => `[${e.t}ms] ${e.kind}: ${e.detail}`;
  const text = `VYOMA 3D diagnostics
ua: ${navigator.userAgent}
screen: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}  tier: ${detectQuality()}
webgl2: ${d.webgl2 ?? 'not started yet'}  gpu: ${d.renderer || '—'}  canvases: ${document.querySelectorAll('canvas').length}
${d.events.length ? d.events.map(line).join('\n') : 'no 3D events yet'}${
    d.previous ? `\n\nprevious load of ${d.previous.path} did not finish cleanly:\n${d.previous.events.map(line).join('\n')}` : ''
  }`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const button = { background: 'transparent', color: 'inherit', border: '1px solid #f8f7f355', padding: '8px 12px', font: 'inherit', minHeight: 36 };
  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 2000,
        maxHeight: open ? '45vh' : undefined,
        overflow: 'auto',
        background: '#1a1815',
        color: '#f8f7f3',
        font: '11px/1.45 ui-monospace, Menlo, monospace',
        padding: 12,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: open ? 8 : 0 }}>
        <button type="button" style={button} onClick={copy}>
          {copied ? 'Copied' : 'Copy report'}
        </button>
        <button type="button" style={button} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide' : 'Show diagnostics'}
        </button>
      </div>
      {open && text}
    </div>
  );
}

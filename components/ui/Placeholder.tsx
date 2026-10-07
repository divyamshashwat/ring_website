import type { CSSProperties } from 'react';

/**
 * Clearly marked placeholder for commissioned photography or film.
 * We never substitute stock or generated imagery for the house's own work.
 */
export default function Placeholder({ label, ratio = '4 / 5', tone = 'pearl', style }: { label: string; ratio?: string; tone?: 'pearl' | 'sand' | 'stone'; style?: CSSProperties }) {
  const bg = tone === 'sand' ? 'var(--sand)' : tone === 'stone' ? '#cfc6b8' : 'var(--champagne)';
  return (
    <figure style={{ margin: 0, ...style }}>
      <div style={{ position: 'relative', aspectRatio: ratio, maxWidth: '100%', background: bg, overflow: 'hidden' }}>
      <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.55, mixBlendMode: 'multiply' }}>
        <filter id={`grain-${tone}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.44  0 0 0 0.35 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${tone})`} />
      </svg>
      </div>
      <figcaption
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: '0.75rem',
          color: 'var(--muted)',
        }}
      >
        <span>Photography placeholder</span>
        <span style={{ textAlign: 'right', opacity: 0.75 }}>{label}</span>
      </figcaption>
    </figure>
  );
}

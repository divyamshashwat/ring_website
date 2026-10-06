import type { CSSProperties } from 'react';

/**
 * Clearly marked placeholder for commissioned photography or film.
 * We never substitute stock or generated imagery for the house's own work.
 */
export default function Placeholder({ label, ratio = '4 / 5', tone = 'pearl', style }: { label: string; ratio?: string; tone?: 'pearl' | 'sand' | 'stone'; style?: CSSProperties }) {
  const bg = tone === 'sand' ? 'var(--sand)' : tone === 'stone' ? '#cfc6b8' : 'var(--champagne)';
  return (
    <figure
      style={{
        position: 'relative',
        aspectRatio: ratio,
        background: bg,
        overflow: 'hidden',
        ...style,
      }}
    >
      <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.55, mixBlendMode: 'multiply' }}>
        <filter id={`grain-${tone}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.44  0 0 0 0.35 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${tone})`} />
      </svg>
      <figcaption
        style={{
          position: 'absolute',
          left: 16,
          bottom: 14,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: '0.625rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft)',
        }}
      >
        <span>Photography placeholder</span>
        <span style={{ textAlign: 'right', opacity: 0.75 }}>{label}</span>
      </figcaption>
    </figure>
  );
}

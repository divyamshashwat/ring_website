/**
 * VYOMA wordmark: a spaced serif set with a small monogram — a bezel-like
 * ellipse holding a single point, the stone.
 */
export function Monogram({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <ellipse cx="12" cy="12" rx="7.2" ry="10.2" stroke="currentColor" strokeWidth="0.9" />
      <ellipse cx="12" cy="12" rx="4.4" ry="6.6" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

export default function Wordmark({ className, monogram = true }: { className?: string; monogram?: boolean }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7em' }}>
      {monogram && <Monogram />}
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 400,
          fontSize: '1.32rem',
          letterSpacing: '0.42em',
          marginRight: '-0.42em',
          lineHeight: 1,
        }}
      >
        VYOMA
      </span>
    </span>
  );
}

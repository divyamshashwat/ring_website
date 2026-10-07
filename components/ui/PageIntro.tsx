import type { ReactNode } from 'react';
import { MaskedLines } from './Reveal';

/** Editorial page opening: eyebrow, authored headline lines, and an optional lead. */
export default function PageIntro({ eyebrow, lines, lead, aside, compact }: { eyebrow: string; lines: ReactNode[]; lead?: ReactNode; aside?: ReactNode; compact?: boolean }) {
  return (
    <header
      className="container"
      style={{ paddingTop: `calc(var(--header-h) + ${compact ? 'clamp(48px, 6vw, 90px)' : 'clamp(72px, 10vw, 150px)'})`, paddingBottom: compact ? 'clamp(40px, 5vw, 72px)' : 'clamp(56px, 8vw, 110px)' }}
    >
      <div className="grid" style={{ alignItems: 'end', rowGap: 32 }}>
        <div style={{ gridColumn: '1 / span 8' }} className="intro-main">
          <p className="eyebrow" style={{ marginBottom: 28 }}>
            {eyebrow}
          </p>
          <MaskedLines as="h1" className="display balance" lines={lines} immediate delay={0.15} />
        </div>
        {(lead || aside) && (
          <div style={{ gridColumn: '9 / span 4', display: 'grid', gap: 24 }} className="intro-aside">
            {lead && <p className="body">{lead}</p>}
            {aside}
          </div>
        )}
      </div>
      <style>{`@media (max-width: 900px) { .intro-main, .intro-aside { grid-column: 1 / -1 !important; } }`}</style>
    </header>
  );
}

import { TransitionLink } from '@/components/layout/PageTransition';

export default function NotFound() {
  return (
    <section className="container" style={{ minHeight: '80vh', display: 'grid', alignContent: 'center', gap: 28, paddingTop: 'var(--header-h)' }}>
      <h1 className="display">
        This page has <em>slipped its setting.</em>
      </h1>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <TransitionLink href="/" className="btn btn--solid">
          Return home
        </TransitionLink>
        <TransitionLink href="/collections" className="link" style={{ alignSelf: 'center' }}>
          The collection
        </TransitionLink>
      </div>
    </section>
  );
}

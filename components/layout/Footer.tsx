import { TransitionLink } from './PageTransition';
import { FOOTER_NAV, WHATSAPP_URL } from './navigation';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className="grid">
          <p className={styles.statement}>
            Ancient stones.
            <br />
            <em>Exceptional</em> craft.
          </p>
          <div className={styles.aside}>
            <p className="body">Every stone is natural, independently certified and described exactly as its laboratory report describes it. Every setting is finished by hand.</p>
            <TransitionLink href="/consultation" className="link">
              Book a consultation
            </TransitionLink>
          </div>
        </div>

        <div className={`grid ${styles.cols}`}>
          {FOOTER_NAV.map((group) => (
            <nav key={group.title} className={styles.col} aria-label={group.title}>
              <h2 className="label">{group.title}</h2>
              <ul>
                {group.links.map((l) => (
                  <li key={l.href}>
                    <TransitionLink href={l.href}>{l.label}</TransitionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav className={styles.col} aria-label="Social">
            <h2 className="label">Follow</h2>
            <ul>
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.pinterest.com/" target="_blank" rel="noreferrer">
                  Pinterest
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
            </ul>
          </nav>
          <div className={styles.col}>
            <h2 className="label">The atelier</h2>
            <p className="small muted">
              Consultations by appointment,
              <br />
              in person or by video.
              <br />
              Monday – Saturday, 10:00 – 19:00 IST
            </p>
          </div>
        </div>

        <div className={styles.legal}>
          <p className="micro muted">© {new Date().getFullYear()} VYOMA. Gemstone associations reflect traditional practice and are not scientific or medical claims.</p>
          <nav aria-label="Legal" className="micro">
            <TransitionLink href="/privacy">Privacy</TransitionLink>
            <TransitionLink href="/terms">Terms</TransitionLink>
          </nav>
        </div>
      </div>
      <div className={styles.wordmarkGiant} aria-hidden="true">
        VYOMA
      </div>
    </footer>
  );
}

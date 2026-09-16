import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { NAV_ITEMS } from '../data/config';
import { useL10n } from '../i18n';

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const BRAND_LOGO: string = require('../../assets/icons/aitechbar_logo.png');

export interface INavBarProps {
  /** Kontener przewijania (landing) — root dla IntersectionObserver */
  scrollContainer: React.RefObject<HTMLDivElement>;
  onNavigate: (targetId: string) => void;
  /** Element po lewej (np. przełącznik pełnego ekranu) */
  leftSlot?: React.ReactNode;
}

const NavBar: React.FC<INavBarProps> = ({ scrollContainer, onNavigate, leftSlot }) => {
  const { t } = useL10n();
  // '' = żadna pozycja nie jest podświetlona (m.in. gdy jesteśmy na sekcji hero)
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    const root = scrollContainer.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const ids = ['sec-hero', ...NAV_ITEMS.map((i) => i.targetId)];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Na sekcji hero nie podświetlamy żadnej pozycji nawigacji.
          setActiveId(entry.target.id === 'sec-hero' ? '' : entry.target.id);
        });
      },
      { root, threshold: 0.5 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [scrollContainer]);

  return (
    <header className={styles.navBar}>
      <div className={styles.navLeft}>
        {leftSlot}
        <button
          type="button"
          className={styles.navBrand}
          onClick={() => onNavigate('sec-hero')}
          aria-label="Przejdź na górę"
        >
          <img className={styles.navBrandLogo} src={BRAND_LOGO} alt="" aria-hidden="true" />
          {t.navbar.brand}
        </button>
      </div>

      <nav className={styles.navBarLinks} aria-label="Nawigacja główna">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.targetId}
            type="button"
            className={`${styles.navBarLink} ${activeId === item.targetId ? styles.navBarLinkActive : ''}`}
            onClick={() => onNavigate(item.targetId)}
          >
            <span className={styles.navBarLinkIndex}>{item.index}</span>
            {t.hero.navLabels[item.targetId] || item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className={styles.navBarCta}
        onClick={() => onNavigate('sec-booking')}
      >
        {t.navbar.cta}
      </button>
    </header>
  );
};

export default NavBar;

import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { NAV_ITEMS } from '../data/config';
import { useL10n } from '../i18n';

export interface INavigationHeroProps {
  firstName: string;
  onNavigate: (targetId: string) => void;
}

const NavigationHero: React.FC<INavigationHeroProps> = ({ firstName, onNavigate }) => {
  const { t } = useL10n();
  return (
    <section id="sec-hero" className={`${styles.section} ${styles.heroSection}`}>
      <div className={styles.heroInner}>
        <h1 className={styles.heroTitle}>
          {t.hero.line1.replace('{name}', firstName)}<br />
          {t.hero.line2pre}<span className={styles.gradientText}>{t.hero.line2grad}</span><br />
          {t.hero.line3pre}<span className={styles.gradientText}>{t.hero.line3grad}</span>
        </h1>

        <p className={styles.heroSubtitle}>
          {t.hero.subtitle}
        </p>

        <nav className={styles.navCards} aria-label="Nawigacja po sekcjach">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.targetId}
              type="button"
              className={styles.navCard}
              onClick={() => onNavigate(item.targetId)}
            >
              <span className={styles.navCardLabel}>{t.hero.navLabels[item.targetId] || item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={styles.scrollHint}
          onClick={() => onNavigate('sec-szkolenia')}
        >
          {t.hero.scrollHint}
          <span className={styles.scrollCaret} />
        </button>
      </div>
    </section>
  );
};

export default NavigationHero;

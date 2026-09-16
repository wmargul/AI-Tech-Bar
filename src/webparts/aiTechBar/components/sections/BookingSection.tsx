import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';

export interface IBookingSectionProps {
  settings: IResolvedSettings;
}

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const BookingSection: React.FC<IBookingSectionProps> = ({ settings }) => {
  const { t } = useL10n();
  return (
    <section id="sec-booking" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionKicker}>{t.booking.kicker}</div>
          <h2 className={styles.sectionTitle}>
            {t.booking.title.pre}<span className={styles.gradientText}>{t.booking.title.grad}</span>{t.booking.title.post}
          </h2>
          <p className={styles.sectionLead}>
            {t.booking.lead}
          </p>
        </div>

        <div className={`${styles.bookingGrid} ${styles.bookingGridSolo}`}>
          <button
            type="button"
            className={styles.bookingCard}
            onClick={() => openLink(settings.links.booking)}
          >
            <span className={styles.bookingOrb} />
            <span className={styles.bookingOrb2} />
            <div className={styles.bookingContent}>
              <div className={styles.pill}>
                <span className={styles.pillDot} />
                {t.booking.bookingPill}
              </div>
              <h3 className={styles.bookingTitle}>{t.booking.bookingTitle}</h3>
              <p className={styles.bookingDesc}>
                {t.booking.bookingDesc}
              </p>
              <span className={styles.bookingGo}>
                {t.booking.bookingGo}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;

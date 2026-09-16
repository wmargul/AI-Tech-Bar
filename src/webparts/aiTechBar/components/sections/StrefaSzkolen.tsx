import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';
import VideoTrainingCarousel from './VideoTrainingCarousel';
import PromptyExperience from './PromptyExperience';
import { unlockAudio } from '../data/voicePlayer';

export interface IStrefaSzkolenProps {
  settings: IResolvedSettings;
}

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StrefaSzkolen: React.FC<IStrefaSzkolenProps> = ({ settings }) => {
  const { t } = useL10n();
  const s = t.szkolenia;
  const [carouselOpen, setCarouselOpen] = React.useState<boolean>(false);
  const [origin, setOrigin] = React.useState<{ x: number; y: number } | undefined>(undefined);
  const [promptyOpen, setPromptyOpen] = React.useState<boolean>(false);
  const [promptyOrigin, setPromptyOrigin] = React.useState<{ x: number; y: number } | undefined>(undefined);

  const openCarousel = (e: React.MouseEvent): void => {
    setOrigin({ x: e.clientX, y: e.clientY });
    setCarouselOpen(true);
  };

  const openPrompty = (e: React.MouseEvent): void => {
    // Odblokuj audio jeszcze w obrębie gestu kliknięcia — inaczej przeglądarki
    // zablokują programowe odtwarzanie lektora startowanego po animacji.
    unlockAudio();
    setPromptyOrigin({ x: e.clientX, y: e.clientY });
    setPromptyOpen(true);
  };
  return (
    <section id="sec-szkolenia" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionKicker}>{s.kicker}</div>
          <h2 className={styles.sectionTitle}>
            {s.title.pre}<span className={styles.gradientText}>{s.title.grad}</span>{s.title.post}
          </h2>
          <p className={styles.sectionLead}>
            {s.lead}
          </p>
        </div>

        <div className={styles.trainingGrid}>
          <button
            type="button"
            className={`${styles.trainingCard} ${styles.trainingCardVideo}`}
            onClick={openCarousel}
          >
            <span className={styles.trainingGlow} />
            <span className={styles.trainingTop}>
              <span className={styles.trainingIcon}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
                </svg>
              </span>
            </span>

            <span className={styles.trainingTitle}>{s.videoTitle}</span>
            <span className={styles.trainingDesc}>{s.videoDesc}</span>

            <ul className={styles.trainingBullets}>
              {s.videoBullets.map((b, i) => (
                <li key={i} className={styles.trainingBullet}>
                  <span className={styles.trainingBulletIcon}><CheckIcon /></span>
                  {b}
                </li>
              ))}
            </ul>

            <span className={styles.trainingCta}>
              {s.videoCta}
              <ArrowIcon />
            </span>
          </button>

          <button
            type="button"
            className={`${styles.trainingCard} ${styles.trainingCardPrompts}`}
            onClick={openPrompty}
          >
            <span className={styles.trainingGlow} />
            <span className={styles.trainingTop}>
              <span className={styles.trainingIcon}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7l4 5-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            </span>

            <span className={styles.trainingTitle}>{s.promptsTitle}</span>
            <span className={styles.trainingDesc}>{s.promptsDesc}</span>

            <ul className={styles.trainingBullets}>
              {s.promptsBullets.map((b, i) => (
                <li key={i} className={styles.trainingBullet}>
                  <span className={styles.trainingBulletIcon}><CheckIcon /></span>
                  {b}
                </li>
              ))}
            </ul>

            <span className={styles.trainingCta}>
              {s.promptsCta}
              <ArrowIcon />
            </span>
          </button>
        </div>
      </div>

      {carouselOpen && (
        <VideoTrainingCarousel
          open={carouselOpen}
          onClose={() => setCarouselOpen(false)}
          settings={settings}
          origin={origin}
        />
      )}

      {promptyOpen && (
        <PromptyExperience
          open={promptyOpen}
          onClose={() => setPromptyOpen(false)}
          origin={promptyOrigin}
        />
      )}
    </section>
  );
};

export default StrefaSzkolen;

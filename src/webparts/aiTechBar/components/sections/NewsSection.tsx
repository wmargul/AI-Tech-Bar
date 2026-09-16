import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { NEWS_ITEMS, IResolvedSettings } from '../data/config';
import { useL10n, Lang } from '../i18n';

export interface INewsSectionProps {
  settings: IResolvedSettings;
}

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const formatDate = (iso: string, lang: Lang): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NewsSection: React.FC<INewsSectionProps> = ({ settings }) => {
  const { t, lang } = useL10n();
  const s = t.news;

  return (
    <section id="sec-news" className={styles.section}>
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

        <div className={styles.newsGrid}>
          {NEWS_ITEMS.map((item, i) => {
            const nt = t.newsText[item.id];
            return (
              <button
                key={item.id}
                type="button"
                className={styles.newsCard}
                style={{ animationDelay: `${i * 90}ms` }}
                onClick={() => openLink(item.url)}
              >
                <span className={styles.newsGlow} style={{ background: item.accent }} aria-hidden="true" />

                <span className={styles.newsTop}>
                  <span className={styles.newsIcon} style={{ background: item.accent }} aria-hidden="true">
                    {item.icon}
                  </span>
                  <time className={styles.newsDate} dateTime={item.date}>
                    {formatDate(item.date, lang)}
                  </time>
                </span>

                <span className={styles.newsTag}>{nt ? nt.tag : item.tag}</span>
                <span className={styles.newsTitle}>{nt ? nt.title : item.title}</span>
                <span className={styles.newsExcerpt}>{nt ? nt.excerpt : item.excerpt}</span>

                <span className={styles.newsCta}>
                  {s.readCta}
                  <ArrowIcon />
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.newsFoot}>
          <button
            type="button"
            className={styles.newsAllBtn}
            onClick={() => openLink(settings.links.news)}
          >
            {s.allCta}
            <ArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;

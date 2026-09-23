import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import styles from '../AiTechBar.module.scss';
import { ITool, ITrainingVideo, IResolvedSettings, trainingVideosFor } from '../data/config';
import { useL10n } from '../i18n';
import ToolLogo from './ToolLogo';

export interface ITrainingGalleryProps {
  open: boolean;
  onClose: () => void;
  tool: ITool;
  settings: IResolvedSettings;
  /** Punkt kliknięcia — panel wyrasta stamtąd, jak pozostałe overlaye. */
  origin?: { x: number; y: number };
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const PlayIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 7.5l8 4.5-8 4.5v-9z" fill="currentColor" />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrainingGallery: React.FC<ITrainingGalleryProps> = ({
  open, onClose, tool, settings, origin
}) => {
  const { t } = useL10n();
  const s = t.gallery;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef<boolean>(false);

  const videos = trainingVideosFor(tool.id);

  /** Placeholdery nie mają własnego tytułu — bierzemy go z i18n. */
  const titleOf = (video: ITrainingVideo, index: number): string => {
    if (video.title) return video.title;
    const template = t.trainingPlaceholders[index % t.trainingPlaceholders.length];
    return template.replace('{tool}', tool.name);
  };

  const pending = videos.filter((v) => !v.url || v.url === '#').length === videos.length;

  // --- wejście ---------------------------------------------------------------
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return undefined;

    if (prefersReducedMotion()) {
      gsap.set([root, panel], { opacity: 1, scale: 1, x: 0, y: 0 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      const dx = origin ? (origin.x - window.innerWidth / 2) * 0.22 : 0;
      const dy = origin ? (origin.y - window.innerHeight / 2) * 0.22 : 0;

      gsap.set(root, { opacity: 0 });
      gsap.set(panel, { opacity: 0, scale: 0.9, x: dx, y: dy });

      const tl = gsap.timeline();
      tl.to(root, { opacity: 1, duration: 0.28, ease: 'power1.out' }, 0)
        .to(panel, {
          opacity: 1, scale: 1, x: 0, y: 0,
          duration: 0.72, ease: 'expo.out', clearProps: 'transform'
        }, 0.04);

      // Kafelki dociągają się zaraz za panelem — delikatnie, żeby nie
      // powtarzać błędu ekranu powitalnego z długą kaskadą.
      const cards = gridRef.current ? gridRef.current.children : undefined;
      if (cards && cards.length > 0) {
        tl.fromTo(
          cards,
          { opacity: 0, y: 18, filter: 'blur(6px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.55, ease: 'power2.out', stagger: 0.035,
            clearProps: 'filter'
          },
          0.2
        );
      }
    }, root);

    return () => ctx.revert();
  }, [open, origin]);

  const requestClose = React.useCallback((): void => {
    if (closingRef.current) return;
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!panel || !root || prefersReducedMotion()) { onClose(); return; }
    closingRef.current = true;
    gsap.to(panel, { opacity: 0, scale: 0.94, duration: 0.3, ease: 'power2.in' });
    gsap.to(root, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => { closingRef.current = false; onClose(); }
    });
  }, [onClose]);

  // Escape zamyka galerię i nie przechodzi niżej — pod spodem jest karuzela,
  // która też reaguje na Escape i zamknęłaby się razem z nią.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      requestClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, requestClose]);

  if (!open || typeof document === 'undefined') return null;

  const gallery = (
    <div ref={rootRef} className={styles.tgOverlay} role="dialog" aria-modal="true" aria-label={s.eyebrow}>
      <button type="button" className={styles.tgScrim} onClick={requestClose} aria-label={s.close} />

      <div ref={panelRef} className={styles.tgPanel}>
        <span className={styles.tgAccent} style={{ background: tool.accent }} aria-hidden="true" />

        <div className={styles.tgHead}>
          <div className={styles.tgHeadLogo}>
            <ToolLogo id={tool.id} badge={tool.badge} />
          </div>
          <div className={styles.tgHeadText}>
            <div className={styles.tgEyebrow}>
              <span className={styles.tgEyebrowLine} />
              {s.eyebrow} · {tool.tagline}
            </div>
            <h2 className={styles.tgTitle}>{tool.name}</h2>
            <p className={styles.tgLead}>{s.lead}</p>
          </div>
          <button type="button" className={styles.tgClose} onClick={requestClose} aria-label={s.close}>×</button>
        </div>

        {pending && <p className={styles.tgNote}>{s.note}</p>}

        <div ref={gridRef} className={styles.tgGrid}>
          {videos.map((video, i) => {
            const ready = !!video.url && video.url !== '#';
            return (
              <button
                key={video.id}
                type="button"
                className={`${styles.tgCard} ${ready ? '' : styles.tgCardPending}`}
                onClick={() => openLink(video.url)}
                disabled={!ready}
              >
                <span className={styles.tgThumb} style={{ background: tool.accent }}>
                  <span className={styles.tgThumbVeil} aria-hidden="true" />
                  <span className={styles.tgPlay}><PlayIcon /></span>
                  <span className={styles.tgDuration}>{video.durationMin} {s.minutes}</span>
                </span>

                <span className={styles.tgCardBody}>
                  <span className={styles.tgCardTitle}>{titleOf(video, i)}</span>
                  <span className={styles.tgCardMeta}>
                    <span className={styles.tgLevel}>{s.levels[video.level]}</span>
                    <span className={ready ? styles.tgWatch : styles.tgSoon}>
                      {ready ? s.watch : s.soon}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {settings.links.videoTraining && settings.links.videoTraining !== '#' && (
          <button
            type="button"
            className={styles.tgCatalog}
            onClick={() => openLink(settings.links.videoTraining)}
          >
            {s.catalogCta}
            <ArrowIcon />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(gallery, document.body);
};

export default TrainingGallery;

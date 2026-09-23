import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import styles from '../AiTechBar.module.scss';
import { IGoal, ITool, TOOLS, IResolvedSettings } from '../data/config';
import { goalToolsFor, goalGuideText, IGoalToolText } from '../data/goalGuides';
import { useL10n } from '../i18n';
import GoalGlyph from './GoalGlyph';
import ToolLogo from './ToolLogo';
import TrainingGallery from './TrainingGallery';
import ScrollBar from '../ScrollBar';

export interface IGoalGuideProps {
  open: boolean;
  onClose: () => void;
  goal: IGoal;
  settings: IResolvedSettings;
  /** Punkt kliknięcia — panel wyrasta stamtąd, jak pozostałe overlaye. */
  origin?: { x: number; y: number };
  /** Zamyka przewodnik i przewija do sekcji Narzędzia AI. */
  onAllTools: () => void;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const isReady = (url: string): boolean => !!url && url !== '#';

const PlayIcon: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 7.5l8 4.5-8 4.5v-9z" fill="currentColor" />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GoalGuide: React.FC<IGoalGuideProps> = ({ open, onClose, goal, settings, origin, onAllTools }) => {
  const { lang, t } = useL10n();
  const s = t.goalGuide;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef<boolean>(false);

  const [tab, setTab] = React.useState<number>(0);
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);
  const [galleryTool, setGalleryTool] = React.useState<ITool | undefined>(undefined);
  const [galleryOrigin, setGalleryOrigin] = React.useState<{ x: number; y: number } | undefined>(undefined);

  const guide = goalGuideText(lang, goal.id);
  const setups = goalToolsFor(goal.id);

  // Cel wskazuje narzędzia po id; pomijamy te, których nie ma w katalogu, żeby
  // literówka w danych nie wywaliła całego okna.
  const tools = React.useMemo<ITool[]>(() => {
    const out: ITool[] = [];
    setups.forEach((setup) => {
      const tool = TOOLS.filter((x) => x.id === setup.toolId)[0];
      if (tool) out.push(tool);
    });
    return out;
  }, [setups]);

  const multi = tools.length > 1;
  const index = Math.min(tab, Math.max(tools.length - 1, 0));
  const tool = tools[index];
  const setup = setups[index];
  const toolText = tool ? t.toolText[tool.id] : undefined;
  const toolName = tool ? ((toolText && toolText.name) || tool.name) : '';
  const tx: IGoalToolText | undefined = guide && tool ? guide.tools[tool.id] : undefined;

  const goalTitle = (t.goalText[goal.id] && t.goalText[goal.id].title) || goal.title;

  // Każde otwarcie zaczyna od pierwszego narzędzia i pierwszego pytania.
  React.useEffect(() => {
    if (open) { setTab(0); setOpenFaq(0); }
  }, [open, goal.id]);

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

      const steps = bodyRef.current ? bodyRef.current.children : undefined;
      if (steps && steps.length > 0) {
        tl.fromTo(
          steps,
          { opacity: 0, y: 22, filter: 'blur(6px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.6, ease: 'power2.out', stagger: 0.07,
            clearProps: 'filter'
          },
          0.22
        );
      }
    }, root);

    return () => ctx.revert();
  }, [open, origin]);

  // Zmiana zakładki: krótkie przenikanie treści, żeby przeskok narzędzia nie
  // był twardym podmienieniem całej kolumny.
  const firstRender = React.useRef<boolean>(true);
  React.useLayoutEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const body = bodyRef.current;
    if (!body || prefersReducedMotion()) return;
    gsap.fromTo(
      body,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' }
    );
  }, [index]);

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

  // Escape zamyka przewodnik, ale dopiero gdy nie ma nad nim galerii — ta ma
  // własny handler i zamyka się pierwsza.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || galleryTool) return;
      e.preventDefault();
      e.stopPropagation();
      requestClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, galleryTool, requestClose]);

  const showGallery = (e: React.MouseEvent): void => {
    setGalleryOrigin({ x: e.clientX, y: e.clientY });
    setGalleryTool(tool);
  };

  if (!open || typeof document === 'undefined' || !guide || !tool || !tx) return null;

  const links = settings.toolLinks[tool.id];
  const requestUrl = links ? links.requestUrl : tool.requestUrl;
  const videoReady = isReady(setup.videoUrl);

  const panel = (
    <div ref={rootRef} className={styles.ggOverlay} role="dialog" aria-modal="true" aria-label={goalTitle}>
      <button type="button" className={styles.ggScrim} onClick={requestClose} aria-label={s.close} />

      <div ref={panelRef} className={styles.ggPanel}>
        <div ref={scrollRef} className={styles.sbScroll}>
          <div className={styles.ggHead}>
            <span className={styles.ggHeadGlow} style={{ background: goal.accent }} aria-hidden="true" />
            <span className={styles.ggHeadIcon} aria-hidden="true">
              <GoalGlyph id={goal.id} className={styles.ggGlyph} />
            </span>
            <div className={styles.ggHeadText}>
              <div className={styles.ggEyebrow}>
                <span className={styles.ggEyebrowLine} />
                {s.eyebrow} · {guide.category}
              </div>
              <h2 className={styles.ggTitle}>{goalTitle}</h2>
              <p className={styles.ggLead}>{guide.lead}</p>
              <div className={styles.ggChips}>
                {tools.map((x) => {
                  const xt = t.toolText[x.id];
                  return (
                    <span key={x.id} className={styles.ggChip}>
                      {(xt && xt.name) || x.name}
                    </span>
                  );
                })}
                <span className={styles.ggChip}>{guide.audience}</span>
              </div>
            </div>
            <button type="button" className={styles.ggClose} onClick={requestClose} aria-label={s.close}>×</button>
          </div>

          {multi && (
            <div className={styles.ggTabs} role="tablist" aria-label={s.pickTool}>
              <span className={styles.ggTabsHint}>{s.pickTool}</span>
              <div className={styles.ggTabsRow}>
                {tools.map((x, i) => {
                  const xt = t.toolText[x.id];
                  const on = i === index;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      className={styles.ggTab}
                      data-active={on ? 'true' : 'false'}
                      onClick={() => { setTab(i); setOpenFaq(0); }}
                    >
                      <span className={styles.ggTabLogo}><ToolLogo id={x.id} badge={x.badge} /></span>
                      {(xt && xt.name) || x.name}
                      <span className={styles.ggTabInk} style={{ background: goal.accent }} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={bodyRef} className={styles.ggBody}>
            {/* --- Krok 1: szkolenie --- */}
            <section className={styles.ggStep}>
              <div className={styles.ggStepLabel}>
                <span className={styles.ggStepDot} style={{ background: goal.accent }} aria-hidden="true" />
                {s.step1}
              </div>

              <div className={styles.ggVideoCard}>
                <div className={styles.ggVideoFrame}>
                  {videoReady ? (
                    <video className={styles.ggVideo} src={setup.videoUrl} controls preload="metadata" />
                  ) : (
                    <div className={styles.ggVideoPending} style={{ background: goal.accent }}>
                      <span className={styles.ggVideoVeil} aria-hidden="true" />
                      <span className={styles.ggPlay}><PlayIcon /></span>
                      <span className={styles.ggSoon}>{s.soon}</span>
                    </div>
                  )}
                </div>

                <div className={styles.ggVideoInfo}>
                  <h3 className={styles.ggVideoTitle}>{tx.videoTitle}</h3>
                  <div className={styles.ggVideoMeta}>
                    <span>{setup.videoMin} {s.minutes}</span>
                    <span className={styles.ggMetaDot} aria-hidden="true" />
                    <span>{s.level}: {tx.videoLevel}</span>
                  </div>
                  <p className={styles.ggVideoDesc}>{tx.videoDesc}</p>
                  {!videoReady && <p className={styles.ggPendingNote}>{s.videoPending}</p>}

                  <div className={styles.ggVideoActions}>
                    <button
                      type="button"
                      className={styles.ggPrimary}
                      onClick={() => openLink(setup.videoUrl)}
                      disabled={!videoReady}
                    >
                      {s.watchCta}
                      <ArrowIcon />
                    </button>
                    <button type="button" className={styles.ggGhost} onClick={showGallery}>
                      {s.moreTraining}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* --- Krok 2: FAQ --- */}
            <section className={styles.ggStep}>
              <div className={styles.ggStepLabel}>
                <span className={styles.ggStepDot} style={{ background: goal.accent }} aria-hidden="true" />
                {s.step2}
              </div>
              <h3 className={styles.ggStepTitle}>{s.faqTitle}</h3>

              <div className={styles.ggFaq}>
                {tx.faq.map((item, i) => {
                  const on = openFaq === i;
                  return (
                    <div key={item.q} className={styles.ggFaqItem} data-open={on ? 'true' : 'false'}>
                      <button
                        type="button"
                        className={styles.ggFaqQ}
                        aria-expanded={on}
                        onClick={() => setOpenFaq(on ? null : i)}
                      >
                        <span>{item.q}</span>
                        <span className={styles.ggFaqChevron}><ChevronIcon /></span>
                      </button>
                      <div className={styles.ggFaqAWrap}>
                        <div className={styles.ggFaqAInner}>
                          <p className={styles.ggFaqA}>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* --- Krok 3: wniosek --- */}
            <section className={styles.ggStep}>
              <div className={styles.ggStepLabel}>
                <span className={styles.ggStepDot} style={{ background: goal.accent }} aria-hidden="true" />
                {s.step3}
              </div>
              <h3 className={styles.ggStepTitle}>{s.requestTitle}</h3>
              <p className={styles.ggStepLead}>{s.requestLead}</p>

              <button
                type="button"
                className={styles.ggRequest}
                onClick={() => openLink(requestUrl)}
                disabled={!isReady(requestUrl)}
              >
                <span className={styles.ggRequestGlow} style={{ background: tool.accent }} aria-hidden="true" />
                <span className={styles.ggRequestLogo}><ToolLogo id={tool.id} badge={tool.badge} /></span>
                <span className={styles.ggRequestText}>
                  <span className={styles.ggRequestTitle}>{s.requestCta.replace('{tool}', toolName)}</span>
                  <span className={styles.ggRequestSub}>{tx.surfaces.join(' · ')}</span>
                </span>
                <span className={styles.ggRequestArrow}><ArrowIcon /></span>
              </button>

              <div className={styles.ggRequestMeta}>
                <span>{s.audience}: <strong>{guide.audience}</strong></span>
                <span className={styles.ggMetaDot} aria-hidden="true" />
                <span>{s.fillTime}: <strong>{s.about} {setup.requestMin} min</strong></span>
              </div>

              <button type="button" className={styles.ggAllTools} onClick={onAllTools}>
                {s.allToolsCta}
                <ArrowIcon />
              </button>
            </section>
          </div>
        </div>

        <ScrollBar targetRef={scrollRef} />
      </div>

      {galleryTool && (
        <TrainingGallery
          open
          tool={galleryTool}
          settings={settings}
          origin={galleryOrigin}
          onClose={() => setGalleryTool(undefined)}
        />
      )}
    </div>
  );

  return createPortal(panel, document.body);
};

export default GoalGuide;

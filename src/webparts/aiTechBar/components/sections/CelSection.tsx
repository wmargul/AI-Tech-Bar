import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { GOALS, IGoal, IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';
import GoalVideo from './GoalVideo';
import GoalGlyph from './GoalGlyph';
import GoalGuide from './GoalGuide';

export interface ICelSectionProps {
  onSelectGoal: (targetId: string) => void;
  settings: IResolvedSettings;
}


const CelSection: React.FC<ICelSectionProps> = ({ onSelectGoal, settings }) => {
  const { t } = useL10n();

  // Przewodnik celu — pełnoekranowa nakładka otwierana z „Dopasuj narzędzie".
  // `onSelectGoal` zostaje: przewinięcie do sekcji Narzędzia AI jest teraz
  // linkiem wewnątrz przewodnika, a nie efektem kliknięcia kafelka.
  const [guideGoal, setGuideGoal] = React.useState<IGoal | undefined>(undefined);
  const [guideOrigin, setGuideOrigin] = React.useState<{ x: number; y: number } | undefined>(undefined);

  const openGuide = (goal: IGoal, e: React.MouseEvent): void => {
    setGuideOrigin({ x: e.clientX, y: e.clientY });
    setGuideGoal(goal);
  };

  // `active` = aktualnie powiększony kafelek (hover). `shown` = co jest zamontowane w nakładce
  // (trzymane też podczas animacji zwijania, by kafelek mógł płynnie wrócić na swoje miejsce).
  const [active, setActive] = React.useState<number | null>(null);
  const [shown, setShown] = React.useState<number | null>(null);

  const cardRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const expandRef = React.useRef<HTMLButtonElement | null>(null);
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const navLabelRef = React.useRef<HTMLDivElement | null>(null);
  const navWrapRef = React.useRef<HTMLDivElement | null>(null);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  // Czy nakładka dopiero się otwiera (vs. przełączanie) — decyduje o animacji paska.
  const freshOpen = React.useRef<boolean>(false);
  const flipAnim = React.useRef<Animation | null>(null);
  const navAnims = React.useRef<Animation[]>([]);
  // Zwłoka „hover intent" — przelot myszą nad kafelkami nie odpala serii otwarć.
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Gwarantowane odmontowanie nakładki po zakończeniu zwijania.
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Przy wejściu na sekcję blokujemy hover na 1 s, żeby ruch myszą zaraz po
  // dojechaniu scrollem nie otworzył od razu przypadkowego celu.
  const hoverLocked = React.useRef<boolean>(false);
  const hoverLockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const ENTER_MS = 1520;   // wejście / przełączenie nakładki: płynne wyłanianie z głębi (2×)
  const EXIT_MS = 520;     // zwinięcie
  const NAV_IN_MS = 620;
  const NAV_OUT_MS = 340;
  const HOVER_INTENT_MS = 150;
  const EASE_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)'; // spokojne, premium wyhamowanie

  const reducedMotion = React.useRef<boolean>(
    typeof window !== 'undefined' && !!window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const cancelNavAnims = (): void => {
    navAnims.current.forEach((a) => a.cancel());
    navAnims.current = [];
  };

  React.useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (hoverLockTimer.current) clearTimeout(hoverLockTimer.current);
  }, []);

  // Przy WEJŚCIU na sekcję uruchamiamy 1 s blokady hovera (scroll nie otwiera
  // od razu przypadkowego celu). Przy WYJŚCIU zamykamy ewentualnie rozwinięty cel.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            hoverLocked.current = true;
            if (hoverLockTimer.current) clearTimeout(hoverLockTimer.current);
            hoverLockTimer.current = setTimeout(() => { hoverLocked.current = false; }, 1000);
          } else {
            setActive(null);
            setShown(null);
            if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
            if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Natychmiastowe otwarcie / przełączenie danego celu.
  const doOpen = (index: number): void => {
    const wasClosing = closeTimer.current !== null;
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    freshOpen.current = shown === null || wasClosing;
    setShown(index);
    setActive(index);
  };

  // Otwarcie z siatki (hover) — z krótką zwłoką „intent", żeby przelot myszą nie
  // wyzwalał serii otwarć. Gdy nakładka już jest otwarta (zmiana z paska celów),
  // przełączamy natychmiast.
  const openFrom = (index: number): void => {
    if (hoverLocked.current) return; // 2 s okno „chłodzenia" tuż po odsłonięciu
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (shown !== null) { doOpen(index); return; }
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      doOpen(index);
    }, HOVER_INTENT_MS);
  };

  // Wejście / przełączenie nakładki: spokojne fade + miękki scale (bez FLIP-a
  // „z prostokąta"), a pasek celów wjeżdża jako jedna całość.
  React.useLayoutEffect(() => {
    if (active === null) return;
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    // Zdejmij zaległe animacje paska (np. fill:forwards z przerwanego zamykania).
    cancelNavAnims();
    const el = expandRef.current;
    if (flipAnim.current) flipAnim.current.cancel();
    if (!el || reducedMotion.current) return;

    if (freshOpen.current) {
      // Świeże wejście: kafelek powoli wyłania się z głębi — delikatny blur,
      // subtelne unoszenie i łagodny scale, które spokojnie wyhamowuje.
      // Bez skoków, bez migania — efekt premium „wprowadzenia w głąb".
      flipAnim.current = el.animate(
        [
          { opacity: 0, transform: 'translateY(24px) scale(0.9)', filter: 'blur(12px)' },
          { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' }
        ],
        { duration: ENTER_MS, easing: EASE_SOFT }
      );
      // Pasek celów wjeżdża jako jedna całość (bez blur, bez rozjazdu ikon),
      // z wyraźnym opóźnieniem, żeby pojawił się po osadzeniu kafelka.
      const wrap = navWrapRef.current;
      if (wrap) {
        navAnims.current.push(
          wrap.animate(
            [
              { opacity: 0, transform: 'translateY(18px)' },
              { opacity: 1, transform: 'translateY(0px)' }
            ],
            { duration: NAV_IN_MS, delay: 220, easing: EASE_SOFT, fill: 'backwards' }
          )
        );
      }
    } else {
      // Zmiana celu z paska — stosujemy TO SAMO, głębokie wejście co przy hoverze
      // (unoszenie z głębi + blur + scale), żeby przełączanie było równie płynne.
      flipAnim.current = el.animate(
        [
          { opacity: 0, transform: 'translateY(24px) scale(0.9)', filter: 'blur(12px)' },
          { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' }
        ],
        { duration: ENTER_MS, easing: EASE_SOFT }
      );
    }
  }, [active]);

  // Zjazd kursora: nakładka łagodnie gaśnie (fade + delikatny scale w dół),
  // a pasek celów znika jako całość. Bez skoków i migania.
  const collapse = (): void => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    const el = expandRef.current;
    const target = shown;
    if (el === null || target === null || reducedMotion.current) {
      setActive(null);
      setShown(null);
      return;
    }
    setActive(null);
    if (flipAnim.current) flipAnim.current.cancel();
    cancelNavAnims();

    flipAnim.current = el.animate(
      [
        { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: 'translateY(16px) scale(0.94)', filter: 'blur(8px)' }
      ],
      { duration: EXIT_MS, easing: EASE_SOFT, fill: 'forwards' }
    );

    const wrap = navWrapRef.current;
    if (wrap) {
      navAnims.current.push(
        wrap.animate(
          [
            { opacity: 1, transform: 'translateY(0px)' },
            { opacity: 0, transform: 'translateY(12px)' }
          ],
          { duration: NAV_OUT_MS, easing: EASE_SOFT, fill: 'forwards' }
        )
      );
    }

    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setShown(null);
    }, Math.max(EXIT_MS, NAV_OUT_MS) + 50);
  };

  const shownGoal = shown !== null ? GOALS[shown] : undefined;
  const sgt = shownGoal ? t.goalText[shownGoal.id] : undefined;
  const closing = active === null;

  return (
    <section id="sec-cel" className={styles.section} ref={sectionRef}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionKicker}>{t.cel.kicker}</div>
          <h2 className={styles.sectionTitle}>
            {t.cel.title.pre}<span className={styles.gradientText}>{t.cel.title.grad}</span>{t.cel.title.post}
          </h2>
          <p className={styles.sectionLead}>
            {t.cel.lead}
          </p>
        </div>

        <div className={styles.goalStage} onMouseLeave={collapse}>
          <div className={styles.goalGrid} data-dimmed={active !== null ? 'true' : 'false'}>
            {GOALS.map((goal, i) => {
              const gt = t.goalText[goal.id];
              return (
                <button
                  key={goal.id}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  type="button"
                  className={styles.goalCard}
                  onMouseEnter={() => openFrom(i)}
                  onFocus={() => openFrom(i)}
                  onClick={(e) => openGuide(goal, e)}
                >
                  <span className={styles.goalGlow} style={{ background: goal.accent }} aria-hidden="true" />
                  <span className={styles.goalIconBare} aria-hidden="true"><GoalGlyph id={goal.id} className={styles.goalGlyphSvg} /></span>
                  <span className={styles.goalTitle}>{gt ? gt.title : goal.title}</span>
                  <span className={styles.goalTools}>{gt ? gt.tools : goal.tools}</span>
                  <span className={styles.goalArrow}>
                    {t.cel.matchCta}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          {shownGoal && (
            <button
              ref={expandRef}
              type="button"
              className={styles.goalExpandCard}
              data-closing={closing ? 'true' : 'false'}
              onClick={(e) => openGuide(shownGoal, e)}
            >
              <span className={styles.goalExpandGlow} style={{ background: shownGoal.accent }} aria-hidden="true" />
              <span className={styles.goalExpandArt}>
                <GoalVideo id={shownGoal.id} />
              </span>
              <span className={styles.goalExpandTitle}>{sgt ? sgt.title : shownGoal.title}</span>
              <span className={styles.goalTools}>{sgt ? sgt.tools : shownGoal.tools}</span>
              <span className={styles.goalArrow}>
                {t.cel.matchCta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          )}

          {/* Pasek nawigacyjny ze zminimalizowanymi ikonami — aktywny tylko w widoku rozwiniętym.
              Zmiana celu wyłącznie na KLIK (nie hover), żeby nie aktywował się przypadkiem. */}
          {shownGoal && (
            <div className={styles.goalNavWrap} data-closing={closing ? 'true' : 'false'} ref={navWrapRef}>
              <div className={styles.goalNavLabel} ref={navLabelRef}>{t.cel.navHint}</div>
              <div className={styles.goalNav} ref={navRef} aria-label="Inne cele">
                {GOALS.map((goal, i) => {
                  if (i === shown) return null;
                  const gt = t.goalText[goal.id];
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      className={styles.goalNavChip}
                      aria-label={gt ? gt.title : goal.title}
                      onClick={() => doOpen(i)}
                    >
                      <GoalGlyph id={goal.id} className={styles.goalNavGlyph} />
                      <span className={styles.goalNavTip}>{gt ? gt.title : goal.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {guideGoal && (
        <GoalGuide
          open
          goal={guideGoal}
          settings={settings}
          origin={guideOrigin}
          onClose={() => setGuideGoal(undefined)}
          onAllTools={() => { setGuideGoal(undefined); onSelectGoal('sec-tools'); }}
        />
      )}
    </section>
  );
};

export default CelSection;

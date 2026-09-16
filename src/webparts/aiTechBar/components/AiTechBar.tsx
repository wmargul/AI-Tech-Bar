import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import styles from './AiTechBar.module.scss';
import type { IAiTechBarProps } from './IAiTechBarProps';

import { L10nProvider, STRINGS, Lang } from './i18n';
import PersonaCredit from './PersonaCredit';
import ConstellationBackground, { IConstellationHandle } from './background/ConstellationBackground';
import WelcomeScreen from './sections/WelcomeScreen';
import NavBar from './sections/NavBar';
import NavigationHero from './sections/NavigationHero';
import CelSection from './sections/CelSection';
import ToolsCarousel from './sections/ToolsCarousel';
import StrefaSzkolen from './sections/StrefaSzkolen';
import BookingPolicy from './sections/BookingPolicy';

// Kolejność paneli full-page (jeden gest scrolla = jeden panel).
const SECTION_ORDER = ['sec-hero', 'sec-szkolenia', 'sec-cel', 'sec-tools', 'sec-booking'];

const getFirstName = (displayName: string): string => {
  if (!displayName) return 'Gościu';
  const trimmed = displayName.trim();
  if (trimmed.indexOf(',') > -1) {
    return trimmed.split(',')[1].trim().split(' ')[0] || trimmed;
  }
  return trimmed.split(' ')[0];
};

const AiTechBar: React.FC<IAiTechBarProps> = (props) => {
  const { hasTeamsContext, userDisplayName, settings, isEditMode, fullScreen, leftOffset, serviceScope, creditUpn } = props;
  const canFullScreen = fullScreen && !isEditMode;
  const [fsOn, setFsOn] = React.useState<boolean>(true);
  const [showFsHint, setShowFsHint] = React.useState<boolean>(false);
  const enableFullScreen = canFullScreen && fsOn;
  const [introVisible, setIntroVisible] = React.useState<boolean>(true);
  const [lang, setLang] = React.useState<Lang>('pl');
  const t = STRINGS[lang];
  const landingRef = React.useRef<HTMLDivElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<IConstellationHandle>(null);

  const animatingRef = React.useRef<boolean>(false);
  const activeIndexRef = React.useRef<number>(0);

  const firstName = React.useMemo(() => getFirstName(userDisplayName), [userDisplayName]);

  // Przełącznik trybu pełnoekranowego (domyślnie ON). Przy wyłączeniu pokazuje
  // rekomendację, że pełny ekran daje najlepszy efekt.
  const toggleFullScreen = React.useCallback((): void => {
    setFsOn((prev) => {
      const next = !prev;
      setShowFsHint(!next);
      return next;
    });
  }, []);

  const enableFsFromHint = React.useCallback((): void => {
    setFsOn(true);
    setShowFsHint(false);
  }, []);

  // Auto-ukrycie komunikatu rekomendacji.
  React.useEffect(() => {
    if (!showFsHint) return undefined;
    const t = window.setTimeout(() => setShowFsHint(false), 6000);
    return () => window.clearTimeout(t);
  }, [showFsHint]);

  // W pełnym ekranie blokujemy scroll body, by za overlayem nic nie prześwitywało.
  React.useEffect(() => {
    if (!enableFullScreen || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [enableFullScreen]);

  // Zaznacza panel jako aktywny (fade-in) i pozostałe jako nieaktywne (fade-out).
  const activate = React.useCallback((idx: number): void => {
    if (typeof document === 'undefined') return;
    SECTION_ORDER.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle(styles.sectionActive, i === idx);
    });
    activeIndexRef.current = idx;
  }, []);

  // Płynne przejście do panelu o danym indeksie.
  const goToIndex = React.useCallback((rawIdx: number): void => {
    const root = landingRef.current;
    if (!root) return;
    const idx = Math.max(0, Math.min(SECTION_ORDER.length - 1, rawIdx));
    const el = document.getElementById(SECTION_ORDER[idx]);
    if (!el) return;
    const target = idx === 0 ? 0 : el.offsetTop;

    activate(idx);
    animatingRef.current = true;
    const proxy = { y: root.scrollTop };
    gsap.to(proxy, {
      y: target,
      duration: 0.9,
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => { root.scrollTop = proxy.y; },
      onComplete: () => { window.setTimeout(() => { animatingRef.current = false; }, 240); }
    });
  }, [activate]);

  const goByDirection = React.useCallback((dir: number): void => {
    if (animatingRef.current) return;
    const next = activeIndexRef.current + dir;
    if (next < 0 || next > SECTION_ORDER.length - 1) return;
    goToIndex(next);
  }, [goToIndex]);

  // Klik w nawigację / cele — ta sama płynna animacja.
  const scrollToSection = React.useCallback((targetId: string) => {
    const idx = SECTION_ORDER.indexOf(targetId);
    goToIndex(idx < 0 ? 0 : idx);
  }, [goToIndex]);

  // Fade paneli sterowany pozycją w viewport (działa też w trybie edycji).
  React.useEffect(() => {
    const root = landingRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    activate(0);
    const els = SECTION_ORDER
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = SECTION_ORDER.indexOf(entry.target.id);
            if (idx >= 0) activate(idx);
          }
        });
      },
      { root, threshold: [0.5, 0.75] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activate, enableFullScreen, introVisible]);

  // Kontroler full-page: jeden gest = jeden panel. Tylko w trybie pełnoekranowym.
  React.useEffect(() => {
    if (introVisible || !enableFullScreen) return undefined;
    const root = landingRef.current;
    if (!root) return undefined;

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      if (animatingRef.current) return;
      if (Math.abs(e.deltaY) < 4) return;
      goByDirection(e.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent): void => { touchStartY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent): void => { e.preventDefault(); };
    const onTouchEnd = (e: TouchEvent): void => {
      if (animatingRef.current) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) goByDirection(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent): void => {
      if (animatingRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); goByDirection(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); goByDirection(-1);
      } else if (e.key === 'Home') {
        e.preventDefault(); goToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault(); goToIndex(SECTION_ORDER.length - 1);
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [introVisible, enableFullScreen, goByDirection, goToIndex]);

  // Dopóki intro widoczne — strona pod spodem jest ukryta.
  React.useEffect(() => {
    if (!introVisible) return;
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (pageRef.current && !reduceMotion) {
      gsap.set(pageRef.current, { opacity: 0 });
    }
  }, [introVisible]);

  /** Klik „Rozpocznij przygodę" — bloom strony i tła z środka, w lockstep z collapse welcome. */
  const handleIntroStart = React.useCallback((): void => {
    const page = pageRef.current;
    if (landingRef.current) landingRef.current.scrollTop = 0;

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      if (page) gsap.set(page, { opacity: 1, scale: 1, y: 0, filter: 'none' });
      return;
    }

    const bgCanvas = bgRef.current ? bgRef.current.canvas : undefined;
    if (bgCanvas) {
      gsap.set(bgCanvas, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
    }
    if (!page) return;

    gsap.set(page, { opacity: 0, scale: 0.92, y: 18, filter: 'blur(8px)', transformOrigin: '50% 50%' });

    const tl = gsap.timeline();
    if (bgCanvas) {
      tl.to(bgCanvas, { opacity: 1, scale: 1, duration: 1.5, ease: 'expo.out' }, 1.55);
    }
    tl.to(page, {
      opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 1.45, ease: 'expo.out',
      clearProps: 'transform,filter'
    }, 1.6);
  }, []);

  /** Po zakończeniu wyjścia welcome — odmontuj overlay i ustaw pierwszy panel. */
  const handleIntroFinish = React.useCallback((): void => {
    if (landingRef.current) landingRef.current.scrollTop = 0;
    activate(0);
    setIntroVisible(false);
  }, [activate]);

  const appStyle = enableFullScreen
    ? ({ ['--atb-left' as string]: `${Math.max(0, leftOffset)}px` } as React.CSSProperties)
    : undefined;

  const snapActive = !introVisible && enableFullScreen;

  const langToggleNode = (
    <div className={styles.langToggle} role="group" aria-label={t.lang.label}>
      <button
        type="button"
        className={`${styles.langOpt} ${lang === 'pl' ? styles.langOptActive : ''}`}
        aria-pressed={lang === 'pl'}
        onClick={() => setLang('pl')}
      >
        PL
      </button>
      <button
        type="button"
        className={`${styles.langOpt} ${lang === 'en' ? styles.langOptActive : ''}`}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  );

  const fsToggleNode = canFullScreen ? (
    <button
      type="button"
      className={styles.fsToggle}
      role="switch"
      aria-checked={fsOn}
      onClick={toggleFullScreen}
      title={fsOn ? 'Full screen: ON' : 'Full screen: OFF'}
    >
      <span className={`${styles.fsTrack} ${fsOn ? styles.fsTrackOn : ''}`}>
        <span className={styles.fsKnob} />
      </span>
      <span className={styles.fsLabel}>{t.fs.label}</span>
    </button>
  ) : undefined;

  const leftSlot = (
    <>
      {langToggleNode}
      {fsToggleNode}
    </>
  );

  const content = (
    <L10nProvider lang={lang}>
    <div
      className={`${styles.app} ${hasTeamsContext ? styles.teams : ''} ${enableFullScreen ? styles.fullscreen : ''}`}
      style={appStyle}
    >
      <ConstellationBackground ref={bgRef} intensity={introVisible ? 1 : 0.9} />

      {showFsHint && (
        <div className={styles.fsHint} role="status">
          <span className={styles.fsHintStar}>★</span>
          <span className={styles.fsHintText}>{t.fs.hint}</span>
          <button type="button" className={styles.fsHintCta} onClick={enableFsFromHint}>{t.fs.cta}</button>
          <button
            type="button"
            className={styles.fsHintClose}
            onClick={() => setShowFsHint(false)}
            aria-label="×"
          >
            ×
          </button>
        </div>
      )}

      <div
        ref={landingRef}
        className={`${styles.landing} ${introVisible ? styles.landingLocked : ''} ${snapActive ? styles.landingSnap : ''}`}
      >
        <div ref={pageRef} className={styles.page}>
          <NavBar scrollContainer={landingRef} onNavigate={scrollToSection} leftSlot={leftSlot} />
          <NavigationHero firstName={firstName} onNavigate={scrollToSection} />
          <StrefaSzkolen settings={settings} />
          <CelSection onSelectGoal={scrollToSection} />
          <ToolsCarousel settings={settings} />
          <BookingPolicy settings={settings} />
        </div>
      </div>

      {!introVisible && (
        <div className={styles.appCredit}>
          <PersonaCredit serviceScope={serviceScope} upn={creditUpn} className={styles.appCreditTrigger}>
            {t.welcome.creditPre}
            <span className={styles.appCreditName}>{t.welcome.creditName}</span>
          </PersonaCredit>
        </div>
      )}

      {introVisible && (
        <WelcomeScreen
          onStart={handleIntroStart}
          onFinish={handleIntroFinish}
          lang={lang}
          onLangChange={setLang}
          serviceScope={serviceScope}
          creditUpn={creditUpn}
        />
      )}
    </div>
    </L10nProvider>
  );

  if (enableFullScreen && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
};

export default AiTechBar;

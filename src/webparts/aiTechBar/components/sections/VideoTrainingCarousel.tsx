import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import styles from '../AiTechBar.module.scss';
import { TOOLS, ITool, IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';
import WarpField from './WarpField';
import ConstellationBackground from '../background/ConstellationBackground';
import ToolLogo from './ToolLogo';
import TrainingGallery from './TrainingGallery';

export interface IVideoTrainingCarouselProps {
  open: boolean;
  onClose: () => void;
  settings: IResolvedSettings;
  /** Punkt kliknięcia kafelka — z niego „rozkwita” się nakładka. */
  origin?: { x: number; y: number };
}

const AUTOPLAY_MS = 8000;
const QUEUE_SIZE = 4;
const GAP_PX = 28; // odstęp między kartami kolejki (musi pokrywać się z SCSS .vtcQueueRow gap)
const WARP_IN_MS = 1500;   // wejście kinowe
const WARP_OUT_MS = 1500;  // rozpad przy zamknięciu (taki sam czas jak wejście)

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VideoTrainingCarousel: React.FC<IVideoTrainingCarouselProps> = ({ open, onClose, settings, origin }) => {
  const { t } = useL10n();
  const s = t.szkolenia;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const bgsRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const queueRowRef = React.useRef<HTMLDivElement>(null);
  const counterRef = React.useRef<HTMLDivElement>(null);
  const controlsRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLFormElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const leavingRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef<boolean>(false);

  // Faza animacji: 'in' (warp wlatuje), 'shown' (panel gotowy), 'out' (rozpad).
  const [phase, setPhase] = React.useState<'in' | 'shown' | 'out'>('in');
  const phaseRef = React.useRef<'in' | 'shown' | 'out'>('in');
  phaseRef.current = phase;

  // Slajdy = realne narzędzia AI (bez kafelka „wszystkie narzędzia”), z tekstami w aktualnym języku.
  const slides = React.useMemo<ITool[]>(() => {
    return TOOLS.filter((tl) => !tl.isAllTools).map((tool) => {
      const tx = t.toolText[tool.id];
      if (!tx) return tool;
      return {
        ...tool,
        name: tx.name || tool.name,
        tagline: tx.tagline,
        description: tx.description,
        tags: tx.tags
      };
    });
  }, [t]);

  const count = slides.length;

  const [active, setActive] = React.useState<number>(0);
  const [leaving, setLeaving] = React.useState<number | null>(null); // stary slajd podczas dissolve
  const [query, setQuery] = React.useState<string>('');
  const [notFound, setNotFound] = React.useState<boolean>(false);
  const [paused, setPaused] = React.useState<boolean>(false);
  const [galleryTool, setGalleryTool] = React.useState<ITool | undefined>(undefined);
  const [galleryOrigin, setGalleryOrigin] = React.useState<{ x: number; y: number } | undefined>(undefined);
  const [tabHidden, setTabHidden] = React.useState<boolean>(false);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const progressRef = React.useRef<number>(0);
  const [, force] = React.useState<number>(0);

  const activeRef = React.useRef<number>(0);
  activeRef.current = active;

  // Zamrozenie licznika: otwarta galeria, odtwarzane nagranie (nasza karta w
  // tle) albo trwajace zamykanie. Samo najechanie kursorem NIE zatrzymuje
  // karuzeli. Trzymane w ref i sprawdzane w kazdej klatce, a nie jako warunek
  // wejscia do efektu — dzieki temu dziala natychmiast i za kazdym razem,
  // niezaleznie od tego, kiedy React przeliczy efekty.
  const frozenRef = React.useRef<boolean>(false);
  frozenRef.current = paused || !!galleryTool || tabHidden;
  const busyRef = React.useRef<boolean>(false); // trwa przejście → blokuj kolejne zmiany

  const resetProgress = React.useCallback((): void => { progressRef.current = 0; }, []);

  // Zmierz długość jednego slotu taśmy (szerokość karty + odstęp) na podstawie DOM.
  const measureSlot = React.useCallback((): number => {
    const row = queueRowRef.current;
    if (row && row.children.length >= 2) {
      const a = (row.children[0] as HTMLElement).getBoundingClientRect();
      const b = (row.children[1] as HTMLElement).getBoundingClientRect();
      const d = Math.abs(b.left - a.left);
      if (d > 0) return d;
    }
    return 216; // 200px karta + 16px gap
  }, []);

  // Przejście = równoczesny cross‑dissolve treści głównej (dwie warstwy) +
  // przesuw taśmy kolejki dokładnie o jeden slot w stronę głównego (bez cofania).
  const commit = React.useCallback((next: number, d: 1 | -1): void => {
    if (count === 0 || busyRef.current || next === activeRef.current) return;
    busyRef.current = true;
    resetProgress();
    setDir(d);
    setLeaving(activeRef.current); // poprzedni slajd → warstwa wychodząca
    setActive(next);               // nowy slajd → warstwa wchodząca (od razu, w sync)
  }, [count, resetProgress]);

  const go = React.useCallback((d: 1 | -1): void => {
    if (count === 0) return;
    commit((activeRef.current + d + count) % count, d);
  }, [count, commit]);

  // Klik w konkretny kafelek z kolejki — kolejka pokazuje wyłącznie pozycje
  // „w przód” (z zawijaniem), więc skok zawsze traktujemy jako ruch do przodu.
  const jumpTo = React.useCallback((i: number): void => {
    if (i === activeRef.current) return;
    commit(i, 1);
  }, [commit]);

  // Wyszukiwarka: po Enter/kliknięciu lupy znajdź narzędzie po nazwie (a gdy nie
  // ma trafienia — po tagline/tagach) i uczyń je głównym, rozwiniętym slajdem.
  const runSearch = React.useCallback((): void => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    let idx = slides.findIndex((tl) => tl.name.toLowerCase().indexOf(q) !== -1);
    if (idx === -1) {
      idx = slides.findIndex((tl) =>
        (tl.tagline || '').toLowerCase().indexOf(q) !== -1 ||
        (tl.tags || []).some((tag) => tag.toLowerCase().indexOf(q) !== -1)
      );
    }
    if (idx === -1) { setNotFound(true); return; }
    setNotFound(false);
    setQuery('');
    if (idx !== activeRef.current) jumpTo(idx);
  }, [query, slides, jumpTo]);

  const onSearchSubmit = React.useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    runSearch();
  }, [runSearch]);

  // Nagranie otwiera sie w nowej zakladce, wiec karuzela musi stanac takze
  // wtedy, gdy nasza karta traci widocznosc — inaczej leci dalej w tle.
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVisibility = (): void => setTabHidden(document.visibilityState === 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Reset stanu przy otwarciu.
  React.useEffect(() => {
    if (open) {
      setActive(0);
      setLeaving(null);
      setDir(1);
      resetProgress();
      setPaused(false);
      closingRef.current = false;
      busyRef.current = false;
    }
  }, [open, resetProgress]);

  // Wejście: panel „formuje się” miękko w trakcie warp (cząsteczki zlatują).
  // Treść jest ukryta póki cząsteczki się skupiają, potem delikatnie się odsłania.
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    if (prefersReducedMotion()) {
      gsap.set([bgsRef.current, mainRef.current, controlsRef.current, searchRef.current, closeBtnRef.current], { clearProps: 'all' });
      setPhase('shown');
      return undefined;
    }

    // moment „uformowania” panelu — ~55% czasu warp
    const reveal = (WARP_IN_MS / 1000) * 0.52;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // szybkie wejście ciemnego tła nakładki (warp na ciemnym tle)
      gsap.set(root, { opacity: 0 });
      tl.to(root, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);

      // tło narzędzia + treść materializują się dopiero, gdy cząsteczki się skupią
      if (bgsRef.current) {
        tl.fromTo(bgsRef.current,
          { opacity: 0, scale: 1.08 },
          { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out', transformOrigin: '50% 50%' },
          reveal);
      }
      if (contentRef.current) {
        const items = Array.prototype.slice.call(contentRef.current.children) as Element[];
        tl.fromTo(items,
          { y: 26, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power2.out', stagger: 0.09 },
          reveal + 0.05);
        const line = contentRef.current.querySelector('.' + styles.vtcEyebrowLine);
        if (line) {
          tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 0.7, ease: 'power3.out' }, reveal + 0.1);
        }
      }
      if (queueRowRef.current) {
        const cards = Array.prototype.slice.call(queueRowRef.current.children) as Element[];
        tl.fromTo(cards,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.09, clearProps: 'transform' },
          reveal + 0.18);
      }
      if (counterRef.current) {
        tl.fromTo(counterRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, reveal + 0.2);
      }
      if (searchRef.current) {
        tl.fromTo(searchRef.current, { top: 10, opacity: 0 }, { top: 24, opacity: 1, duration: 0.5, ease: 'power2.out' }, reveal + 0.12);
      }
      if (controlsRef.current) {
        tl.fromTo(controlsRef.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, reveal + 0.22);
      }
      if (closeBtnRef.current) {
        tl.fromTo(closeBtnRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, reveal + 0.28);
      }
    }, root);

    return () => { ctx.revert(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Zmiana slajdu — równoczesny cross‑dissolve dwóch warstw + przesuw taśmy.
  React.useLayoutEffect(() => {
    if (!open || prefersReducedMotion() || phaseRef.current !== 'shown') {
      busyRef.current = false;
      if (leaving !== null) setLeaving(null);
      return undefined;
    }

    const tl = gsap.timeline({ onComplete: () => {
      busyRef.current = false;
      const r = queueRowRef.current;
      if (r) gsap.set(r.children, { opacity: 1 }); // reset krycia kart na następne przejście
      setLeaving(null);
    } });

    // wchodzący content — materializuje się z głębi (blur→ostrość, scale, podjazd)
    if (contentRef.current) {
      tl.fromTo(contentRef.current,
        { opacity: 0, scale: 1.06, filter: 'blur(16px)', y: 24 },
        { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.64, ease: 'power3.out', clearProps: 'filter,transform' },
        0.06);
    }
    // wychodzący content — rozmywa się i odpływa w górę
    if (leavingRef.current) {
      tl.fromTo(leavingRef.current,
        { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 },
        { opacity: 0, scale: 0.95, filter: 'blur(12px)', y: -18, duration: 0.5, ease: 'power2.in' },
        0);
    }

    // Kolejka = jedna spójna taśma. Przesuwamy CAŁY rząd dokładnie o jeden slot
    // w lewo (w stronę głównego). Karta promowana wysuwa się poza lewą krawędź
    // (przycięta), a kolejna zza prawej krawędzi naturalnie wsuwa się na jej miejsce.
    // Brak FLIP‑ów per‑karta → zero efektu „cofania”, ruch tylko do przodu.
    const row = queueRowRef.current;
    if (row) {
      const slot = measureSlot();
      const base = -(slot - GAP_PX); // spoczynek: pierwsza widoczna karta tuż za feather‑em z lewej
      // Ile kroków w przód zrobiliśmy (klik w dalszy kafelek = skok > 1).
      const step = leaving === null ? 1 : (active - leaving + count) % count;

      if (dir === 1 && step === 1) {
        // Pojedynczy krok w przód — taśma jedzie o jeden slot, promowana karta gaśnie.
        tl.fromTo(row, { x: base + slot }, { x: base, duration: 0.62, ease: 'power3.inOut' }, 0);
        if (row.children[0]) {
          tl.to(row.children[0] as HTMLElement, { opacity: 0, duration: 0.14, ease: 'power1.out' }, 0);
        }
      } else if (dir === -1) {
        // Krok wstecz — taśma jedzie w prawo o jeden slot.
        tl.fromTo(row, { x: base - slot }, { x: base, duration: 0.62, ease: 'power3.inOut' }, 0);
      } else {
        // Skok o wiele kart (klik w dalszy kafelek): kolejka od razu ustawia się na
        // właściwej pozycji i nowy zestaw kart materializuje się (bez rozjazdu taśmy).
        gsap.set(row, { x: base });
        const cards = Array.prototype.slice.call(row.children) as HTMLElement[];
        tl.fromTo(cards,
          { opacity: 0, y: 16, filter: 'blur(7px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', stagger: 0.05, clearProps: 'filter,transform' },
          0.04);
      }
    }

    if (counterRef.current) {
      tl.fromTo(counterRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.05);
    }
    return () => { tl.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  // Pozycja spoczynkowa taśmy: pierwsza WIDOCZNA karta to slot 0, a karta k=0
  // (właśnie promowana) chowa się tuż za lewą krawędzią kadru. Podczas przejścia
  // pozycję ustawia powyższy efekt — tu tylko stan spoczynku/po przejściu.
  React.useLayoutEffect(() => {
    if (!open || leaving !== null) return;
    const row = queueRowRef.current;
    if (!row) return;
    gsap.set(row, { x: -(measureSlot() - GAP_PX) });
  }, [open, active, leaving, measureSlot]);

  // Zamknięcie = lustrzane wyjście budowane na AKTUALNYM DOM (nie reverse wejścia —
  // po przewinięciu kafelki kolejki to inne węzły, więc reverse zostawiał je na
  // ekranie). Treść + kolejka + sterowanie znikają, potem tło, na końcu cała
  // nakładka miękko wygasa (bez „blinku"), a WarpField rozsypuje cząsteczki.
  const requestClose = React.useCallback((): void => {
    if (closingRef.current) return;
    if (prefersReducedMotion()) { onClose(); return; }
    closingRef.current = true;
    setPaused(true);
    setPhase('out'); // montuje WarpField w trybie 'out'

    const root = rootRef.current;
    const tl = gsap.timeline({ onComplete: onClose });

    if (contentRef.current) {
      tl.to(contentRef.current, { opacity: 0, y: 18, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in' }, 0);
    }
    if (leavingRef.current) {
      tl.to(leavingRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
    }
    const row = queueRowRef.current;
    if (row) {
      const cards = Array.prototype.slice.call(row.querySelectorAll('[data-tool]')) as HTMLElement[];
      if (cards.length) {
        tl.to(cards, { y: 26, opacity: 0, scale: 0.92, duration: 0.42, ease: 'power2.in', stagger: 0.05 }, 0);
      }
    }
    if (counterRef.current) {
      tl.to(counterRef.current, { y: 12, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
    }
    if (controlsRef.current) {
      tl.to(controlsRef.current, { y: 18, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
    }
    if (searchRef.current) {
      tl.to(searchRef.current, { top: 10, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
    }
    if (closeBtnRef.current) {
      tl.to(closeBtnRef.current, { scale: 0.7, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
    }
    if (bgsRef.current) {
      tl.to(bgsRef.current, { opacity: 0, scale: 1.06, duration: 0.55, ease: 'power2.in', transformOrigin: '50% 50%' }, 0.12);
    }
    // końcowy, miękki fade całej nakładki — płynne odsłonięcie strony
    if (root) {
      tl.to(root, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, (WARP_OUT_MS / 1000) * 0.62);
    }
  }, [onClose]);

  // Autoplay + pasek postępu (jedna pętla rAF steruje obydwoma).
  React.useEffect(() => {
    if (!open || count <= 1 || phase !== 'shown') return undefined;
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      // `last` przesuwamy takze w zamrozeniu — inaczej po zamknieciu galerii
      // pierwsza klatka doliczylaby caly czas jej ogladania. Dodatkowy limit
      // 100 ms chroni przed skokiem po powrocie z karty w tle albo uspienia.
      const dt = Math.min(now - last, 100);
      last = now;

      if (!frozenRef.current) {
        if (busyRef.current) {
          // trwa przejście — wstrzymaj pasek przy końcu, nie skacz dalej
          progressRef.current = Math.min(progressRef.current, 1);
        } else {
          progressRef.current += dt / AUTOPLAY_MS;
          if (progressRef.current >= 1) {
            progressRef.current = 0;
            commit((activeRef.current + 1) % count, 1);
          }
        }
        force((n) => (n + 1) % 1000000);
      }
      raf = requestAnimationFrame(tick);
    };

    if (reduceMotion) {
      // bez animacji paska — proste przewijanie czasowe
      const id = window.setInterval(() => {
        if (frozenRef.current) return;
        commit((activeRef.current + 1) % count, 1);
      }, AUTOPLAY_MS);
      return () => window.clearInterval(id);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, count, phase, commit]);

  // Klawiatura: strzałki + Escape.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      const typing = (e.target as HTMLElement | null)?.tagName === 'INPUT';
      if (e.key === 'Escape') { e.preventDefault(); requestClose(); }
      else if (!typing && e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (!typing && e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, requestClose]);

  // Blokada scrolla tła póki nakładka otwarta.
  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || count === 0 || typeof document === 'undefined') return null;

  const activeTool = slides[active];
  const progressPct = Math.min(100, Math.max(0, progressRef.current * 100));

  // Taśma kolejki: QUEUE_SIZE+2 kart [active .. active+QUEUE_SIZE+1].
  // Skrajne (k=0 oraz k=QUEUE_SIZE+1) są poza kadrem (przycięte) — k=0 to karta,
  // która właśnie weszła na główny (schowana z lewej), a ostatnia czeka z prawej.
  const belt: { tool: ITool; index: number; hidden: boolean }[] = [];
  for (let k = 0; k <= QUEUE_SIZE + 1; k++) {
    const idx = (active + k) % count;
    belt.push({ tool: slides[idx], index: idx, hidden: k === 0 || k === QUEUE_SIZE + 1 });
  }

  // Treść warstwy (główny slajd) — używana przez warstwę wchodzącą i wychodzącą.
  const renderContent = (tool: ITool): React.ReactNode => (
    <>
      <div className={styles.vtcLogo}>
        <ToolLogo id={tool.id} badge={tool.badge} />
      </div>
      <div className={styles.vtcEyebrow}>
        <span className={styles.vtcEyebrowLine} />
        {s.carouselEyebrow} · {tool.tagline}
      </div>
      <h2 className={styles.vtcTitle}>{tool.name}</h2>
      <p className={styles.vtcDesc}>{tool.description}</p>
      <button
        type="button"
        className={styles.vtcCta}
        onClick={(e) => {
          setGalleryOrigin({ x: e.clientX, y: e.clientY });
          setGalleryTool(tool);
        }}
      >
        {s.carouselCta}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );

  const overlay = (
    <div
      ref={rootRef}
      className={styles.vtcOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={s.carouselEyebrow}
    >
      {/* Tło: ta sama interaktywna konstelacja AI Tech co na całej stronie */}
      <div ref={bgsRef} className={styles.vtcBgs} aria-hidden="true">
        <ConstellationBackground intensity={0.9} />
        <div className={styles.vtcScrim} />
        <div className={styles.vtcGrain} />
      </div>

      {phase !== 'shown' && (
        <WarpField
          key={phase}
          mode={phase === 'out' ? 'out' : 'in'}
          origin={origin}
          durationMs={phase === 'out' ? WARP_OUT_MS : WARP_IN_MS}
          onComplete={phase === 'out' ? () => undefined : () => setPhase('shown')}
        />
      )}

      <button
        ref={closeBtnRef}
        type="button"
        className={styles.vtcClose}
        onClick={requestClose}
        aria-label={s.carouselClose}
        title={s.carouselClose}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Wyszukiwarka narzędzia — po Enter/lupie dane narzędzie staje się głównym slajdem */}
      <form
        ref={searchRef}
        className={`${styles.vtcSearch} ${notFound ? styles.vtcSearchNotFound : ''}`}
        onSubmit={onSearchSubmit}
        role="search"
      >
        <svg className={styles.vtcSearchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className={styles.vtcSearchInput}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (notFound) setNotFound(false); }}
          placeholder={t.tools.searchPlaceholder}
          aria-label={t.tools.searchPlaceholder}
          list="vtcToolNames"
          autoComplete="off"
        />
        <datalist id="vtcToolNames">
          {slides.map((tl) => <option key={tl.id} value={tl.name} />)}
        </datalist>
        <button type="submit" className={styles.vtcSearchGo} aria-label={t.tools.open}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {/* Scena o stałej skali — content + kolejka trzymają się razem (brak rozjeżdżania) */}
      <div ref={mainRef} className={styles.vtcMain}>
        <div className={styles.vtcStage}>
          {/* Treść aktywnego slajdu (lewa strona) — dwie warstwy do cross‑dissolve */}
          <div className={styles.vtcContentStage}>
            {leaving !== null && (
              <div
                ref={leavingRef}
                className={`${styles.vtcContent} ${styles.vtcContentLayer}`}
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
              >
                {renderContent(slides[leaving])}
              </div>
            )}
            <div ref={contentRef} className={`${styles.vtcContent} ${styles.vtcContentLayer}`}>
              {renderContent(activeTool)}
            </div>
          </div>

          {/* Kolejka kart (prawa strona) — taśma w przyciętym oknie */}
          <div className={styles.vtcQueue} aria-label={s.carouselUpNext}>
            <div className={styles.vtcQueueViewport}>
              <div ref={queueRowRef} className={styles.vtcQueueRow}>
                {belt.map(({ tool, index, hidden }) => (
                  <button
                    type="button"
                    key={tool.id}
                    data-tool={tool.id}
                    className={styles.vtcCard}
                    style={{ pointerEvents: hidden ? 'none' : 'auto' }}
                    onClick={() => { if (!hidden) jumpTo(index); }}
                    aria-hidden={hidden ? true : undefined}
                    tabIndex={hidden ? -1 : undefined}
                    aria-label={tool.name}
                  >
                    <ToolLogo id={tool.id} badge={tool.badge} className={styles.vtcCardLogo} />
                    <span className={styles.vtcCardMeta}>
                      <span className={styles.vtcCardTagline}>{tool.tagline}</span>
                      <span className={styles.vtcCardName}>{tool.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sterowanie: strzałki + pasek postępu + licznik */}
      <div ref={controlsRef} className={styles.vtcControls}>
        <div className={styles.vtcArrows}>
          <button type="button" className={styles.vtcArrow} onClick={() => go(-1)} aria-label="‹">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.vtcArrow} onClick={() => go(1)} aria-label="›">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.vtcProgress}>
          <span className={styles.vtcProgressFill} style={{ width: `${progressPct}%` }} />
        </div>

        <div ref={counterRef} className={styles.vtcCounter}>
          <span className={styles.vtcCounterCur} data-dir={dir}>{pad2(active + 1)}</span>
          <span className={styles.vtcCounterSep}>/</span>
          <span className={styles.vtcCounterTotal}>{pad2(count)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(overlay, document.body)}
      {galleryTool && (
        <TrainingGallery
          open={!!galleryTool}
          onClose={() => setGalleryTool(undefined)}
          tool={galleryTool}
          settings={settings}
          origin={galleryOrigin}
        />
      )}
    </>
  );
};

export default VideoTrainingCarousel;

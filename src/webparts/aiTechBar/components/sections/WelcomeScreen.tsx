import * as React from 'react';
import { gsap } from 'gsap';
import { ServiceScope } from '@microsoft/sp-core-library';
import styles from '../AiTechBar.module.scss';
import { useL10n, Lang } from '../i18n';
import PersonaCredit from '../PersonaCredit';
import { ensureCornFont } from './cornFont';

export interface IWelcomeScreenProps {
  /** Odpalane W MOMENCIE kliknięcia — parent zaczyna bloom strony w lockstep. */
  onStart: () => void;
  /** Odpalane PO zakończeniu wyjścia — parent odmontowuje overlay. */
  onFinish: () => void;
  /** Aktualny język (sterowany w parencie). */
  lang: Lang;
  /** Zmiana języka z poziomu ekranu powitalnego. */
  onLangChange: (lang: Lang) => void;
  /** ServiceScope — karta osoby przy credits. */
  serviceScope?: ServiceScope;
  /** UPN/email autora dla karty osoby. */
  creditUpn?: string;
}

interface IParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** chwilowe przesunięcie od kursora (wraca do 0) */
  ox: number;
  oy: number;
  r: number;
}

/**
 * Sterowanie fizyką sieci cząsteczek — modyfikowane przez timeline wyjścia.
 *   vel   mnożnik prędkości (1 = idle)
 *   pull  przyciąganie do środka (0 = brak) — rośnie przy wsysaniu
 *   link  krycie linii (1 = normalne, 0 = wył.)
 *   alpha mnożnik krycia (fade-out)
 */
const PHYSICS = { vel: 1, pull: 0, link: 1, alpha: 1 };

const WelcomeScreen: React.FC<IWelcomeScreenProps> = ({ onStart, onFinish, lang, onLangChange, serviceScope, creditUpn }) => {
  const { t } = useL10n();
  const titleWords = t.welcome.titleWords;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const godRaysRef = React.useRef<HTMLDivElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const bloomRef = React.useRef<HTMLDivElement>(null);
  const eyebrowRef = React.useRef<HTMLDivElement>(null);
  const titleWrapRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const titleFxRef = React.useRef<HTMLCanvasElement>(null);
  const subtitleRef = React.useRef<HTMLParagraphElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const hintRef = React.useRef<HTMLDivElement>(null);
  const creditRef = React.useRef<HTMLDivElement>(null);
  const langRef = React.useRef<HTMLDivElement>(null);
  const exitingRef = React.useRef<boolean>(false);

  // ---- sieć cząsteczek (własna dla welcome, zapada się do środka) ----
  React.useEffect(() => {
    PHYSICS.vel = 1; PHYSICS.pull = 0; PHYSICS.link = 1; PHYSICS.alpha = 1;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const LINK_DIST = 140;
    const MOUSE_DIST = 150;   // promień reakcji na kursor (jak w tle sekcji)
    const MAX_PUSH = 24;      // maks. delikatne odepchnięcie (px)
    const RETURN = 0.12;      // szybkość sprężystego powrotu do pozycji
    let raf: number | null = null;
    let particles: IParticle[] = [];
    let stopped = false;
    const mouse = { x: -9999, y: -9999, active: false };

    const init = (): void => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = Math.max(46, Math.min(120, Math.round((w * h) * 0.00008)));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.34,
          vy: (Math.random() - 0.5) * 0.34,
          ox: 0,
          oy: 0,
          r: Math.random() * 1.5 + 0.5
        });
      }
    };

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    const draw = (): void => {
      if (stopped) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const k = PHYSICS.vel;
      const g = PHYSICS.pull;
      const a = PHYSICS.alpha;
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (g !== 0) {
          p.vx += (cx - p.x) * g * 0.0006;
          p.vy += (cy - p.y) * g * 0.0006;
        }
        p.x += p.vx * k;
        p.y += p.vy * k;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // delikatne odepchnięcie od kursora (wyłączone podczas wsysania)
        let tox = 0;
        let toy = 0;
        if (mouse.active && PHYSICS.pull === 0) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < MOUSE_DIST && mdist > 0.001) {
            const strength = (1 - mdist / MOUSE_DIST) * MAX_PUSH;
            tox = (mdx / mdist) * strength;
            toy = (mdy / mdist) * strength;
          }
        }
        p.ox += (tox - p.ox) * RETURN;
        p.oy += (toy - p.oy) * RETURN;
      }

      const linkA = PHYSICS.link * a;
      if (linkA > 0.002) {
        ctx.lineWidth = 0.7;
        for (let i = 0; i < particles.length; i++) {
          const ax = particles[i].x + particles[i].ox;
          const ay = particles[i].y + particles[i].oy;
          for (let j = i + 1; j < particles.length; j++) {
            const bx = particles[j].x + particles[j].ox;
            const by = particles[j].y + particles[j].oy;
            const dx = ax - bx;
            const dy = ay - by;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK_DIST * LINK_DIST) {
              const dist = Math.sqrt(d2);
              const alpha = (1 - dist / LINK_DIST) * 0.26 * linkA;
              ctx.strokeStyle = 'rgba(167, 139, 250, ' + alpha.toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
              ctx.stroke();
            }
          }
        }
      }

      ctx.fillStyle = 'rgba(200, 220, 255, ' + (0.85 * a).toFixed(3) + ')';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x + p.ox, p.y + p.oy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = (): void => { mouse.active = false; };

    resize();
    draw();
    const onResize = (): void => resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    return () => {
      stopped = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      if (raf !== null) window.cancelAnimationFrame(raf);
    };
  }, []);

  // ---- hover napisu: 1:1 z referencją cornrevolution.resn.global / CORN_HOVER.mov ----
  // W spoczynku litery są wypełnione (lite). W promieniu kursora wypełnienie znika i
  // zostaje sam KONTUR glifu, a „uwolnione" wypełnienie zamienia się w KONSTELACJĘ:
  // białe węzły połączone cienkimi liniami, które dryfują w dół/na zewnątrz i sprężyście
  // wracają na miejsce. Przytrzymanie klawisza myszy poszerza i wzmacnia efekt.
  React.useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    ensureCornFont();

    const canvas = titleFxRef.current;
    const h1 = titleRef.current;
    if (!canvas || !h1) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    interface INode { hx: number; hy: number; ox: number; oy: number; r: number; g: number; b: number; rad: number; sa: number; sr: number; ph: number; dir: number; fr: number; }

    // gradient spójny z resztą web partu (--c-accent-from → --c-accent-to)
    const GRAD_FROM = '#8b5cf6';
    const GRAD_TO = '#22d3ee';

    const PAD_X = 200;          // boczny margines (kontur / rozsypane węzły)
    const PAD_TOP = 120;
    const PAD_BOT = 200;
    const RADIUS = 206;         // promień strefy „fill→kontur" wokół kursora (lekko mniejszy)
    const SPREAD = 92;          // maks. rozsunięcie węzła od kursora
    const RETURN = 0.16;        // wygładzanie podążania za kursorem (ruch = tylko przy ruchu)
    const LINK_DIST = 134;      // maks. długość linii (łączenie tylko bliskich)
    const NODE_STEP = 30;       // RZADKIE próbkowanie — luźna konstelacja, nie pajęczyna
    const MAX_LINKS = 3;        // każdy węzeł łączy się z kilkoma najbliższymi sąsiadami

    let nodes: INode[] = [];
    let fillC: HTMLCanvasElement | null = null;   // lite litery (z gradientem słowa)
    let strokeC: HTMLCanvasElement | null = null; // kontury liter (lekko rozmyte)
    let cssW = 0;
    let cssH = 0;
    let raf: number | null = null;
    let stopped = false;
    const mouse = { x: -9999, y: -9999, active: false, down: false };

    const build = (): void => {
      const rect = h1.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = rect.width + PAD_X * 2;
      cssH = rect.height + PAD_TOP + PAD_BOT;

      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.style.left = -PAD_X + 'px';
      canvas.style.top = -PAD_TOP + 'px';
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cs = window.getComputedStyle(h1);
      const fontSize = parseFloat(cs.fontSize) || 96;
      const fontWeight = cs.fontWeight || '700';
      const fontFamily = cs.fontFamily || 'CornSaira, sans-serif';
      const lsPx = parseFloat(cs.letterSpacing);
      const letterSpacing = isNaN(lsPx) ? 0 : lsPx;

      const setFont = (c: CanvasRenderingContext2D): void => {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.textBaseline = 'alphabetic';
        c.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const cAny = c as unknown as { letterSpacing?: string };
        if ('letterSpacing' in c) cAny.letterSpacing = letterSpacing + 'px';
      };

      fillC = document.createElement('canvas');
      fillC.width = canvas.width; fillC.height = canvas.height;
      const fctx = fillC.getContext('2d');
      strokeC = document.createElement('canvas');
      strokeC.width = canvas.width; strokeC.height = canvas.height;
      const sctx = strokeC.getContext('2d');
      if (!fctx || !sctx) return;

      setFont(fctx); setFont(sctx);
      const space = fctx.measureText('\u00A0').width;
      const widths = titleWords.map((w) => fctx.measureText(w.chars).width);
      const m = fctx.measureText(titleWords.map((w) => w.chars).join(' '));
      const asc = m.actualBoundingBoxAscent || fontSize * 0.72;
      const desc = m.actualBoundingBoxDescent || fontSize * 0.2;
      const baseY = PAD_TOP + (rect.height + asc - desc) / 2;

      // subtelny, wąski kontur — minimalne rozmycie
      sctx.lineJoin = 'round';
      sctx.lineWidth = Math.max(0.6, fontSize * 0.0055);
      sctx.shadowColor = 'rgba(255,255,255,0.6)';
      sctx.shadowBlur = Math.max(1.2, fontSize * 0.02);

      let x = PAD_X;
      titleWords.forEach((w, i) => {
        if (w.gradient) {
          const g1 = fctx.createLinearGradient(x, 0, x + widths[i], 0);
          g1.addColorStop(0, GRAD_FROM); g1.addColorStop(1, GRAD_TO);
          fctx.fillStyle = g1;
          const g2 = sctx.createLinearGradient(x, 0, x + widths[i], 0);
          g2.addColorStop(0, GRAD_FROM); g2.addColorStop(1, GRAD_TO);
          sctx.strokeStyle = g2;
        } else {
          fctx.fillStyle = '#ffffff';
          sctx.strokeStyle = 'rgba(255,255,255,0.75)';
        }
        fctx.fillText(w.chars, x, baseY);
        sctx.strokeText(w.chars, x, baseY);
        x += widths[i] + space;
      });

      // węzły konstelacji — RZADKIE próbkowanie, różne wielkości i lekki losowy rozrzut
      const data = fctx.getImageData(0, 0, fillC.width, fillC.height).data;
      const step = Math.max(2, Math.round(NODE_STEP * dpr));
      nodes = [];
      for (let py = 0; py < fillC.height; py += step) {
        for (let px = 0; px < fillC.width; px += step) {
          const idx = (py * fillC.width + px) * 4;
          if (data[idx + 3] > 130) {
            const big = Math.random() < 0.18;
            nodes.push({
              hx: px / dpr,
              hy: py / dpr,
              ox: 0, oy: 0,
              r: data[idx], g: data[idx + 1], b: data[idx + 2],
              rad: big ? 2.6 + Math.random() * 1.6 : 1.1 + Math.random() * 1.1,
              sa: Math.random() * Math.PI * 2,          // ABSOLUTNY losowy kierunek (rozrzut 360°)
              sr: 0.5 + Math.random() * 0.95,           // losowa długość rozsunięcia
              ph: Math.random() * Math.PI * 2,          // faza pulsowania/szumu
              dir: Math.random() < 0.5 ? -1 : 1,        // kierunek orbitowania (swirl)
              fr: 0.6 + Math.random() * 0.9             // indywidualna częstotliwość ruchu
            });
          }
        }
      }
    };

    const draw = (): void => {
      if (stopped) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1) lite litery
      if (fillC) ctx.drawImage(fillC, 0, 0, cssW, cssH);

      const mx = mouse.x;
      const my = mouse.y;
      // kółko (strefa fill→kontur) ma stały rozmiar — także przy klik-trzymaniu
      const effR = mouse.active ? RADIUS : 0;
      // przy klik-trzymaniu rozsuwamy węzły dalej i wydłużamy linie (kreski rosną na długość)
      const spread = SPREAD * (mouse.down ? 1.7 : 1);
      const linkDist = LINK_DIST * (mouse.down ? 1.55 : 1);

      // 2) w strefie kursora: usuń wypełnienie i odsłoń sam kontur
      if (mouse.active && effR > 0) {
        const hole = ctx.createRadialGradient(mx, my, effR * 0.4, mx, my, effR);
        hole.addColorStop(0, 'rgba(0,0,0,1)');
        hole.addColorStop(0.74, 'rgba(0,0,0,0.98)');
        hole.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = hole;
        ctx.beginPath();
        ctx.arc(mx, my, effR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        if (strokeC) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(mx, my, effR * 0.94, 0, Math.PI * 2);
          ctx.clip();
          ctx.filter = 'blur(0.4px)';   // ledwie zmiękczony, ostrzejszy kontur
          ctx.globalAlpha = 0.82;
          ctx.drawImage(strokeC, 0, 0, cssW, cssH);
          ctx.globalAlpha = 1;
          ctx.filter = 'none';
          ctx.restore();
        }
      }

      // 3) węzły: rozsunięcie zależne WYŁĄCZNIE od pozycji kursora (stabilne, gdy
      //    kursor stoi; płynie tylko przy ruchu), z losowym kierunkiem/długością —
      //    luźna konstelacja zamiast jednolitej pajęczyny.
      // czas dla żywej, organicznej animacji konstelacji
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      // delikatnie na hover, mocno przy klik-trzymaniu (więcej życia, swirl + pulsowanie)
      const swirlAmt = mouse.down ? 0.95 : 0.16;
      const pulseAmt = mouse.down ? 0.38 : 0.10;
      const pulseFr = mouse.down ? 3.6 : 1.5;

      const active: INode[] = [];
      const ax: number[] = [];
      const ay: number[] = [];
      const vis: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        let tox = 0;
        let toy = 0;
        let prox = 0;
        if (mouse.active) {
          const dx = p.hx - mx;
          const dy = p.hy - my;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
          if (d < effR) {
            const f = (1 - d / effR);
            prox = f;
            // kierunek = absolutny losowy kąt + powolny swirl (orbita wokół kursora);
            // przy klik-trzymaniu swirl i pulsowanie są dużo silniejsze → konstelacja „żyje"
            const ang = p.sa + t * swirlAmt * p.dir;
            const pulse = 1 + pulseAmt * Math.sin(t * pulseFr * p.fr + p.ph);
            const mag = f * spread * p.sr * pulse;
            tox = Math.cos(ang) * mag;
            toy = Math.sin(ang) * mag;
          }
        }
        p.ox += (tox - p.ox) * RETURN;
        p.oy += (toy - p.oy) * RETURN;

        const off = Math.abs(p.ox) + Math.abs(p.oy);
        const v = Math.min(1, Math.max(prox, off / 20));
        if (v > 0.05) { active.push(p); ax.push(p.hx + p.ox); ay.push(p.hy + p.oy); vis.push(v); }
      }

      // 4) linie — tylko do NAJBLIŻSZYCH sąsiadów (rzadkie łańcuszki, nie pełna siatka)
      const N = active.length;
      const drawn = new Set<number>();
      ctx.lineWidth = 1;
      const LD2 = linkDist * linkDist;
      for (let i = 0; i < N; i++) {
        // znajdź najbliższe MAX_LINKS węzły
        let b1 = -1; let b2 = -1; let b3 = -1;
        let d1 = LD2; let d2 = LD2; let d3 = LD2;
        for (let j = 0; j < N; j++) {
          if (j === i) continue;
          const dx = ax[i] - ax[j];
          const dy = ay[i] - ay[j];
          const dd = dx * dx + dy * dy;
          if (dd < d1) { d3 = d2; b3 = b2; d2 = d1; b2 = b1; d1 = dd; b1 = j; }
          else if (dd < d2) { d3 = d2; b3 = b2; d2 = dd; b2 = j; }
          else if (dd < d3) { d3 = dd; b3 = j; }
        }
        const targets = [b1, b2, b3].slice(0, MAX_LINKS);
        for (let k = 0; k < targets.length; k++) {
          const j = targets[k];
          if (j < 0) continue;
          const key = i < j ? i * N + j : j * N + i;
          if (drawn.has(key)) continue;
          drawn.add(key);
          const dx = ax[i] - ax[j];
          const dy = ay[i] - ay[j];
          const dist = Math.sqrt(dx * dx + dy * dy);
          const alpha = (1 - dist / linkDist) * Math.min(vis[i], vis[j]) * (mouse.down ? 0.82 : 0.6);
          if (alpha <= 0.012) continue;
          const a = active[i]; const b = active[j];
          const cr = (a.r + b.r) >> 1;
          const cg = (a.g + b.g) >> 1;
          const cb = (a.b + b.b) >> 1;
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(ax[i], ay[i]);
          ctx.lineTo(ax[j], ay[j]);
          ctx.stroke();
        }
      }

      // 5) węzły — różne rozmiary, miękka poświata (kolor próbkowany);
      //    przy klik-trzymaniu mocniejszy blask i pulsujący rozmiar
      ctx.shadowColor = 'rgba(255,255,255,0.55)';
      ctx.shadowBlur = mouse.down ? 9 : 5;
      for (let i = 0; i < N; i++) {
        const p = active[i];
        const rr = mouse.down
          ? p.rad * (1 + 0.28 * Math.sin(t * pulseFr * p.fr + p.ph))
          : p.rad;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${vis[i].toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(ax[i], ay[i], Math.max(0.4, rr), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = window.requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = (): void => { mouse.active = false; };
    const onDown = (): void => { mouse.down = true; };
    const onUp = (): void => { mouse.down = false; };

    let resizeTimer = 0;
    const onResize = (): void => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 150);
    };

    build();
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!stopped) build(); }).catch(() => undefined);
    }
    draw();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('resize', onResize);
    return () => {
      stopped = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('resize', onResize);
      if (raf !== null) window.cancelAnimationFrame(raf);
    };
  }, [titleWords]);

  // ---- wejście (reveal) ----
  React.useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.set('.' + styles.titleChar, { opacity: 0, y: 56, rotateX: -30 });
      if (titleFxRef.current) gsap.set(titleFxRef.current, { opacity: 0 });
      gsap.set(eyebrowRef.current, { opacity: 0, y: 18 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 });
      gsap.set(buttonRef.current, { opacity: 0, y: 22, scale: 0.94 });
      if (hintRef.current) gsap.set(hintRef.current, { opacity: 0, y: 8 });
      if (creditRef.current) gsap.set(creditRef.current, { opacity: 0, y: 6 });
      if (langRef.current) gsap.set(langRef.current, { opacity: 0, y: 6 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 });
      tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.7 })
        .to('.' + styles.titleChar, { opacity: 1, y: 0, rotateX: 0, duration: 1.05, stagger: 0.025, ease: 'expo.out' }, '-=0.4')
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
        .to(buttonRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }, '-=0.4');
      if (hintRef.current) tl.to(hintRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
      if (creditRef.current) tl.to(creditRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35');
      if (langRef.current) tl.to(langRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');

      // Płynna podmiana statycznego <h1> na interaktywną wersję canvas (hover-ready).
      if (titleFxRef.current) {
        tl.to(titleRef.current, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.15')
          .to(titleFxRef.current, { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, '<');
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ---- magnes na przycisku ----
  React.useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return undefined;
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
    const onMove = (e: PointerEvent): void => {
      if (exitingRef.current) return;
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
    };
    const onLeave = (): void => { xTo(0); yTo(0); };
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', onLeave);
    return () => {
      btn.removeEventListener('pointermove', onMove);
      btn.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // ---- wyjście: per-layer collapse do środka ----
  const handleStart = React.useCallback((): void => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { onStart(); onFinish(); return; }

    const btn = buttonRef.current;
    const bloom = bloomRef.current;
    if (btn && bloom) {
      const r = btn.getBoundingClientRect();
      bloom.style.left = (r.left + r.width / 2) + 'px';
      bloom.style.top = (r.top + r.height / 2) + 'px';
    }

    // sygnał do parenta — bloom strony startuje w lockstep
    onStart();

    const tl = gsap.timeline({ defaults: { ease: 'power3.in' }, onComplete: onFinish });

    // ACT 1 — PRESS
    tl.to(btn, { scale: 0.92, duration: 0.1, ease: 'power2.in' }, 0);
    tl.to(btn, { scale: 1.02, duration: 0.14, ease: 'back.out(1.6)' }, 0.1);
    tl.to(btn, { opacity: 0, y: 18, scale: 0.78, duration: 0.4, ease: 'power3.inOut' }, 0.22);
    if (hintRef.current) tl.to(hintRef.current, { opacity: 0, y: 8, duration: 0.3, ease: 'power2.inOut' }, 0.1);
    if (creditRef.current) tl.to(creditRef.current, { opacity: 0, y: 6, duration: 0.3, ease: 'power2.inOut' }, 0.1);
    if (langRef.current) tl.to(langRef.current, { opacity: 0, y: 6, duration: 0.3, ease: 'power2.inOut' }, 0.1);

    if (bloom) {
      tl.fromTo(bloom, { opacity: 0, scale: 0.4 }, { opacity: 0.5, scale: 1, duration: 0.4, ease: 'power2.out' }, 0.1);
      tl.to(bloom, { opacity: 0, scale: 0, duration: 1.1, ease: 'power3.in' }, 0.4);
    }

    // ACT 2 — TEXT WIPE
    tl.to([eyebrowRef.current, titleRef.current, titleFxRef.current, subtitleRef.current], { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.05);

    // ACT 3 — LAYER DRAIN (każda warstwa zapada się do środka)
    if (godRaysRef.current) {
      tl.to(godRaysRef.current, { scale: 0, opacity: 0, rotate: -55, duration: 1.15, ease: 'power3.in', transformOrigin: '50% 50%' }, 0.2);
    }
    if (glowRef.current) {
      tl.to(glowRef.current, { scale: 0, opacity: 0, duration: 1.1, ease: 'power3.in', transformOrigin: '50% 50%' }, 0.4);
    }
    // cząsteczki — wsysane do środka, potem zgaszone
    tl.to(PHYSICS, { pull: 5, duration: 0.9, ease: 'power2.in' }, 0.3);
    tl.to(PHYSICS, { vel: 1.6, duration: 0.9, ease: 'power2.in' }, 0.3);
    tl.to(PHYSICS, { link: 0, alpha: 0, duration: 0.55, ease: 'power2.in' }, 1.0);
    if (canvasRef.current) {
      tl.to(canvasRef.current, { scale: 0, opacity: 0, duration: 1.0, ease: 'power3.in', transformOrigin: '50% 50%' }, 0.5);
    }

    // ACT 4 — BASE FADE
    tl.set(rootRef.current, { pointerEvents: 'none' }, 1.4);
    tl.to(rootRef.current, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 1.4);
  }, [onStart, onFinish]);

  return (
    <div ref={rootRef} className={styles.intro} role="dialog" aria-modal="true" aria-label="Witaj">
      <div ref={godRaysRef} className={styles.welcomeGodRays} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.welcomeCanvas} aria-hidden="true" />
      <div ref={glowRef} className={styles.welcomeGlow} aria-hidden="true" />
      <div ref={bloomRef} className={styles.welcomeBloom} aria-hidden="true" />

      <div className={styles.welcomeContent}>
        <div ref={eyebrowRef} className={styles.pill}>
          <span className={styles.pillDot} />
          {t.welcome.eyebrow}
        </div>

        <div ref={titleWrapRef} className={styles.titleFxWrap}>
          <h1 ref={titleRef} className={styles.welcomeTitle}>
            {titleWords.map((w, wIdx) => (
              <React.Fragment key={'tw-' + wIdx}>
                <span className={styles.titleWord}>
                  {Array.from(w.chars).map((c, i) => (
                    <span
                      key={'c-' + wIdx + '-' + i}
                      className={`${styles.titleChar}${w.gradient ? ' ' + styles.gradientText : ''}`}
                    >
                      {c}
                    </span>
                  ))}
                </span>
                {wIdx < titleWords.length - 1 && (
                  <span className={styles.titleSpace} aria-hidden="true">&nbsp;</span>
                )}
              </React.Fragment>
            ))}
          </h1>
          <canvas ref={titleFxRef} className={styles.titleFxCanvas} aria-hidden="true" />
        </div>

        <p ref={subtitleRef} className={styles.welcomeSubtitle}>
          {t.welcome.subtitle}
        </p>

        <button ref={buttonRef} type="button" className={styles.ctaButton} onClick={handleStart}>
          <span>{t.welcome.button}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div ref={hintRef} className={styles.welcomeHint}>
          <div className={styles.monoLabel}>{t.welcome.hint}</div>
        </div>
      </div>

      <div ref={creditRef} className={styles.welcomeCredit}>
        <PersonaCredit serviceScope={serviceScope} upn={creditUpn} className={`${styles.monoLabelDim} ${styles.creditTrigger}`}>
          {t.welcome.creditPre}
          <span className={styles.creditName}>{t.welcome.creditName}</span>
        </PersonaCredit>
      </div>

      <div ref={langRef} className={styles.welcomeLang}>
        <div className={styles.langToggle} role="group" aria-label={t.lang.label}>
          <button
            type="button"
            className={`${styles.langOpt} ${lang === 'pl' ? styles.langOptActive : ''}`}
            aria-pressed={lang === 'pl'}
            onClick={() => onLangChange('pl')}
          >
            PL
          </button>
          <button
            type="button"
            className={`${styles.langOpt} ${lang === 'en' ? styles.langOptActive : ''}`}
            aria-pressed={lang === 'en'}
            onClick={() => onLangChange('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

import * as React from 'react';
import styles from '../AiTechBar.module.scss';

interface IParticle {
  /** pozycja bazowa (dryf idle) */
  bx: number;
  by: number;
  vx: number;
  vy: number;
  /** chwilowe przesunięcie od kursora (wraca do 0) */
  ox: number;
  oy: number;
  size: number;
  twinkle: number;
}

export interface IConstellationHandle {
  canvas: HTMLCanvasElement | undefined;
}

export interface IConstellationBackgroundProps {
  /** Wzmocnienie ruchu / intensywność */
  intensity?: number;
}

/**
 * Interaktywne tło "AI Tech": sieć węzłów z liniami.
 *
 * Ruch składa się z dwóch niezależnych warstw:
 *   1) dryf bazowy (idle) — węzły cały czas delikatnie płyną i odbijają się
 *      od krawędzi (wrażenie życia nawet bez kursora),
 *   2) chwilowe przesunięcie od kursora — DELIKATNE odepchnięcie, które
 *      sprężyście i SZYBKO wraca do zera, więc kształt nie "ucieka".
 */
const ConstellationBackground = React.forwardRef<IConstellationHandle, IConstellationBackgroundProps>(
  ({ intensity = 1 }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const rafRef = React.useRef<number>(0);
    const particlesRef = React.useRef<IParticle[]>([]);
    const mouseRef = React.useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false });
    const sizeRef = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });

    React.useImperativeHandle(ref, (): IConstellationHandle => ({ canvas: canvasRef.current || undefined }));

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const LINK_DIST = 132;
      const MOUSE_DIST = 150;   // promień reakcji na kursor
      const MAX_PUSH = 24;      // maks. delikatne odepchnięcie (px)
      const RETURN = 0.12;      // jak szybko wraca do pozycji wyjściowej (większe = szybciej)
      const IDLE = 0.34 * intensity; // bazowa prędkość dryfu (więcej ruchu idle)

      const seedParticles = (w: number, h: number): void => {
        const count = Math.min(150, Math.max(46, Math.round((w * h) / 14000)));
        const arr: IParticle[] = [];
        for (let i = 0; i < count; i++) {
          arr.push({
            bx: Math.random() * w,
            by: Math.random() * h,
            vx: (Math.random() - 0.5) * IDLE,
            vy: (Math.random() - 0.5) * IDLE,
            ox: 0,
            oy: 0,
            size: Math.random() * 1.6 + 0.6,
            twinkle: Math.random() * Math.PI * 2
          });
        }
        particlesRef.current = arr;
      };

      const resize = (): void => {
        const parent = canvas.parentElement;
        const w = parent ? parent.clientWidth : window.innerWidth;
        const h = parent ? parent.clientHeight : window.innerHeight;
        // Podczas minimalizacji / animacji zwijania okna (albo ukrytej karty)
        // wymiary bywają 0 lub bardzo małe. Ignorujemy taki stan, żeby nie
        // "zgnieść" węzłów do lewego górnego rogu — inaczej po powrocie okna
        // sieć nie wraca do pierwotnego rozłożenia.
        if (w <= 0 || h <= 0) return;

        const prev = sizeRef.current;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        sizeRef.current = { w, h };
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (particlesRef.current.length === 0) {
          seedParticles(w, h);
        } else if (prev.w > 0 && prev.h > 0 && (prev.w !== w || prev.h !== h)) {
          // Realna zmiana rozmiaru — przeskaluj pozycje bazowe proporcjonalnie,
          // dzięki czemu węzły dalej wypełniają całą powierzchnię (a nie tylko
          // fragment po zmniejszeniu i powrocie okna).
          const sx = w / prev.w;
          const sy = h / prev.h;
          const arr = particlesRef.current;
          for (let i = 0; i < arr.length; i++) {
            arr[i].bx *= sx;
            arr[i].by *= sy;
          }
        }
      };

      const draw = (): void => {
        const { w, h } = sizeRef.current;
        const particles = particlesRef.current;
        const mouse = mouseRef.current;
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // 1) dryf bazowy + odbicie od krawędzi (zawsze aktywne)
          p.bx += p.vx;
          p.by += p.vy;
          if (p.bx < 0) { p.bx = 0; p.vx = Math.abs(p.vx); }
          else if (p.bx > w) { p.bx = w; p.vx = -Math.abs(p.vx); }
          if (p.by < 0) { p.by = 0; p.vy = Math.abs(p.vy); }
          else if (p.by > h) { p.by = h; p.vy = -Math.abs(p.vy); }

          // 2) delikatne odepchnięcie od kursora -> cel przesunięcia
          let tox = 0;
          let toy = 0;
          if (mouse.active) {
            const dx = p.bx - mouse.x;
            const dy = p.by - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_DIST && dist > 0.001) {
              const strength = (1 - dist / MOUSE_DIST) * MAX_PUSH;
              tox = (dx / dist) * strength;
              toy = (dy / dist) * strength;
            }
          }
          // sprężysty, szybki powrót do pozycji wyjściowej
          p.ox += (tox - p.ox) * RETURN;
          p.oy += (toy - p.oy) * RETURN;

          p.twinkle += 0.02;
        }

        // linie między węzłami (po pozycjach renderowanych)
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          const ax = a.bx + a.ox;
          const ay = a.by + a.oy;
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const bx = b.bx + b.ox;
            const by = b.by + b.oy;
            const dx = ax - bx;
            const dy = ay - by;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK_DIST * LINK_DIST) {
              const dist = Math.sqrt(d2);
              const o = (1 - dist / LINK_DIST) * 0.22;
              ctx.strokeStyle = `rgba(150, 160, 235, ${o})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
              ctx.stroke();
            }
          }
        }

        // węzły
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const alpha = 0.5 + Math.sin(p.twinkle) * 0.3;
          ctx.beginPath();
          ctx.arc(p.bx + p.ox, p.by + p.oy, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(195, 215, 255, ${alpha})`;
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(draw);
      };

      const handleMove = (e: MouseEvent): void => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
      };
      const handleLeave = (): void => {
        mouseRef.current.active = false;
      };

      // Po powrocie do karty (odminimalizowanie / przełączenie zakładki) rAF był
      // uśpiony — wymuszamy ponowny pomiar i restart pętli, żeby tło ożyło.
      const handleVisibility = (): void => {
        if (document.visibilityState === 'visible') {
          resize();
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }
      };

      resize();
      rafRef.current = requestAnimationFrame(draw);
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseout', handleLeave);
      document.addEventListener('visibilitychange', handleVisibility);

      // ResizeObserver łapie zmiany rozmiaru kontenera, których nie zgłasza
      // zdarzenie 'resize' okna (np. full-width w SharePoint, zmiana layoutu).
      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
        ro = new ResizeObserver(() => resize());
        ro.observe(canvas.parentElement);
      }

      return () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseout', handleLeave);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (ro) ro.disconnect();
      };
    }, [intensity]);

    return (
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgGradient} />
        <div className={styles.bgGlow} />
        <canvas ref={canvasRef} className={styles.bgCanvas} />
      </div>
    );
  }
);

ConstellationBackground.displayName = 'ConstellationBackground';

export default ConstellationBackground;

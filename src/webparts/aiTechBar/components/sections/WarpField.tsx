import * as React from 'react';

// =============================================================================
// WarpField — pole cząsteczek „hyperspace" spójne z tłem konstelacji.
// mode 'in'  : cząsteczki zlatują z zewnątrz do punktu origin i wygasają,
//              gdy panel się „formuje".
// mode 'out' : cząsteczki rozsypują się z origin na zewnątrz (implozja → rozpad).
// Animacja sterowana własną pętlą rAF; po czasie durationMs woła onComplete.
// =============================================================================

export interface IWarpFieldProps {
  mode: 'in' | 'out';
  origin?: { x: number; y: number };
  durationMs: number;
  onComplete: () => void;
}

interface IParticle {
  angle: number;
  rest: number;   // promień spoczynkowy (rozrzut po ekranie)
  depth: number;  // 0.4..1 — parallax (bliżej = szybciej/dłuższa smuga)
  colorT: number; // 0..1 — fiolet → cyan
}

const COUNT = 170;
const FROM = [139, 92, 246]; // #8b5cf6
const TO = [34, 211, 238];   // #22d3ee

const easeOutExpo = (p: number): number => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const easeInExpo = (p: number): number => (p <= 0 ? 0 : Math.pow(2, 10 * (p - 1)));
const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const WarpField: React.FC<IWarpFieldProps> = ({ mode, origin, durationMs, onComplete }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const doneRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const reduced = typeof window !== 'undefined' && !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (reduced || !canvas || typeof window === 'undefined') {
      const id = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(id);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) { onComplete(); return undefined; }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = (): void => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ox = origin ? origin.x : w / 2;
    const oy = origin ? origin.y : h * 0.55;
    const maxDim = Math.hypot(w, h);
    const FAR = maxDim * 0.95;
    const STREAK = maxDim * 0.16;

    const particles: IParticle[] = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        rest: Math.pow(Math.random(), 0.7) * maxDim * 0.55,
        depth: 0.4 + Math.random() * 0.6,
        colorT: Math.random()
      });
    }

    let raf = 0;
    const start = performance.now();
    const isIn = mode === 'in';

    const frame = (now: number): void => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = isIn ? easeOutExpo(p) : easeInExpo(p);
      // pojawia się szybko, znika pod koniec — żeby odsłonić panel
      const fieldAlpha = smoothstep(0, 0.14, p) * (1 - smoothstep(0.74, 1, p));

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const dx = Math.cos(pt.angle);
        const dy = Math.sin(pt.angle);
        const spread = isIn ? (1 - eased) : eased;
        const dist = pt.rest + spread * FAR * pt.depth;
        const px = ox + dx * dist;
        const py = oy + dy * dist;

        const speed = isIn ? (1 - eased) : eased;
        const len = speed * STREAK * pt.depth;
        // smuga wzdłuż promienia: 'in' ogon na zewnątrz, 'out' ogon do środka
        const tx = isIn ? px + dx * len : px - dx * len;
        const ty = isIn ? py + dy * len : py - dy * len;

        const r = Math.round(lerp(FROM[0], TO[0], pt.colorT));
        const g = Math.round(lerp(FROM[1], TO[1], pt.colorT));
        const b = Math.round(lerp(FROM[2], TO[2], pt.colorT));
        const a = fieldAlpha * (0.35 + 0.55 * pt.depth);

        if (len > 1.5) {
          const grad = ctx.createLinearGradient(px, py, tx, ty);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1 * pt.depth;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.2 * pt.depth, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      if (p >= 1) {
        if (!doneRef.current) { doneRef.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none' }}
    />
  );
};

export default WarpField;

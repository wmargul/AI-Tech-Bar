import * as React from 'react';
import styles from './AiTechBar.module.scss';

// =============================================================================
// Własny pasek przewijania.
//
// DLACZEGO nie natywny: `scrollbar-width` / `scrollbar-color` i webkitowe
// `::-webkit-scrollbar` dają trzy różne efekty w trzech silnikach. Chromium od
// 121 wręcz ignoruje pseudoelementy webkitowe, gdy ustawisz właściwości
// standardowe, a Firefox nie przyjmuje w `scrollbar-color` gradientu, tylko
// płaski kolor. Jedyny sposób na identyczny wygląd wszędzie to schować pasek
// systemowy (klasa .sbScroll) i narysować własny.
//
// Kontener, do którego celuje `targetRef`, musi mieć klasę .sbScroll, a rodzic
// paska — pozycjonowanie (position: relative) dla wariantu 'absolute'.
// =============================================================================

export interface IScrollBarProps {
  /** Element, który realnie się przewija. */
  targetRef: React.RefObject<HTMLElement>;
  /**
   * 'absolute' — pasek w pozycjonowanym panelu (nakładki).
   * 'fixed' — pasek przy krawędzi okna (scroller strony).
   */
  variant?: 'absolute' | 'fixed';
}

/** Minimalna wysokość uchwytu — przy bardzo długiej treści nie może zniknąć. */
const MIN_THUMB = 38;

const ScrollBar: React.FC<IScrollBarProps> = ({ targetRef, variant = 'absolute' }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ pointerY: number; scrollTop: number } | null>(null);
  const [visible, setVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    const el = targetRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return undefined;

    let raf = 0;

    const render = (): void => {
      const trackH = track.clientHeight;
      const overflow = el.scrollHeight - el.clientHeight;
      if (overflow <= 1 || trackH <= 0) { setVisible(false); return; }
      setVisible(true);

      const thumbH = Math.max(MIN_THUMB, Math.round(trackH * (el.clientHeight / el.scrollHeight)));
      const y = (el.scrollTop / overflow) * (trackH - thumbH);
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translateY(${Math.round(y)}px)`;
    };

    // Przewijanie potrafi odpalać się częściej niż klatki — liczymy raz na klatkę.
    const schedule = (): void => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; render(); });
    };

    render();
    el.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Treść nakładek zmienia wysokość (rozwijane FAQ, przełączanie zakładek),
    // więc samo nasłuchiwanie scrolla nie wystarczy.
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
      for (let i = 0; i < el.children.length; i++) ro.observe(el.children[i]);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (ro) ro.disconnect();
    };
  }, [targetRef]);

  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const el = targetRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    e.preventDefault();
    e.stopPropagation();
    thumb.setPointerCapture(e.pointerId);
    dragRef.current = { pointerY: e.clientY, scrollTop: el.scrollTop };
  };

  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    const el = targetRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!drag || !el || !track || !thumb) return;
    const span = track.clientHeight - thumb.offsetHeight;
    if (span <= 0) return;
    const overflow = el.scrollHeight - el.clientHeight;
    el.scrollTop = drag.scrollTop + ((e.clientY - drag.pointerY) / span) * overflow;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>): void => {
    dragRef.current = null;
    const thumb = thumbRef.current;
    if (thumb && thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
  };

  // Klik w wolną część toru przeskakuje tam, gdzie wskazano.
  const onTrackDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    const el = targetRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb || e.target !== track) return;
    const rect = track.getBoundingClientRect();
    const thumbH = thumb.offsetHeight;
    const span = rect.height - thumbH;
    if (span <= 0) return;
    const pos = Math.min(Math.max(e.clientY - rect.top - thumbH / 2, 0), span);
    el.scrollTop = (pos / span) * (el.scrollHeight - el.clientHeight);
  };

  return (
    <div
      ref={trackRef}
      className={variant === 'fixed' ? styles.sbTrackFixed : styles.sbTrack}
      data-visible={visible ? 'true' : 'false'}
      onMouseDown={onTrackDown}
      aria-hidden="true"
    >
      <div
        ref={thumbRef}
        className={styles.sbThumb}
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
};

export default ScrollBar;

import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { getGoalVideoClip } from '../data/goalVideoAssets';

// =============================================================================
// GoalVideo — realistyczna ilustracja wideo celu (bez ramki, bez dźwięku).
// Klip jest zaszyty w bundlu (base64) i ładowany LENIWIE z osobnego chunku,
// żeby nie powiększać głównego bundla web partu (patrz goalVideoAssets.ts).
// Odtwarzanie: wyciszone, zapętlone w kółko (playsInline). Do czasu załadowania
// klipu (lub gdy się nie da) nic nie renderujemy — kafelek pokazuje wtedy samo
// jednolite tło (bez żadnej warstwy SVG pod spodem).
// =============================================================================

export interface IGoalVideoProps {
  id: string;
}

const GoalVideo: React.FC<IGoalVideoProps> = ({ id }) => {
  const [src, setSrc] = React.useState<string | undefined>(undefined);
  const [failed, setFailed] = React.useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Leniwe pobranie klipu przy zmianie celu (chunk ładuje się raz).
  React.useEffect(() => {
    let alive = true;
    setSrc(undefined);
    setFailed(false);
    getGoalVideoClip(id)
      .then((url) => {
        if (!alive) return;
        if (url) setSrc(url); else setFailed(true);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [id]);

  // Start od pierwszej klatki, gdy klip jest gotowy.
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay bywa blokowany — klip jest tylko ozdobą */ });
      }
    } catch { /* ignore */ }
  }, [src]);

  if (!src || failed) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      className={styles.goalVideoEl}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
};

export default GoalVideo;

// =============================================================================
// Współdzielony odtwarzacz lektora PROMi. Klipy są zaszyte w bundlu (base64) i
// podawane jako lokalne `blob:` URL (patrz voiceAssets.ts) — dlatego NIE ma tu
// pobierania z sieci ani zależności od CDN. Używamy JEDNEGO trwałego <audio>,
// który odblokowujemy ciszą w geście użytkownika (klik otwierający scenę), bo
// inaczej przeglądarki blokują programowe `audio.play()` z useEffect.
// =============================================================================

// --- Diagnostyka (widoczna w web parcie) ------------------------------------
export const voiceLog: string[] = [];
function pad2(n: number): string { return (n < 10 ? '0' : '') + n; }
function log(msg: string): void {
  const t = new Date();
  voiceLog.push(`${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())} ${msg}`);
  while (voiceLog.length > 24) voiceLog.shift();
}

// Krótka cisza (AAC/MP4) zaszyta jako base64 — do odblokowania audio w geście.
const SILENCE_B64 =
  'AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAzJtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAA+gABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACXXRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAA+gAAAAAAAAAAAAAAAQEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAPoAAAQAAAEAAAAAAdVtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAH0AAAAjQFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAAGAbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAFEc3RibAAAAH5zdHNkAAAAAAAAAAEAAABubXA0YQAAAAAAAAABAAAAAAAAAAAAAQAQAAAAAH0AAAAAAAA2ZXNkcwAAAAADgICAJQABAASAgIAXQBUAAAAAAH0AAAAFpgWAgIAFEohW5QAGgICAAQIAAAAUYnRydAAAAAAAAH0AAAAFpgAAACBzdHRzAAAAAAAAAAIAAAAIAAAEAAAAAAEAAANAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAAJAAAAAQAAADhzdHN6AAAAAAAAAAAAAAAJAAAAEwAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAFHN0Y28AAAAAAAAAAQAAA14AAAAac2dwZAEAAAByb2xsAAAAAgAAAAH//wAAABxzYmdwAAAAAHJvbGwAAAABAAAACQAAAAEAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYwLjMuMTAwAAAACGZyZWUAAAA7bWRhdNwATGF2YzYwLjMuMTAwAAIwQA4BGCAHARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBw==';

let silenceUrl: string | undefined;
function getSilenceUrl(): string {
  if (!silenceUrl) {
    const bin = atob(SILENCE_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    silenceUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/mp4' }));
  }
  return silenceUrl;
}

let el: HTMLAudioElement | undefined;

function getEl(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = 'auto';
    (el as unknown as { playsInline?: boolean }).playsInline = true;
  }
  return el;
}

/** Odblokowanie audio — wołać SYNCHRONICZNIE w geście użytkownika (np. onClick). */
export function unlockAudio(): void {
  const a = getEl();
  try {
    a.muted = false;
    a.volume = 1;
    a.src = getSilenceUrl();
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { log('unlock: OK'); try { a.pause(); } catch { /* noop */ } try { a.currentTime = 0; } catch { /* noop */ } })
       .catch((e: { name?: string }) => { log(`unlock: catch ${e && e.name}`); });
    } else {
      log('unlock: play() bez Promise');
    }
  } catch (e) { log(`unlock: throw ${String(e)}`); }
}

export interface IPlayHandle { stop: () => void; }

/**
 * Odtwarza klip (lokalny blob: URL). `onEnd` po zakończeniu; `onBlocked` gdy
 * autoplay zablokował start (NotAllowedError) — ponawiamy przy najbliższym
 * geście; `onError` przy realnym błędzie dekodowania — wtedy fallback Web Speech.
 */
export function playClip(
  url: string,
  onEnd: () => void,
  onBlocked: () => void,
  onError: () => void
): IPlayHandle {
  const a = getEl();
  a.onended = null;
  a.onerror = null;
  a.muted = false;
  a.volume = 1;
  a.src = String(url);
  log(`play: ${String(url).slice(0, 12)}…`);
  try { a.currentTime = 0; } catch { /* noop */ }

  const clear = (): void => { a.onended = null; a.onerror = null; };
  a.onended = () => { clear(); log('play: ended'); onEnd(); };
  a.onerror = () => {
    clear();
    const code = a.error ? a.error.code : '?';
    log(`play: ERROR media code=${code}`);
    onError();
  };

  const p = a.play();
  if (p && typeof p.then === 'function') {
    p.then(() => { log('play: PLAYING'); }).catch((err: { name?: string }) => {
      clear();
      log(`play: catch ${err && err.name}`);
      if (err && err.name === 'NotAllowedError') onBlocked();
      else onError();
    });
  } else {
    log('play: play() bez Promise');
  }
  return { stop: () => { clear(); try { a.pause(); } catch { /* noop */ } } };
}

export function stopClip(): void {
  if (!el) return;
  el.onended = null;
  el.onerror = null;
  try { el.pause(); } catch { /* noop */ }
}

// =============================================================================
// Pregenerowany lektor PROMi (neuronowy TTS Piper) — stały głos niezależny od
// systemu i przeglądarki. Klipy są ZASZYTE W BUNDLU jako base64 (voiceData.ts)
// i odtwarzane z lokalnego `blob:` URL.
//
// Dlaczego nie pliki .mp4 z CDN? Office 365 Public CDN serwujący assety SPFx
// ma whitelistę rozszerzeń (png/svg/js…), a .mp4/audio jest blokowane — stąd
// `NotSupportedError` / `Failed to fetch` na wdrożonej stronie. Bajty w bundlu
// + `URL.createObjectURL(Blob)` omijają whitelistę, CORS i problem Content-Type.
// =============================================================================

import { VOICE_B64 } from './voiceData';

const urlCache: { [key: string]: string } = {};

function b64ToBlobUrl(b64: string, mime: string): string {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

/** Zwraca lokalny blob: URL klipu lektora dla (język, widok) albo undefined. */
export function getVoiceClip(lang: string, view: string): string | undefined {
  const key = `${lang}_${view}`;
  const b64 = VOICE_B64[key];
  if (!b64) return undefined;
  if (!urlCache[key]) urlCache[key] = b64ToBlobUrl(b64, 'audio/mp4');
  return urlCache[key];
}

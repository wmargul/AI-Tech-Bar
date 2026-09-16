// =============================================================================
// Klipy celów — ładowane LENIWIE (osobny chunk), a nie w głównym bundlu.
//
// DLACZEGO: base64 6 klipów to ~5 MB, co powiększało główny bundel web partu do
// ~7,8 MB. Tak duży, synchroniczny plik JS wywalał całą stronę SharePoint
// ("Something went wrong"). Dynamiczny import() sprawia, że webpack wydziela
// dane klipów do osobnego pliku .js, ładowanego dopiero gdy sekcja Cel ich
// potrzebuje — główny bundel wraca do rozmiaru sprzed wideo.
//
// Sposób dostarczania nadal omija whitelistę rozszerzeń Office 365 Public CDN
// (blokuje .mp4): bajty w JS -> URL.createObjectURL(Blob). Klipy są bez audio.
// =============================================================================

const urlCache: { [id: string]: string } = {};
let b64Map: { [id: string]: string } | undefined;
let loadPromise: Promise<void> | undefined;

function ensureLoaded(): Promise<void> {
  if (b64Map) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = import(/* webpackChunkName: "goal-videos" */ './goalVideoData')
      .then((mod) => { b64Map = mod.GOAL_VIDEO_B64; });
  }
  return loadPromise;
}

function b64ToBlobUrl(b64: string, mime: string): string {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

/** Ładuje (leniwie) i zwraca lokalny blob: URL klipu dla danego celu. */
export async function getGoalVideoClip(goalId: string): Promise<string | undefined> {
  await ensureLoaded();
  const b64 = b64Map ? b64Map[goalId] : undefined;
  if (!b64) return undefined;
  if (!urlCache[goalId]) urlCache[goalId] = b64ToBlobUrl(b64, 'video/mp4');
  return urlCache[goalId];
}

/** Opcjonalny prefetch chunku z klipami (np. gdy sekcja Cel staje się aktywna). */
export function preloadGoalVideos(): void {
  ensureLoaded().catch(() => { /* ignore — chunk dociągnie się przy pierwszym użyciu */ });
}

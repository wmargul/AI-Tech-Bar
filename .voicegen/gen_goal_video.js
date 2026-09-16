/* eslint-disable */
// =============================================================================
// Generator klipów celów -> base64 w bundlu (jak lektor PROMi).
//
// CO ROBI:
//   1) bierze oryginały z .voicegen/video-src/<id>.mp4,
//   2) USUWA audio i kompresuje (860 px szer., 24 fps, H.264 CRF 27) do
//      .voicegen/video-min/<id>.mp4,
//   3) zaszywa skompresowane klipy jako base64 w goalVideoData.ts.
//
// DLACZEGO base64, a nie plik .mp4 z CDN?
//   Office 365 Public CDN (assety SPFx) ma whitelistę rozszerzeń i BLOKUJE .mp4.
//   Bajty w bundlu + URL.createObjectURL(Blob) omijają whitelistę i Content-Type.
//   (Klipy nie mają dźwięku — sekcja Cel jest cicha.)
//
// UŻYCIE:  npm run video:goals   (albo: node .voicegen/gen_goal_video.js)
// =============================================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const SRC = path.join(__dirname, 'video-src');
const MIN = path.join(__dirname, 'video-min');
const OUT = path.join(__dirname, '..', 'src/webparts/aiTechBar/components/data/goalVideoData.ts');

const IDS = [
  'goal-write',
  'goal-design',
  'goal-transcribe',
  'goal-meetings',
  'goal-data',
  'goal-code'
];

fs.mkdirSync(MIN, { recursive: true });

const entries = [];
let total = 0;
for (const id of IDS) {
  const inp = path.join(SRC, `${id}.mp4`);
  if (!fs.existsSync(inp)) { console.warn(`- pomijam ${id}: brak ${inp}`); continue; }
  const outp = path.join(MIN, `${id}.mp4`);
  // -an = bez audio; skala 1280 px (parzysta wys.); 24 fps; H.264 CRF 27.
  // Klip wypełnia cały kafelek — 1280 px trzyma ostrość, CRF 27 odchudza bundel.
  execFileSync(ffmpeg, [
    '-y', '-i', inp,
    '-an',
    '-vf', 'scale=1280:-2,fps=24',
    '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    outp
  ], { stdio: 'ignore' });

  const b64 = fs.readFileSync(outp).toString('base64');
  total += b64.length;
  entries.push(`  '${id}': '${b64}'`);
  console.log(`+ ${id}: ${(fs.statSync(outp).size / 1024).toFixed(0)} kB mp4 -> ${(b64.length / 1024).toFixed(0)} kB base64`);
}

const header = `// AUTOGENEROWANE przez .voicegen/gen_goal_video.js — nie edytuj ręcznie.
// Klipy celów (MP4, bez audio) zaszyte jako base64 i odtwarzane z blob: URL,
// żeby ominąć whitelistę rozszerzeń Office 365 Public CDN (blokuje .mp4).
/* eslint-disable */
export const GOAL_VIDEO_B64: { [id: string]: string } = {
`;

fs.writeFileSync(OUT, header + entries.join(',\n') + '\n};\n', 'utf8');
console.log(`\nZapisano ${OUT} (${(total / 1024).toFixed(0)} kB base64 łącznie).`);

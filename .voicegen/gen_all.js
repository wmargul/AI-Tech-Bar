#!/usr/bin/env node
/* eslint-disable */
// =============================================================================
// Generator lektora PROMi -> wstawia klipy (base64 AAC/MP4) do voiceData.ts.
//
//   PL  = edge-tts, głos pl-PL-ZofiaNeural  (USŁUGA ONLINE — wymaga internetu)
//   EN  = Piper, model en_US-amy-medium     (OFFLINE — działa bez sieci)
//
// Tekst pochodzi z .voicegen/voiceLines.json (lustro promptyDialogue.ts).
// Format wyjściowy: AAC w MP4, 32 kHz, mono, ~48 kbps (jak istniejące klipy).
//
// Użycie:
//   node .voicegen/gen_all.js all   # PL (online) + EN (offline)
//   node .voicegen/gen_all.js en    # tylko EN (offline)
//   node .voicegen/gen_all.js pl    # tylko PL (online)
// Zmienne: PROMI_PL_VOICE (domyślnie pl-PL-ZofiaNeural).
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(__dirname, 'regen');
const VOICE_DATA = path.join(ROOT, 'src/webparts/aiTechBar/components/data/voiceData.ts');
const LINES = require('./voiceLines.json');

const FFMPEG = path.join(ROOT, 'node_modules/ffmpeg-static/ffmpeg');
const EDGE = fs.existsSync(path.join(__dirname, 'venv/bin/edge-tts'))
  ? path.join(__dirname, 'venv/bin/edge-tts')
  : null;
const PY = path.join(__dirname, 'venv/bin/python');
const PIPER = path.join(__dirname, 'venv/bin/piper');
const AMY = path.join(__dirname, 'models/en_US-amy-medium.onnx');
const AMY_CFG = AMY + '.json';
const GOSIA = path.join(__dirname, 'models/pl_PL-gosia-medium.onnx');
const GOSIA_CFG = GOSIA + '.json';
const PL_VOICE = process.env.PROMI_PL_VOICE || 'pl-PL-ZofiaNeural';
// PROMI_PL_ENGINE=piper -> generuj PL offline głosem gosia (bez sieci, awaryjnie).
const PL_ENGINE = (process.env.PROMI_PL_ENGINE || 'edge').toLowerCase();

const VIEWS = ['greeting', 'recap', 'goodbye', 'what', 'contains', 'start3', 'best', 'responsible'];

function spoken(lines, lang) {
  let t = lines.join(' ');
  t = t.replace(/[\u2014\u2013]/g, ', '); // myślniki -> przecinek (pauza)
  if (lang === 'pl') {
    t = t.replace(/PROMi/g, 'Promi'); // czytaj jak imię, nie literuj
    // „prompt" jest anglicyzowane (Zofia: „prampt"). Zapis „prąpt" czyta się po
    // polsku jak [prompt] (ą przed p -> „om"), więc wymowa jest poprawna.
    t = t.replace(/([Pp])rompt/g, '$1rąpt');
    // „AI" ma brzmieć z angielska „ej-aj" (a nie po polsku „a-i").
    t = t.replace(/\bAI\b/g, 'ej aj');
  }
  return t.replace(/\s*,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
}

function toMp4(srcAudio, outMp4) {
  execFileSync(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', srcAudio,
    '-c:a', 'aac', '-b:a', '48k', '-ar', '32000', '-ac', '1',
    '-movflags', '+faststart', outMp4
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
}

function genPl(view, text) {
  const mp4 = path.join(TMP, `pl_${view}.mp4`);
  if (PL_ENGINE === 'piper') {
    const wav = path.join(TMP, `pl_${view}.wav`);
    execFileSync(PIPER, ['-m', GOSIA, '-c', GOSIA_CFG, '-f', wav],
      { input: text, stdio: ['pipe', 'inherit', 'inherit'] });
    if (!fs.existsSync(wav) || fs.statSync(wav).size === 0) {
      throw new Error(`piper nie wygenerował pl_${view}`);
    }
    toMp4(wav, mp4);
    return mp4;
  }
  const mp3 = path.join(TMP, `pl_${view}.mp3`);
  if (EDGE) {
    execFileSync(EDGE, ['--voice', PL_VOICE, '--text', text, '--write-media', mp3],
      { stdio: ['ignore', 'inherit', 'inherit'] });
  } else {
    execFileSync(PY, ['-m', 'edge_tts', '--voice', PL_VOICE, '--text', text, '--write-media', mp3],
      { stdio: ['ignore', 'inherit', 'inherit'] });
  }
  if (!fs.existsSync(mp3) || fs.statSync(mp3).size === 0) {
    throw new Error(`edge-tts nie wygenerował pl_${view} (sieć? głos?)`);
  }
  toMp4(mp3, mp4);
  return mp4;
}

function genEn(view, text) {
  const wav = path.join(TMP, `en_${view}.wav`);
  const mp4 = path.join(TMP, `en_${view}.mp4`);
  execFileSync(PIPER, ['-m', AMY, '-c', AMY_CFG, '-f', wav],
    { input: text, stdio: ['pipe', 'inherit', 'inherit'] });
  if (!fs.existsSync(wav) || fs.statSync(wav).size === 0) {
    throw new Error(`piper nie wygenerował en_${view}`);
  }
  toMp4(wav, mp4);
  return mp4;
}

function updateVoiceData(updates) {
  let src = fs.readFileSync(VOICE_DATA, 'utf8');
  for (const key of Object.keys(updates)) {
    const b64 = fs.readFileSync(updates[key]).toString('base64');
    const re = new RegExp(`('${key}':\\s*')[^']*(')`);
    if (re.test(src)) {
      src = src.replace(re, `$1${b64}$2`);
    } else {
      // wstaw nowy klucz tuż po otwarciu mapy
      src = src.replace(/(VOICE_B64[^=]*=\s*\{\s*\n)/, `$1  '${key}': '${b64}',\n`);
    }
    console.log(`  ${key}: ${b64.length} znaków base64`);
  }
  fs.writeFileSync(VOICE_DATA, src);
}

function main() {
  const arg = (process.argv[2] || 'all').toLowerCase();
  const langs = arg === 'pl' ? ['pl'] : arg === 'en' ? ['en'] : ['pl', 'en'];
  fs.mkdirSync(TMP, { recursive: true });
  const updates = {};
  for (const lang of langs) {
    const plLabel = PL_ENGINE === 'piper' ? 'pl_PL-gosia / Piper offline' : PL_VOICE + ' / edge-tts online';
    console.log(`\n=== ${lang.toUpperCase()} (${lang === 'pl' ? plLabel : 'en_US-amy / Piper offline'}) ===`);
    for (const view of VIEWS) {
      const lines = LINES[lang] && LINES[lang][view];
      if (!lines) { console.warn(`  POMIJAM ${lang}_${view} (brak w voiceLines.json)`); continue; }
      const text = spoken(lines, lang);
      console.log(`- ${lang}_${view}: "${text.slice(0, 70)}${text.length > 70 ? '…' : ''}"`);
      const mp4 = lang === 'pl' ? genPl(view, text) : genEn(view, text);
      updates[`${lang}_${view}`] = mp4;
    }
  }
  console.log('\nWstawiam do voiceData.ts:');
  updateVoiceData(updates);
  console.log('\nGotowe. Pamiętaj: npm run build (albo użyj npm run fix-voice).');
}

main();

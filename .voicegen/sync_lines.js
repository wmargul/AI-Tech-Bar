#!/usr/bin/env node
/* eslint-disable */
// =============================================================================
// Przepisuje kwestie z promptyDialogue.ts do voiceLines.json.
//
// DLACZEGO: lustro było utrzymywane ręcznie, więc łatwo je było przeoczyć przy
// zmianie tekstu — a wtedy lektor mówi co innego, niż widać na ekranie. Teraz
// plik powstaje ze źródła, a test promptyDialogue.test.ts pilnuje zgodności.
//
// Czyta skompilowane lib-commonjs, więc najpierw `npx heft build`.
//
// Użycie: node .voicegen/sync_lines.js
// =============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIALOGUE = path.join(ROOT, 'lib-commonjs/webparts/aiTechBar/components/data/promptyDialogue.js');
const OUT = path.join(__dirname, 'voiceLines.json');

if (!fs.existsSync(DIALOGUE)) {
  console.error('Brak ' + DIALOGUE + ' — odpal najpierw `npx heft build`.');
  process.exit(1);
}

const { PROMPTY_SCRIPT } = require(DIALOGUE);

const out = {
  _comment: 'GENEROWANE z promptyDialogue.ts przez .voicegen/sync_lines.js — nie edytuj ręcznie.'
};

for (const lang of Object.keys(PROMPTY_SCRIPT)) {
  const s = PROMPTY_SCRIPT[lang];
  const views = { greeting: s.greetingLines, goodbye: s.goodbyeLines };
  s.topics.forEach((t) => { views[t.id] = t.lines; });
  out[lang] = views;
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log('Zapisano ' + path.relative(ROOT, OUT));
for (const lang of Object.keys(PROMPTY_SCRIPT)) {
  console.log('  ' + lang + ': ' + Object.keys(out[lang]).join(', '));
}

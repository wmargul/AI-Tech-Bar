import { PROMPTY_SCRIPT, plainLine } from './promptyDialogue';
import { VOICE_B64 } from './voiceData';

// =============================================================================
// Pilnuje, żeby PROMi mówił dokładnie to, co widać na ekranie.
//
// Kwestie żyją w promptyDialogue.ts, lektor powstaje z .voicegen/
// voiceLines.json, a gotowe klipy leżą w voiceData.ts. Mirror jest teraz
// GENEROWANY ze źródła (`npm run voice:sync`), więc nie da się go już rozjechać
// ręcznie; tutaj sprawdzamy to, co zostaje: czy każda kwestia ma nagranie i czy
// do lektora nie przeciekają znaczniki formatowania.
//
// Po zmianie tekstu: `npm run voice:sync`, potem
// `node .voicegen/gen_all.js all <zmienione kwestie>`.
// =============================================================================

const LANGS = ['pl', 'en'];

/** Kwestie wg widoków, tak jak składa je komponent rozmowy. */
const viewsOf = (lang: string): { [view: string]: string[] } => {
  const script = PROMPTY_SCRIPT[lang as 'pl' | 'en'];
  const views: { [view: string]: string[] } = {
    greeting: script.greetingLines,
    goodbye: script.goodbyeLines
  };
  script.topics.forEach((t) => { views[t.id] = t.lines; });
  return views;
};

describe('PROMi — tekst i lektor', () => {
  LANGS.forEach((lang) => {
    it(`${lang}: każda kwestia ma nagrany klip i nie ma klipów osieroconych`, () => {
      const views = Object.keys(viewsOf(lang));
      const clips = Object.keys(VOICE_B64)
        .filter((k) => k.indexOf(`${lang}_`) === 0)
        .map((k) => k.slice(lang.length + 1));
      expect(clips.sort()).toEqual(views.sort());
    });
  });

  it('plainLine zdejmuje punktor, pogrubienie i złamanie wiersza', () => {
    expect(plainLine('- **Kontekst:** Wprowadź w temat.')).toBe('Kontekst: Wprowadź w temat.');
    expect(plainLine('- **Co chcę osiągnąć?**\nJasno zdefiniuj zadanie.'))
      .toBe('Co chcę osiągnąć? Jasno zdefiniuj zadanie.');
    expect(plainLine('Zwykłe zdanie bez znaczników.')).toBe('Zwykłe zdanie bez znaczników.');
  });

  it('w tekście dla lektora nie zostają żadne znaczniki formatowania', () => {
    LANGS.forEach((lang) => {
      const views = viewsOf(lang);
      Object.keys(views).forEach((view) => {
        views[view].forEach((line) => {
          const spoken = plainLine(line);
          expect(spoken).not.toContain('**');
          expect(spoken).not.toContain('\n');
          expect(spoken.indexOf('- ')).not.toBe(0);
        });
      });
    });
  });

  it('uwagi z przeglądu 17.09: usunięte i przeniesione zdania', () => {
    const pl = viewsOf('pl');
    // „Potraktuj prompt jak polecenie egzaminacyjne" — wycięte.
    expect(pl.contains.join(' ')).not.toContain('egzaminacyjne');
    expect(pl.contains[1]).toBe('Dobra instrukcja zawiera cztery podstawowe elementy:');
    // Zdanie wprowadzające przeniesione na samą górę i przepisane.
    expect(pl.best[0]).toContain('Oto kilka prostych sposobów i trików');
    expect(pl.best.join(' ')).not.toContain('Mam dla Ciebie kilka sprawdzonych technik');
  });
});

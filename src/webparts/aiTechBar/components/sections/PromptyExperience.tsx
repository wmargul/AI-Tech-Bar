import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import styles from '../AiTechBar.module.scss';
import { useL10n } from '../i18n';
import WarpField from './WarpField';
import ConstellationBackground from '../background/ConstellationBackground';
import PromptyAvatar, { AvatarMood } from './PromptyAvatar';
import { PROMPTY_SCRIPT, IPromptyTopic, plainLine } from '../data/promptyDialogue';
import { getVoiceClip } from '../data/voiceAssets';
import { playClip, stopClip, IPlayHandle } from '../data/voicePlayer';

export interface IPromptyExperienceProps {
  open: boolean;
  onClose: () => void;
  origin?: { x: number; y: number };
}

const WARP_IN_MS = 1500;
const WARP_OUT_MS = 1500;
const TYPE_SPEED_MS = 18;

// Widoki rozmowy: powitanie (1. wejście), id tematu, lub pożegnanie.
type View = 'greeting' | 'goodbye' | string;

interface IOption {
  id: string;
  label: string;
  action: 'topic' | 'exit';
  to?: string;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Formatowanie kwestii ----------------------------------------------------
// Zapis z promptyDialogue.ts („- " punktor, **pogrubienie**, \n złamanie) jest
// rozbijany na segmenty. Maszyna do pisania odsłania ZNAKI TEKSTU, a nie
// surową linię — inaczej w trakcie pisania mignęłyby same gwiazdki i myślniki.

interface ISegment { text: string; bold: boolean; start: number }
interface IBlock { bullet: boolean; rows: ISegment[][]; start: number; end: number }

const buildBlocks = (lines: string[]): { blocks: IBlock[]; length: number } => {
  let offset = 0;
  const blocks = lines.map((line): IBlock => {
    const bullet = line.indexOf('- ') === 0;
    const start = offset;
    const rows = (bullet ? line.slice(2) : line).split('\n').map((row) =>
      row.split('**')
        .map((part, i): ISegment => {
          const seg = { text: part, bold: i % 2 === 1, start: offset };
          offset += part.length;
          return seg;
        })
        .filter((seg) => seg.text.length > 0)
    );
    return { bullet, rows, start, end: offset };
  });
  return { blocks, length: offset };
};

const PromptyExperience: React.FC<IPromptyExperienceProps> = ({ open, onClose, origin }) => {
  const { lang } = useL10n();
  const script = PROMPTY_SCRIPT[lang];

  const rootRef = React.useRef<HTMLDivElement>(null);
  const bgsRef = React.useRef<HTMLDivElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const noticeRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const soundBtnRef = React.useRef<HTMLButtonElement>(null);
  const closingRef = React.useRef<boolean>(false);

  const [phase, setPhase] = React.useState<'in' | 'shown' | 'out'>('in');

  const [view, setView] = React.useState<View>('greeting');
  const topic: IPromptyTopic | undefined = script.topics.filter((tp) => tp.id === view)[0];
  const isGoodbye = view === 'goodbye';

  // Kwestie aktualnego widoku.
  const lines: string[] =
    view === 'greeting' ? script.greetingLines :
    view === 'goodbye' ? script.goodbyeLines :
    topic ? topic.lines : script.greetingLines;

  // Wszystkie pytania są widoczne przez cały czas — także to, które właśnie
  // słuchamy (wyróżnione jako aktywne). Dzięki temu nie trzeba nigdzie wracać
  // i nie ma osobnego kroku z pełnym menu.
  const options: IOption[] = React.useMemo(() => {
    if (view === 'goodbye') return [];
    const opts: IOption[] = script.topics.map((tp) => ({
      id: tp.id, label: tp.question, action: 'topic', to: tp.id
    }));
    opts.push({ id: 'exit', label: script.exitLabel, action: 'exit' });
    return opts;
  }, [view, script]);

  // Ile ZNAKÓW treści jest już odsłoniętych (bez znaczników formatowania).
  const [revealed, setRevealed] = React.useState<number>(0);
  // Ponowne kliknięcie aktywnego pytania odtwarza kwestię od nowa.
  const [replay, setReplay] = React.useState<number>(0);
  const [done, setDone] = React.useState<boolean>(false);
  const [speaking, setSpeaking] = React.useState<boolean>(false);
  const [soundOn, setSoundOn] = React.useState<boolean>(true);
  const [showNotice, setShowNotice] = React.useState<boolean>(false);
  const [greetingWave, setGreetingWave] = React.useState<boolean>(false);
  const [goodbyeSpoken, setGoodbyeSpoken] = React.useState<boolean>(false);

  const { blocks, length: textLength } = React.useMemo(() => buildBlocks(lines), [lines]);
  const lengthRef = React.useRef<number>(textLength);
  lengthRef.current = textLength;

  // Tekst dla lektora i fallbacku Web Speech — bez znaczników.
  const spokenText = React.useMemo(() => lines.map(plainLine).join(' '), [lines]);
  const spokenRef = React.useRef<string>(spokenText);
  spokenRef.current = spokenText;

  const typeTimer = React.useRef<number>(0);
  const noticeTimer = React.useRef<number>(0);
  const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);
  const keepAlive = React.useRef<number>(0);
  const playHandleRef = React.useRef<IPlayHandle | null>(null);
  const retryRef = React.useRef<(() => void) | null>(null);

  const mood: AvatarMood = isGoodbye ? 'bye' : (!done || speaking ? 'talking' : 'idle');

  // Powitalne pomachanie po pojawieniu się sceny (tylko pierwsze wejście / greeting).
  React.useEffect(() => {
    if (phase !== 'shown' || view !== 'greeting') return undefined;
    setGreetingWave(true);
    const id = window.setTimeout(() => setGreetingWave(false), 2900);
    return () => window.clearTimeout(id);
  }, [phase, view]);

  // --- Synteza mowy -----------------------------------------------------------
  const cancelSpeech = React.useCallback((): void => {
    window.clearInterval(keepAlive.current);
    retryRef.current = null;
    if (playHandleRef.current) { playHandleRef.current.stop(); playHandleRef.current = null; }
    stopClip();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const pickVoice = React.useCallback((): SpeechSynthesisVoice | undefined => {
    const synth = window.speechSynthesis;
    const live = synth.getVoices();
    if (live.length) voicesRef.current = live;
    const list = voicesRef.current;
    if (!list.length) return undefined;

    const prefix = script.voiceLang.slice(0, 2).toLowerCase();
    const langMatch = list.filter((v) => v.lang.toLowerCase().indexOf(prefix) === 0);
    const byName = (v: SpeechSynthesisVoice, want: string): boolean =>
      v.name.toLowerCase().indexOf(want.toLowerCase()) >= 0;
    const isRemote = (v: SpeechSynthesisVoice): boolean =>
      v.localService === false || v.name.toLowerCase().indexOf('google') >= 0;

    // Chrome/Chromium na macOS: głosy sieciowe („Google") są ciche (błąd Chromium) —
    // trzeba użyć głosu lokalnego. Safari i Chrome na Windows działają normalnie.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMac = /Mac/i.test(typeof navigator !== 'undefined' ? navigator.platform : '') || /Mac OS X/i.test(ua);
    const isChromium = /Chrome|Chromium|CriOS|Edg/i.test(ua);
    const preferLocal = isMac && isChromium;

    if (preferLocal) {
      // 1) preferowany głos, ale tylko lokalny (pomijamy „Google"/remote)
      for (let i = 0; i < script.preferredVoices.length; i++) {
        const hit = langMatch.filter((v) => byName(v, script.preferredVoices[i]) && !isRemote(v))[0];
        if (hit) return hit;
      }
      // 2) jakikolwiek lokalny głos w danym języku
      const local = langMatch.filter((v) => !isRemote(v))[0];
      if (local) return local;
      // 3) ostatecznie cokolwiek w języku (nawet remote)
      return langMatch[0];
    }

    // Pozostałe przeglądarki: preferowane (naturalne) głosy po nazwie, potem „Google".
    for (let i = 0; i < script.preferredVoices.length; i++) {
      const hit = list.filter((v) => byName(v, script.preferredVoices[i]))[0];
      if (hit) return hit;
    }
    const google = langMatch.filter((v) => v.name.toLowerCase().indexOf('google') >= 0)[0];
    if (google) return google;
    return langMatch[0];
  }, [script.preferredVoices, script.voiceLang]);

  // Mowa MUSI startować synchronicznie w obrębie gestu użytkownika —
  // inaczej Chrome blokuje odtwarzanie (Safari jest pobłażliwe).
  const speak = React.useCallback((text: string, onEnd?: () => void): void => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      if (onEnd) onEnd();
      return;
    }
    const synth = window.speechSynthesis;
    window.clearInterval(keepAlive.current);
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = script.voiceLang;
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.0;
    u.pitch = 1.0;
    const stop = (): void => { window.clearInterval(keepAlive.current); setSpeaking(false); };
    u.onstart = () => setSpeaking(true);
    u.onend = () => { stop(); if (onEnd) onEnd(); };
    u.onerror = () => { stop(); if (onEnd) onEnd(); };
    try { synth.resume(); } catch { /* noop */ }
    synth.speak(u);
    // Chrome wstrzymuje syntezę przy dłuższych kwestiach (~15 s) — utrzymujemy ją „przy życiu".
    keepAlive.current = window.setInterval(() => {
      if (!synth.speaking) { window.clearInterval(keepAlive.current); return; }
      try { synth.resume(); } catch { /* noop */ }
    }, 7000);
  }, [script.voiceLang, pickVoice]);

  // Lektor: najpierw pregenerowany, STAŁY głos (klip audio dla danego widoku) —
  // ten sam na każdym systemie i przeglądarce (działa też na Chrome/Mac).
  // Gdy klipu brak lub odtwarzanie zawiedzie — fallback na Web Speech.
  const say = React.useCallback((viewKey: string, text: string, onEnd?: () => void): void => {
    cancelSpeech();
    const clip = getVoiceClip(lang, viewKey);
    if (!clip) { speak(text, onEnd); return; }

    let done2 = false;
    const finish = (): void => { if (done2) return; done2 = true; setSpeaking(false); if (onEnd) onEnd(); };

    const start = (): void => {
      setSpeaking(true);
      playHandleRef.current = playClip(
        clip,
        () => finish(),
        // Zablokowane przez autoplay — spróbuj ponownie przy najbliższym geście.
        () => { setSpeaking(false); retryRef.current = start; },
        // Realny błąd (404/kodek) — awaryjnie Web Speech.
        () => { speak(text, onEnd); }
      );
    };
    retryRef.current = null;
    start();
  }, [lang, speak, cancelSpeech]);

  // Bezpiecznik: jeśli autoplay zablokował lektora, wznów go przy 1. geście.
  React.useEffect(() => {
    if (!open) return undefined;
    const onGesture = (): void => {
      if (retryRef.current) { const r = retryRef.current; retryRef.current = null; r(); }
    };
    const opts: AddEventListenerOptions = { capture: true };
    document.addEventListener('pointerdown', onGesture, opts);
    document.addEventListener('keydown', onGesture, opts);
    return () => {
      document.removeEventListener('pointerdown', onGesture, opts);
      document.removeEventListener('keydown', onGesture, opts);
    };
  }, [open]);

  // Załaduj listę głosów (asynchronicznie w części przeglądarek, m.in. Chrome).
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const load = (): void => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // --- Reset przy otwarciu ----------------------------------------------------
  React.useEffect(() => {
    if (!open) return;
    setPhase('in');
    setView('greeting');
    setRevealed(0);
    setReplay(0);
    setDone(false);
    setSpeaking(false);
    setSoundOn(true); // dźwięk domyślnie włączony
    setShowNotice(false);
    setGoodbyeSpoken(false);
    window.clearTimeout(noticeTimer.current);
    closingRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // --- Wejście: avatar wjeżdża, panel dialogu się odsłania (w trakcie warp) ----
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    if (prefersReducedMotion()) {
      setPhase('shown');
      return undefined;
    }

    const reveal = (WARP_IN_MS / 1000) * 0.5;
    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 0 });
      const tl = gsap.timeline();
      tl.to(root, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
      if (bgsRef.current) {
        tl.fromTo(bgsRef.current, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }, reveal);
      }
      if (avatarRef.current) {
        tl.fromTo(avatarRef.current,
          { x: 120, opacity: 0, filter: 'blur(8px)' },
          { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', clearProps: 'filter' },
          reveal + 0.05);
      }
      if (dialogRef.current) {
        tl.fromTo(dialogRef.current,
          { x: -40, opacity: 0, filter: 'blur(6px)' },
          { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', clearProps: 'filter' },
          reveal + 0.18);
      }
      if (closeBtnRef.current) {
        tl.fromTo(closeBtnRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, reveal + 0.3);
      }
      if (soundBtnRef.current) {
        tl.fromTo(soundBtnRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, reveal + 0.34);
      }
    }, root);

    return () => { ctx.revert(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Notka „włącz dźwięk" pojawia się TYLKO po wyciszeniu (patrz toggleSound),
  // z automatycznym ukryciem po 10 s.
  React.useLayoutEffect(() => {
    if (showNotice && noticeRef.current && !prefersReducedMotion()) {
      gsap.fromTo(noticeRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, [showNotice]);

  // --- Typewriter (po pokazaniu panelu i przy każdej zmianie widoku) -----------
  React.useEffect(() => {
    if (phase !== 'shown') return undefined;
    setRevealed(0);
    setDone(false);
    const total = lengthRef.current;
    let i = 0;
    window.clearInterval(typeTimer.current);
    typeTimer.current = window.setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= total) {
        window.clearInterval(typeTimer.current);
        setDone(true);
      }
    }, TYPE_SPEED_MS);
    return () => window.clearInterval(typeTimer.current);
  }, [view, phase, replay]);

  // --- Mowa: wypowiedz kwestię widoku, gdy dźwięk włączony ---------------------
  React.useEffect(() => {
    if (phase !== 'shown' || !soundOn) return undefined;
    if (isGoodbye) {
      setGoodbyeSpoken(false);
      say('goodbye', spokenRef.current, () => setGoodbyeSpoken(true));
    } else {
      say(view, spokenRef.current);
    }
    return () => cancelSpeech();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, phase, soundOn, replay]);

  const skipTyping = React.useCallback((): void => {
    window.clearInterval(typeTimer.current);
    setRevealed(lengthRef.current);
    setDone(true);
  }, []);

  // --- Zamknięcie (lustrzane wyjście warp + pożegnalny fade) -------------------
  const requestClose = React.useCallback((): void => {
    if (closingRef.current) return;
    cancelSpeech();
    if (prefersReducedMotion()) { onClose(); return; }
    closingRef.current = true;
    setShowNotice(false);
    window.clearTimeout(noticeTimer.current);
    setPhase('out');

    const root = rootRef.current;
    const tl = gsap.timeline({ onComplete: onClose });
    if (dialogRef.current) tl.to(dialogRef.current, { x: -40, opacity: 0, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in' }, 0);
    if (avatarRef.current) tl.to(avatarRef.current, { x: 120, opacity: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, 0.05);
    if (closeBtnRef.current) tl.to(closeBtnRef.current, { scale: 0.7, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
    if (soundBtnRef.current) tl.to(soundBtnRef.current, { scale: 0.7, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
    if (bgsRef.current) tl.to(bgsRef.current, { opacity: 0, scale: 1.06, duration: 0.55, ease: 'power2.in' }, 0.12);
    if (root) tl.to(root, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, (WARP_OUT_MS / 1000) * 0.62);
  }, [onClose, cancelSpeech]);

  // --- Wybór opcji dialogu ----------------------------------------------------
  const choose = React.useCallback((opt: IOption): void => {
    if (opt.action === 'exit') { setView('goodbye'); return; }
    if (!opt.to) return;
    // Kliknięcie w aktywne pytanie nie zmienia widoku, więc samo setView nic by
    // nie zrobiło — odtwarzamy kwestię jeszcze raz.
    if (view === opt.to) { setReplay((n) => n + 1); return; }
    setView(opt.to);
  }, [view]);

  // Wyjście przez X / Esc = identyczne jak „Wróć do Tech Baru": PROMi najpierw się
  // żegna (macha), a po dokończeniu kwestii doświadczenie samo się zwija.
  const requestExit = React.useCallback((): void => {
    if (closingRef.current) return;
    if (view === 'goodbye') { requestClose(); return; }
    setShowNotice(false);
    window.clearTimeout(noticeTimer.current);
    setView('goodbye');
  }, [view, requestClose]);

  // Po pożegnaniu — zwiń dopiero, gdy PROMi DOMÓWI całą kwestię (onend mowy),
  // a nie po stałym czasie (inaczej ucinało „…w AI Tech Bar"). Przy wyłączonym
  // dźwięku wystarczy dokończony tekst. Bezpiecznik na wypadek zablokowanej mowy.
  React.useEffect(() => {
    if (!isGoodbye || !done || phase !== 'shown') return undefined;
    if (soundOn && !goodbyeSpoken) {
      const safety = window.setTimeout(() => requestClose(), 9000);
      return () => window.clearTimeout(safety);
    }
    const delay = soundOn ? 600 : 1700;
    const id = window.setTimeout(() => requestClose(), delay);
    return () => window.clearTimeout(id);
  }, [isGoodbye, done, phase, soundOn, goodbyeSpoken, requestClose]);

  const showSoundNotice = React.useCallback((): void => {
    setShowNotice(true);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setShowNotice(false), 10000);
  }, []);

  const enableSound = React.useCallback((): void => {
    window.clearTimeout(noticeTimer.current);
    setShowNotice(false);
    setSoundOn(true);
    speak(spokenRef.current); // gest użytkownika → odblokowuje mowę (Chrome)
  }, [speak]);

  const toggleSound = React.useCallback((): void => {
    if (soundOn) {
      setSoundOn(false);
      cancelSpeech();
      showSoundNotice(); // popup pojawia się po wyłączeniu dźwięku
    } else {
      window.clearTimeout(noticeTimer.current);
      setShowNotice(false);
      setSoundOn(true);
      speak(spokenRef.current);
    }
  }, [soundOn, cancelSpeech, speak, showSoundNotice]);

  // Klawiatura: Escape zamyka.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { e.preventDefault(); requestExit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, requestExit]);

  // Blokada scrolla tła.
  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Zatrzymaj mowę przy odmontowaniu.
  React.useEffect(() => () => cancelSpeech(), [cancelSpeech]);

  if (!open || typeof document === 'undefined') return null;

  // Ostatni blok, w którym widać już jakiś tekst — tam stoi kursor.
  const caretBlock = blocks.filter((b) => revealed > b.start).length - 1;

  const overlay = (
    <div
      ref={rootRef}
      className={styles.peOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={script.name}
    >
      <div ref={bgsRef} className={styles.vtcBgs} aria-hidden="true">
        <ConstellationBackground intensity={0.9} />
        <div className={styles.vtcScrim} />
        <div className={styles.vtcGrain} />
      </div>

      {phase !== 'shown' && (
        <WarpField
          key={phase}
          mode={phase === 'out' ? 'out' : 'in'}
          origin={origin}
          durationMs={phase === 'out' ? WARP_OUT_MS : WARP_IN_MS}
          onComplete={phase === 'out' ? () => undefined : () => setPhase('shown')}
        />
      )}

      <button
        ref={soundBtnRef}
        type="button"
        className={`${styles.peSoundToggle} ${soundOn ? styles.peSoundOn : ''}`}
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? script.soundOnLabel : script.soundOffLabel}
        title={soundOn ? script.soundOnLabel : script.soundOffLabel}
      >
        {soundOn ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            <path d="M16.5 8.5a5 5 0 010 7M19 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            <path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <button
        ref={closeBtnRef}
        type="button"
        className={styles.vtcClose}
        onClick={requestExit}
        aria-label={script.role}
        title="Esc"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.peStage}>
        <div ref={dialogRef} className={styles.peDialog}>
          <div className={styles.peSpeech} onClick={!done ? skipTyping : undefined}>
            <div className={styles.peSpeechHead}>
              <span className={styles.peSpeechName}>{script.name}</span>
              <span className={styles.peSpeechRole}>{script.role}</span>
            </div>
            <div className={styles.peSpeechBody}>
              {blocks.map((block, bi) => {
                if (revealed <= block.start) return null;
                return (
                  <div
                    key={bi}
                    className={block.bullet ? styles.peSpeechBullet : styles.peSpeechText}
                  >
                    {block.bullet && <span className={styles.peBulletMark} aria-hidden="true" />}
                    <span className={styles.peBlockBody}>
                      {block.rows.map((row, ri) => {
                        const visible = row.filter((seg) => revealed > seg.start);
                        if (visible.length === 0) return null;
                        return (
                          <span key={ri} className={styles.peSpeechRow}>
                            {visible.map((seg, si) => {
                              const txt = seg.text.slice(0, revealed - seg.start);
                              return seg.bold
                                ? <strong key={si} className={styles.peStrong}>{txt}</strong>
                                : <React.Fragment key={si}>{txt}</React.Fragment>;
                            })}
                          </span>
                        );
                      })}
                      {!done && bi === caretBlock && <span className={styles.peCaret} />}
                    </span>
                  </div>
                );
              })}
            </div>
            {!done && <span className={styles.peSkipHint}>{script.skipHint}</span>}
          </div>

          <div className={styles.peOptions} data-ready={done ? 'true' : 'false'}>
            {options.length > 0 && <div className={styles.peChooseHint}>{script.chooseHint}</div>}
            {options.map((opt) => {
              const active = opt.action === 'topic' && opt.to === view;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.peOption} ${opt.action === 'exit' ? styles.peOptionExit : ''}`}
                  data-active={active ? 'true' : 'false'}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => choose(opt)}
                  disabled={!done}
                  tabIndex={done ? undefined : -1}
                >
                  <span className={styles.peOptionDot} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={avatarRef} className={styles.peAvatarWrap}>
          <PromptyAvatar mood={mood} greeting={greetingWave} className={styles.peAvatarSvg} />
          <div className={styles.peAvatarGlow} aria-hidden="true" />
        </div>
      </div>

      {showNotice && (
        <div ref={noticeRef} className={styles.peNotice} role="status">
          <span className={styles.peNoticeIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
              <path d="M16.5 8.5a5 5 0 010 7M19 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className={styles.peNoticeBody}>
            <span className={styles.peNoticeTitle}>{script.soundNoticeTitle}</span>
            <span className={styles.peNoticeText}>{script.soundNoticeText}</span>
          </span>
          <span className={styles.peNoticeActions}>
            <button type="button" className={styles.peNoticeBtn} onClick={enableSound}>{script.soundEnable}</button>
            <button type="button" className={styles.peNoticeGhost} onClick={() => setShowNotice(false)}>{script.soundDismiss}</button>
          </span>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
};

export default PromptyExperience;

// =============================================================================
// PROMPTY & TRIKI — scenariusz rozmowy z przewodnikiem AI (postać „PROMi").
// Baza wiedzy o promptingu. PL (oryginał) + EN (tłumaczenie).
// Model: lista tematów; UI buduje opcje dynamicznie, więc w trakcie rozmowy
// zawsze można przejść do dowolnego tematu (bez wracania do pełnego menu).
//
// UWAGA — LEKTOR: te kwestie są też nagrywane (TTS). Po zmianie treści odpal
// `npm run voice:sync` (przepisuje lustro do .voicegen/voiceLines.json), a
// potem `node .voicegen/gen_all.js all <zmienione kwestie>` — inaczej dźwięk
// rozjedzie się z tekstem na ekranie. Pilnuje tego promptyDialogue.test.ts.
//
// FORMATOWANIE kwestii — minimalny zapis, żeby lustro w voiceLines.json mogło
// zostać dosłowne (generator zdejmuje znaczniki przed syntezą):
//   „- " na początku  → punktor
//   **tekst**         → pogrubienie
//   \n wewnątrz linii → złamanie wiersza (etykieta nad opisem)
// =============================================================================

import { Lang } from '../i18n';

/** Pojedynczy temat rozmowy: pytanie w menu + kwestie wypowiadane przez postać. */
export interface IPromptyTopic {
  id: string;
  /** Pytanie pokazywane jako opcja wyboru. */
  question: string;
  /** Akapity, które postać „mówi" (tekst na ekranie + synteza mowy). */
  lines: string[];
}

export interface IPromptyScript {
  /** Kod języka dla syntezatora mowy (np. 'pl-PL'). */
  voiceLang: string;
  /** Preferowane nazwy głosów (od najlepszego) — naturalniejszy lektor. */
  preferredVoices: string[];
  name: string;
  role: string;
  /** UI. */
  soundNoticeTitle: string;
  soundNoticeText: string;
  soundEnable: string;
  soundDismiss: string;
  soundOnLabel: string;
  soundOffLabel: string;
  skipHint: string;
  chooseHint: string;
  exitLabel: string;
  /** Powitanie tylko przy pierwszym wejściu. */
  greetingLines: string[];
  /** Pożegnanie. */
  goodbyeLines: string[];
  topics: IPromptyTopic[];
}

const PL: IPromptyScript = {
  voiceLang: 'pl-PL',
  preferredVoices: ['Google polski', 'Zosia', 'Paulina', 'Ewa', 'Krzysztof', 'Microsoft Paulina', 'Microsoft Adam'],
  name: 'PROMi',
  role: 'Twój przewodnik po promptach',
  soundNoticeTitle: 'Włącz dźwięk',
  soundNoticeText: 'Dla najlepszych wrażeń włącz dźwięk — PROMi mówi do Ciebie na głos.',
  soundEnable: 'Włącz dźwięk',
  soundDismiss: 'Może później',
  soundOnLabel: 'Dźwięk włączony',
  soundOffLabel: 'Dźwięk wyłączony',
  skipHint: 'Kliknij, aby pominąć',
  chooseHint: 'Wybierz pytanie',
  exitLabel: 'Wróć do Tech Baru',
  greetingLines: [
    'Cześć! Jestem PROMi, Twój przewodnik po świecie promptów.',
    'Pokażę Ci, jak rozmawiać z AI, żeby pracować szybciej i mądrzej.',
    'To powiedz, co chcesz wiedzieć?'
  ],
  goodbyeLines: [
    'Dzięki za rozmowę! Trzymam kciuki za Twoje prompty.',
    'Do zobaczenia w AI Tech Bar!'
  ],
  topics: [
    {
      id: 'what',
      question: 'Czym właściwie jest prompt?',
      lines: [
        'W czasach, gdy AI wkracza do codziennej pracy, warto umieć poprosić je o pomoc. Kluczem jest dobry prompt.',
        'Prompt to po prostu instrukcja, którą przekazujesz systemowi opartemu na AI.',
        'W przeciwieństwie do sztywnych komend możesz go sformułować swobodnie, tak jak prośbę do współpracownika.',
        'Dzięki temu komunikacja jest naturalna, a zadania realizujesz znacznie łatwiej.'
      ]
    },
    {
      id: 'contains',
      question: 'Co powinien zawierać dobry prompt?',
      lines: [
        'Przemyślana instrukcja daje trafniejsze wyniki i oszczędza zasoby. Najlepiej, gdy jest zwięzła, ale nie pomija niczego ważnego.',
        'Dobra instrukcja zawiera cztery podstawowe elementy:',
        '- **Kontekst:** Wprowadź w temat, opisz rolę systemu i wskaż źródła informacji wraz z ich krótką zawartością.',
        '- **Polecenie:** Dokładnie opisz zadanie, a przy złożonych podziel je na podzadania lub punkty.',
        '- **Przykłady:** Dodaj wzorcowe rozwiązania, by dać systemowi punkt odniesienia.',
        '- **Opis oczekiwanego rezultatu:** Wskaż format, długość, strukturę i styl, których oczekujesz.'
      ]
    },
    {
      id: 'start3',
      question: 'Od czego zacząć pisanie promptu?',
      lines: [
        'Zanim zaczniesz pisać, odpowiedz sobie na trzy proste pytania.',
        '- **Co chcę osiągnąć?**\nJasno zdefiniuj zadanie, żeby znać swój cel.',
        '- **Jak to osiągnąć?**\nPomyśl, jak sam podszedłbyś do zadania, i rozpisz kroki.',
        '- **Co jest do tego potrzebne?**\nZastanów się, jakich informacji i zasobów wymaga zadanie.'
      ]
    },
    {
      id: 'best',
      question: 'Jak uzyskać najlepsze rezultaty?',
      lines: [
        'Oto kilka prostych sposobów i trików na to, by wyniki Twoich promptów były lepsze:',
        '- Pisz klarownie i formalnie, krótkimi zdaniami. Unikaj sprzecznych informacji.',
        '- Poproś system, aby pokazał swój tok rozumowania. Łatwiej wtedy wychwycisz błędy i naniesiesz poprawki.',
        '- Dodaj na początku zdanie: zoptymalizuj poniższy prompt. System sam przygotuje zwięźlejszą i wydajniejszą wersję.',
        '- Przy trudniejszych problemach poproś o analizę z kilku perspektyw. To ogranicza błędne, jednotorowe odpowiedzi.',
        '- Poproś też, aby system zadawał pytania pomocnicze, gdy brakuje mu danych.'
      ]
    },
    {
      id: 'responsible',
      question: 'Jak korzystać z AI odpowiedzialnie?',
      lines: [
        'Pamiętaj, że AI bywa omylne i działa na Twoich danych. Trzymaj się kilku prostych zasad.',
        'Zawsze sprawdzaj to, co system wygeneruje. Pominięcie weryfikacji może mieć poważne skutki dla firmy.',
        'Udostępniaj tylko niezbędne dane, których naprawdę wymaga zadanie.',
        'Korzystaj wyłącznie z narzędzi zatwierdzonych przez firmę i ze służbowych kont. Inaczej ryzykujesz wyciekiem danych.'
      ]
    }
  ]
};

const EN: IPromptyScript = {
  voiceLang: 'en-US',
  preferredVoices: ['Google US English', 'Samantha', 'Ava', 'Microsoft Aria', 'Microsoft Jenny', 'Daniel', 'Karen'],
  name: 'PROMi',
  role: 'Your guide to prompting',
  soundNoticeTitle: 'Turn on sound',
  soundNoticeText: 'For the best experience turn on sound — PROMi talks to you out loud.',
  soundEnable: 'Turn on sound',
  soundDismiss: 'Maybe later',
  soundOnLabel: 'Sound on',
  soundOffLabel: 'Sound off',
  skipHint: 'Click to skip',
  chooseHint: 'Pick a question',
  exitLabel: 'Back to the Tech Bar',
  greetingLines: [
    'Hi! I\u2019m PROMi, your guide to the world of prompts.',
    'I\u2019ll show you how to talk to AI so you can work faster and smarter.',
    'So tell me, what would you like to know?'
  ],
  goodbyeLines: [
    'Thanks for the chat! Fingers crossed for your prompts.',
    'See you at the AI Tech Bar!'
  ],
  topics: [
    {
      id: 'what',
      question: 'What exactly is a prompt?',
      lines: [
        'As AI becomes part of everyday work, it pays to know how to ask it for help. The key is a good prompt.',
        'A prompt is simply an instruction you give to an AI-based system.',
        'Unlike rigid commands, you can phrase it freely, just like a request you\u2019d write to a colleague.',
        'That keeps communication natural and makes getting things done much easier.'
      ]
    },
    {
      id: 'contains',
      question: 'What should a good prompt contain?',
      lines: [
        'A thoughtful instruction gives sharper results and saves resources. Keep it concise, but don\u2019t leave out anything important.',
        'A good instruction contains four basic elements:',
        '- **Context:** Introduce the topic, describe the system\u2019s role and point to the sources of information.',
        '- **Instruction:** Describe the task precisely, and for complex ones split it into sub-tasks or points.',
        '- **Examples:** Add model solutions to give the system a point of reference.',
        '- **Expected result:** State the format, length, structure and style you expect.'
      ]
    },
    {
      id: 'start3',
      question: 'How do I start writing a prompt?',
      lines: [
        'Before you start writing, answer three simple questions.',
        '- **What do I want to achieve?**\nDefine the task clearly so you know your goal.',
        '- **How do I achieve it?**\nThink how you\u2019d tackle it yourself and list the steps.',
        '- **What do I need for it?**\nConsider the information and resources the task requires.'
      ]
    },
    {
      id: 'best',
      question: 'How do I get the best results?',
      lines: [
        'Here are a few simple ways and tricks to make your prompts give better results:',
        '- Write clearly and formally, in short sentences. Avoid contradictory information.',
        '- Ask the system to show its reasoning. It\u2019s easier to catch mistakes and make corrections.',
        '- Start with the line: optimize the prompt below. The system will produce a tighter, more efficient version.',
        '- For harder problems, ask for analysis from several perspectives. It reduces one-track, wrong answers.',
        '- Also ask the system to pose follow-up questions when it lacks data.'
      ]
    },
    {
      id: 'responsible',
      question: 'How do I use AI responsibly?',
      lines: [
        'Remember that AI can be wrong and it operates on your data. Stick to a few simple rules.',
        'Always check what the system generates. Skipping verification can have serious consequences for the company.',
        'Share only the data the task truly requires.',
        'Use only company-approved tools and your work accounts. Otherwise you risk a data leak.'
      ]
    }
  ]
};

export const PROMPTY_SCRIPT: { [key in Lang]: IPromptyScript } = { pl: PL, en: EN };

/**
 * Zdejmuje znaczniki formatowania. Tego tekstu używa lektor i czytniki ekranu,
 * więc musi odpowiadać temu, co generator robi z lustrem w voiceLines.json.
 */
export const plainLine = (line: string): string =>
  line.replace(/^- /, '').replace(/\*\*/g, '').replace(/\n/g, ' ');

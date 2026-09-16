import * as React from 'react';

// =============================================================================
// Lokalizacja (i18n) — domyślnie polski (oryginał), angielski jako tłumaczenie.
// Wszystkie teksty UI + treści per-id (narzędzia, cele, polityka) w jednym miejscu.
// Dane strukturalne (id, ikony, gradienty, linki) pozostają w config.ts.
// =============================================================================

export type Lang = 'pl' | 'en';

export interface ITitleParts { pre: string; grad: string; post: string; }
export interface IWelcomeWord { chars: string; gradient: boolean; }
export interface IToolText { name?: string; tagline: string; description: string; tags: string[]; singleButtonLabel?: string; }
export interface IGoalText { title: string; tools: string; }

export interface IStrings {
  welcome: {
    eyebrow: string;
    titleWords: IWelcomeWord[];
    subtitle: string;
    button: string;
    hint: string;
    creditPre: string;
    creditName: string;
  };
  hero: {
    eyebrow: string;
    line1: string; // zawiera {name}
    line2pre: string; line2grad: string;
    line3pre: string; line3grad: string;
    subtitle: string;
    scrollHint: string;
    statLabels: string[];
    navLabels: { [targetId: string]: string };
  };
  szkolenia: {
    kicker: string; title: ITitleParts; lead: string;
    videoBadge: string; videoTitle: string; videoDesc: string; videoCta: string;
    videoBullets: string[]; videoTags: string[];
    promptsBadge: string; promptsTitle: string; promptsDesc: string; promptsCta: string;
    promptsBullets: string[]; promptsTags: string[];
    carouselEyebrow: string; carouselCta: string; carouselClose: string; carouselUpNext: string;
  };
  cel: { kicker: string; title: ITitleParts; lead: string; matchCta: string; navHint: string; discoverCta: string; discoverHint: string; };
  tools: {
    kicker: string; title: ITitleParts; lead: string;
    searchPlaceholder: string; allTag: string; open: string; request: string;
    emptyText: string; clearFilters: string;
  };
  booking: {
    kicker: string; title: ITitleParts; lead: string;
    bookingPill: string; bookingTitle: string; bookingDesc: string; bookingGo: string;
    policyTitle: string; policyLink: string;
  };
  navbar: { brand: string; cta: string; };
  fs: { label: string; hint: string; cta: string; };
  lang: { label: string; switchTo: string; };
  toolText: { [id: string]: IToolText };
  goalText: { [id: string]: IGoalText };
  policyRules: string[];
}

const PL: IStrings = {
  welcome: {
    eyebrow: 'AI Everywhere · AI Tech Bar',
    titleWords: [
      { chars: 'Pracuj', gradient: false },
      { chars: 'efektywniej', gradient: true },
      { chars: 'z', gradient: false },
      { chars: 'AI', gradient: false }
    ],
    subtitle: 'Twoje centrum sztucznej inteligencji w firmie — narzędzia, szkolenia i wsparcie ekspertów w jednym miejscu.',
    button: 'Rozpocznij przygodę',
    hint: 'Kliknij, aby uruchomić doświadczenie',
    creditPre: 'Designed & developed by ',
    creditName: 'Margul Wiktor'
  },
  hero: {
    eyebrow: 'AI Enterprise · SharePoint',
    line1: 'Cześć {name},',
    line2pre: 'Twoja przygoda z ', line2grad: 'AI',
    line3pre: 'zaczyna się ', line3grad: 'TERAZ',
    subtitle: 'Szkolenia · Cel · Narzędzia · Wsparcie. Wszystko, co pozwala Twojej pracy lecieć szybciej - w jednym, bezpiecznym miejscu.',
    scrollHint: 'Scrolluj, żeby zacząć',
    statLabels: ['narzędzi AI w stacku', 'ścieżki szkoleniowe', 'sesje w AI Tech Bar'],
    navLabels: {
      'sec-szkolenia': 'Strefa Szkoleń',
      'sec-cel': 'Cel',
      'sec-tools': 'Narzędzia AI',
      'sec-booking': 'Tech Bar & Polityka'
    }
  },
  szkolenia: {
    kicker: '#01 · Strefa Szkoleń',
    title: { pre: 'Ucz się ', grad: 'we własnym tempie', post: '' },
    lead: 'Wideo na start i biblioteka sprawdzonych promptów — wszystko, by szybko wejść w temat.',
    videoBadge: 'Wideo',
    videoTitle: 'Szkolenia Wideo',
    videoDesc: 'Krótkie nagrania krok po kroku — od podstaw po zaawansowane scenariusze pracy z AI.',
    videoCta: 'Sprawdź',
    videoBullets: [
      'Krok po kroku — od zera do pierwszego efektu',
      'Krótkie odcinki skupione na konkretnym zadaniu',
      'Dla każdego poziomu — start i zaawansowani'
    ],
    videoTags: ['Onboarding', 'Copilot', 'Praktyka'],
    promptsBadge: 'Biblioteka',
    promptsTitle: 'Prompty & Triki',
    promptsDesc: 'Gotowe prompty, szablony i sprawdzone triki, które od razu wykorzystasz w pracy.',
    promptsCta: 'Sprawdź',
    promptsBullets: [
      'Gotowe prompty do skopiowania i użycia',
      'Szablony dopasowane do konkretnych zadań',
      'Triki, które realnie oszczędzają czas'
    ],
    promptsTags: ['Szablony', 'Prompty', 'Triki'],
    carouselEyebrow: 'Szkolenia wideo',
    carouselCta: 'Przejdź do materiałów szkoleniowych',
    carouselClose: 'Zamknij',
    carouselUpNext: 'W kolejce'
  },
  cel: {
    kicker: '#02 · Cel',
    title: { pre: 'Wybierz cel — ', grad: 'dopasujemy narzędzie', post: '' },
    lead: 'Powiedz, co chcesz osiągnąć. My wskażemy najlepsze narzędzie AI do zadania.',
    matchCta: 'Dopasuj narzędzie',
    navHint: 'Zmień swój cel — kliknij ikonę poniżej',
    discoverCta: 'Odkryj cele',
    discoverHint: 'Kliknij, aby zobaczyć wszystkie cele'
  },
  tools: {
    kicker: '#03 · Narzędzia AI',
    title: { pre: 'Twój ', grad: 'stack narzędzi', post: ' AI' },
    lead: 'Przeglądaj zatwierdzone narzędzia. Otwórz aplikację albo złóż wniosek o dostęp.',
    searchPlaceholder: 'Szukaj narzędzia…',
    allTag: 'Wszystkie',
    open: 'Otwórz',
    request: 'Wniosek',
    emptyText: 'Brak narzędzi dla wybranych filtrów.',
    clearFilters: 'Wyczyść filtry'
  },
  booking: {
    kicker: '#04 · Tech Bar & Polityka',
    title: { pre: 'Wpadnij do ', grad: 'AI Tech Bar', post: '' },
    lead: 'Zarezerwuj sesję 1:1 z ekspertem i poznaj zasady bezpiecznego korzystania z AI.',
    bookingPill: 'Booking',
    bookingTitle: 'Zarezerwuj wizytę w AI Tech Bar',
    bookingDesc: 'Indywidualna sesja z ekspertem AI — pokażemy, jak wdrożyć narzędzia w Twojej codziennej pracy.',
    bookingGo: 'Przejdź',
    policyTitle: 'Zasady korzystania z AI',
    policyLink: 'Przeczytaj pełną Politykę AI'
  },
  navbar: { brand: 'AI Tech Bar', cta: 'Zarezerwuj wizytę' },
  fs: {
    label: 'Pełny ekran',
    hint: 'Zalecany tryb pełnoekranowy — w nim animacje i efekty wyglądają najlepiej.',
    cta: 'Włącz'
  },
  lang: { label: 'Język', switchTo: 'Przełącz na angielski' },
  toolText: {
    'copilot': {
      tagline: 'Asystent w Microsoft 365',
      description: 'Pisz, podsumowuj i analizuj dane wprost w Word, Excel, Outlook i Teams.',
      tags: ['Pisanie', 'Analiza danych', 'M365']
    },
    'promptly': {
      tagline: 'Transkrypcje i notatki',
      description: 'Zamieniaj nagrania i spotkania w gotowe transkrypcje oraz streszczenia.',
      tags: ['Transkrypcje', 'Spotkania']
    },
    'zoom-ai': {
      tagline: 'AI Companion dla spotkań',
      description: 'Wychodź ze spotkań z gotowym podsumowaniem i listą zadań.',
      tags: ['Spotkania', 'Notatki']
    },
    'canva-ai': {
      tagline: 'Design bez kursu',
      description: 'Twórz grafiki, prezentacje i materiały marketingowe w kilka chwil.',
      tags: ['Design', 'Grafika']
    },
    'miro-ai': {
      tagline: 'Wizualna współpraca',
      description: 'Burze mózgów, mapy myśli i diagramy generowane przez AI na tablicy.',
      tags: ['Design', 'Współpraca']
    },
    'github-copilot': {
      tagline: 'Programowanie z AI',
      description: 'Podpowiedzi kodu, refaktoryzacja i tłumaczenie kodu w Twoim IDE.',
      tags: ['Kod', 'Programowanie']
    },
    'cursor': {
      tagline: 'Edytor kodu z AI',
      description: 'Buduj i edytuj projekty w naturalnym języku — agent kodujący w IDE.',
      tags: ['Kod', 'Programowanie']
    },
    'all-tools': {
      name: 'Wszystkie narzędzia AI',
      tagline: 'Pełny katalog',
      description: 'Zobacz pełną, zawsze aktualną listę zatwierdzonych narzędzi AI w WBD.',
      tags: ['Katalog'],
      singleButtonLabel: 'Zobacz pełną listę'
    }
  },
  goalText: {
    'goal-write': { title: 'Pisz szybciej i lepiej', tools: 'Copilot M365' },
    'goal-design': { title: 'Twórz bez kursu designu', tools: 'Canva AI · Miro AI' },
    'goal-transcribe': { title: 'Twórz transkrypcje', tools: 'Promptly' },
    'goal-meetings': { title: 'Wychodź ze spotkań z gotowymi notatkami', tools: 'Zoom AI' },
    'goal-data': { title: 'Analizuj dane bez formuł', tools: 'Copilot M365' },
    'goal-code': { title: 'Koduj szybciej i lepiej', tools: 'GitHub Copilot · Cursor' }
  },
  policyRules: [
    'Traktuj AI jako pomocnika — ostateczna decyzja i odpowiedzialność zawsze należą do Ciebie.',
    'Nie wprowadzaj do narzędzi AI danych osobowych (klientów, pracowników, partnerów), informacji poufnych ani tajemnic firmy.',
    'Każdy wynik wygenerowany przez AI musi zostać sprawdzony i zweryfikowany przed wysłaniem lub publikacją.',
    'Korzystaj wyłącznie z narzędzi AI zatwierdzonych i dostępnych w WBD; użycie innych narzędzi wymaga wcześniejszego zatwierdzenia.'
  ]
};

const EN: IStrings = {
  welcome: {
    eyebrow: 'AI Everywhere · AI Tech Bar',
    titleWords: [
      { chars: 'Work', gradient: false },
      { chars: 'smarter', gradient: true },
      { chars: 'with', gradient: false },
      { chars: 'AI', gradient: false }
    ],
    subtitle: "Your company's AI hub — tools, training and expert support all in one place.",
    button: 'Start the journey',
    hint: 'Click to launch the experience',
    creditPre: 'Designed & developed by ',
    creditName: 'Margul Wiktor'
  },
  hero: {
    eyebrow: 'AI Enterprise · SharePoint',
    line1: 'Hi {name},',
    line2pre: 'Your journey with ', line2grad: 'AI',
    line3pre: 'starts ', line3grad: 'NOW',
    subtitle: 'Training · Goal · Tools · Support. Everything that helps your work move faster - in one secure place.',
    scrollHint: 'Scroll to begin',
    statLabels: ['AI tools in the stack', 'learning paths', 'sessions at AI Tech Bar'],
    navLabels: {
      'sec-szkolenia': 'Training Zone',
      'sec-cel': 'Goal',
      'sec-tools': 'AI Tools',
      'sec-booking': 'Tech Bar & Policy'
    }
  },
  szkolenia: {
    kicker: '#01 · Training Zone',
    title: { pre: 'Learn ', grad: 'at your own pace', post: '' },
    lead: 'Videos to get started and a library of proven prompts — everything to get up to speed fast.',
    videoBadge: 'Video',
    videoTitle: 'Video Trainings',
    videoDesc: 'Short step-by-step videos — from the basics to advanced AI work scenarios.',
    videoCta: 'Check',
    videoBullets: [
      'Step by step — from zero to your first result',
      'Short episodes focused on a single task',
      'For every level — beginners to advanced'
    ],
    videoTags: ['Onboarding', 'Copilot', 'Hands-on'],
    promptsBadge: 'Library',
    promptsTitle: 'Prompts & Tips',
    promptsDesc: 'Ready-made prompts, templates and proven tips you can use at work right away.',
    promptsCta: 'Check',
    promptsBullets: [
      'Ready prompts to copy and use',
      'Templates tailored to specific tasks',
      'Tricks that genuinely save you time'
    ],
    promptsTags: ['Templates', 'Prompts', 'Tips'],
    carouselEyebrow: 'Video trainings',
    carouselCta: 'Go to training materials',
    carouselClose: 'Close',
    carouselUpNext: 'Up next'
  },
  cel: {
    kicker: '#02 · Goal',
    title: { pre: 'Pick a goal — ', grad: "we'll match the tool", post: '' },
    lead: "Tell us what you want to achieve. We'll point you to the best AI tool for the job.",
    matchCta: 'Match a tool',
    navHint: 'Change your goal — click an icon below',
    discoverCta: 'Discover goals',
    discoverHint: 'Click to reveal all goals'
  },
  tools: {
    kicker: '#03 · AI Tools',
    title: { pre: 'Your AI ', grad: 'tool stack', post: '' },
    lead: 'Browse approved tools. Open the app or request access.',
    searchPlaceholder: 'Search a tool…',
    allTag: 'All',
    open: 'Open',
    request: 'Request',
    emptyText: 'No tools match the selected filters.',
    clearFilters: 'Clear filters'
  },
  booking: {
    kicker: '#04 · Tech Bar & Policy',
    title: { pre: 'Drop by the ', grad: 'AI Tech Bar', post: '' },
    lead: 'Book a 1:1 session with an expert and learn the rules of safe AI use.',
    bookingPill: 'Booking',
    bookingTitle: 'Book a visit to the AI Tech Bar',
    bookingDesc: "A one-on-one session with an AI expert — we'll show you how to apply the tools in your daily work.",
    bookingGo: 'Go',
    policyTitle: 'AI usage rules',
    policyLink: 'Read the full AI Policy'
  },
  navbar: { brand: 'AI Tech Bar', cta: 'Book a visit' },
  fs: {
    label: 'Full screen',
    hint: 'Full-screen mode is recommended — animations and effects look best in it.',
    cta: 'Enable'
  },
  lang: { label: 'Language', switchTo: 'Switch to Polish' },
  toolText: {
    'copilot': {
      tagline: 'Microsoft 365 assistant',
      description: 'Write, summarize and analyze data right inside Word, Excel, Outlook and Teams.',
      tags: ['Writing', 'Data analysis', 'M365']
    },
    'promptly': {
      tagline: 'Transcriptions & notes',
      description: 'Turn recordings and meetings into ready transcriptions and summaries.',
      tags: ['Transcriptions', 'Meetings']
    },
    'zoom-ai': {
      tagline: 'AI Companion for meetings',
      description: 'Leave meetings with a ready summary and a list of action items.',
      tags: ['Meetings', 'Notes']
    },
    'canva-ai': {
      tagline: 'Design without a course',
      description: 'Create graphics, presentations and marketing materials in minutes.',
      tags: ['Design', 'Graphics']
    },
    'miro-ai': {
      tagline: 'Visual collaboration',
      description: 'Brainstorms, mind maps and diagrams generated by AI on a board.',
      tags: ['Design', 'Collaboration']
    },
    'github-copilot': {
      tagline: 'Programming with AI',
      description: 'Code suggestions, refactoring and code explanation right in your IDE.',
      tags: ['Code', 'Programming']
    },
    'cursor': {
      tagline: 'AI code editor',
      description: 'Build and edit projects in natural language — a coding agent in your IDE.',
      tags: ['Code', 'Programming']
    },
    'all-tools': {
      name: 'All AI tools',
      tagline: 'Full catalog',
      description: 'See the full, always up-to-date list of approved AI tools at WBD.',
      tags: ['Catalog'],
      singleButtonLabel: 'See full list'
    }
  },
  goalText: {
    'goal-write': { title: 'Write faster and better', tools: 'Copilot M365' },
    'goal-design': { title: 'Create without a design course', tools: 'Canva AI · Miro AI' },
    'goal-transcribe': { title: 'Create transcriptions', tools: 'Promptly' },
    'goal-meetings': { title: 'Leave meetings with ready notes', tools: 'Zoom AI' },
    'goal-data': { title: 'Analyze data without formulas', tools: 'Copilot M365' },
    'goal-code': { title: 'Code faster and better', tools: 'GitHub Copilot · Cursor' }
  },
  policyRules: [
    'Treat AI as an assistant — the final decision and responsibility are always yours.',
    'Do not enter personal data (clients, employees, partners), confidential information or company secrets into AI tools.',
    'Every AI-generated result must be checked and verified before it is sent or published.',
    'Use only AI tools approved and available at WBD; using any other tools requires prior approval.'
  ]
};

export const STRINGS: { [key in Lang]: IStrings } = { pl: PL, en: EN };

interface IL10nContext { lang: Lang; t: IStrings; }

const L10nContext = React.createContext<IL10nContext>({ lang: 'pl', t: PL });

export const L10nProvider: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => {
  const value = React.useMemo<IL10nContext>(() => ({ lang, t: STRINGS[lang] }), [lang]);
  return <L10nContext.Provider value={value}>{children}</L10nContext.Provider>;
};

export const useL10n = (): IL10nContext => React.useContext(L10nContext);

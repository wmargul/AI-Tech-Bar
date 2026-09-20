// =============================================================================
// AI TECH BAR - centralna konfiguracja treści i linków.
// Wszystkie adresy URL są tutaj, żeby łatwo je podmienić bez grzebania w UI.
// Placeholdery oznaczone jako "#" – podmień na docelowe linki.
// =============================================================================

export interface ITool {
  id: string;
  name: string;
  /** Krótki podtytuł / kategoria */
  tagline: string;
  /** Opis na kafelku karuzeli */
  description: string;
  /** Skrót / inicjały wyświetlane w "logo" kafelka */
  badge: string;
  /** Gradient akcentu kafelka (CSS) */
  accent: string;
  /** Tagi do filtrowania / wyszukiwarki */
  tags: string[];
  /** Link do aplikacji ("Otwórz") */
  openUrl: string;
  /** Link do wniosku o dostęp ("Wniosek") */
  requestUrl: string;
  /** Specjalny kafelek "Wszystkie narzędzia AI" – jeden przycisk */
  isAllTools?: boolean;
  /** Etykieta pojedynczego przycisku (dla kafelka specjalnego) */
  singleButtonLabel?: string;
  singleButtonUrl?: string;
}

export interface IGoal {
  id: string;
  index: string;
  title: string;
  tools: string;
  icon: string;
  accent: string;
}

export interface IStat {
  value: string;
  label: string;
}

export interface INavItem {
  index: string;
  label: string;
  targetId: string;
}

export interface IPolicyRule {
  icon: string;
  text: string;
}

export interface INewsItem {
  id: string;
  /** Data publikacji w formacie ISO (YYYY-MM-DD) — formatowana w UI per język */
  date: string;
  /** Kategoria wpisu (chip nad tytułem) */
  tag: string;
  title: string;
  /** Zajawka na kafelku */
  excerpt: string;
  icon: string;
  /** Gradient akcentu kafelka (CSS) */
  accent: string;
  /** Link do pełnego wpisu */
  url: string;
}

// --- Globalne linki (podmień na docelowe) --------------------------------------
export const LINKS = {
  booking: '#',          // Strona rezerwacji wizyt w AI Tech Bar
  // Pełna Polityka AI — artykuł w bazie wiedzy ServiceNow (nowa karta)
  policyFull: 'https://wbd.service-now.com/one?id=kb_article&sysparm_article=KB0018902',
  allTools: '#',         // Pełna lista narzędzi AI
  videoTraining: '#',    // Szkolenia wideo
  prompts: '#',          // Prompty & Triki
  news: '#'              // Pełna lista aktualności AI
};

// --- Rezerwacja wizyt (Microsoft Bookings przez Graph) -------------------------
// businessId kalendarza Bookings to adres SMTP jego skrzynki — ten sam, który
// występuje w publicznym linku: bookings.cloud.microsoft/book/{businessId}/
export const BOOKING = {
  businessId: 'AITechBarWizyta@turner.onmicrosoft.com',
  /** Strefa czasowa kalendarza Bookings (IANA) — w niej liczone są godziny pracy. */
  timeZone: 'Europe/Warsaw',
  /** Ile dni naprzód pokazujemy w wyborze terminu. */
  daysAhead: 21,
  /** Godziny pracy używane, gdy Graph nie zwróci ich z kalendarza (pon–pt). */
  fallbackHours: { start: '09:00', end: '17:00' },
  /** Domyślna długość wizyty, gdy usługa nie podaje własnej. */
  fallbackDurationMin: 30
};

// --- Narzędzia AI (karuzela) ---------------------------------------------------
export const TOOLS: ITool[] = [
  {
    id: 'copilot',
    name: 'Copilot M365',
    tagline: 'Asystent w Microsoft 365',
    description: 'Pisz, podsumowuj i analizuj dane wprost w Word, Excel, Outlook i Teams.',
    badge: 'CP',
    accent: 'linear-gradient(135deg, #2f6bff 0%, #22d3ee 100%)',
    tags: ['Pisanie', 'Analiza danych', 'M365'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'promptly',
    name: 'Promptly',
    tagline: 'Transkrypcje i notatki',
    description: 'Zamieniaj nagrania i spotkania w gotowe transkrypcje oraz streszczenia.',
    badge: 'PR',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    tags: ['Transkrypcje', 'Spotkania'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'zoom-ai',
    name: 'Zoom AI',
    tagline: 'AI Companion dla spotkań',
    description: 'Wychodź ze spotkań z gotowym podsumowaniem i listą zadań.',
    badge: 'ZM',
    accent: 'linear-gradient(135deg, #2f6bff 0%, #6366f1 100%)',
    tags: ['Spotkania', 'Notatki'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'canva-ai',
    name: 'Canva AI',
    tagline: 'Design bez kursu',
    description: 'Twórz grafiki, prezentacje i materiały marketingowe w kilka chwil.',
    badge: 'CV',
    accent: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)',
    tags: ['Design', 'Grafika'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'miro-ai',
    name: 'Miro AI',
    tagline: 'Wizualna współpraca',
    description: 'Burze mózgów, mapy myśli i diagramy generowane przez AI na tablicy.',
    badge: 'MR',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    tags: ['Design', 'Współpraca'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    tagline: 'Programowanie z AI',
    description: 'Podpowiedzi kodu, refaktoryzacja i tłumaczenie kodu w Twoim IDE.',
    badge: 'GH',
    accent: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
    tags: ['Kod', 'Programowanie'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'cursor',
    name: 'Cursor',
    tagline: 'Edytor kodu z AI',
    description: 'Buduj i edytuj projekty w naturalnym języku — agent kodujący w IDE.',
    badge: 'CR',
    accent: 'linear-gradient(135deg, #a855f7 0%, #22d3ee 100%)',
    tags: ['Kod', 'Programowanie'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Asystent AI od Anthropic',
    description: 'Pisz, analizuj długie dokumenty i generuj kod w naturalnej rozmowie z modelem Claude.',
    badge: 'CL',
    accent: 'linear-gradient(135deg, #d97757 0%, #f59e0b 100%)',
    tags: ['Pisanie', 'Analiza danych', 'Programowanie', 'Kod'],
    openUrl: '#',
    requestUrl: '#'
  },
  {
    id: 'all-tools',
    name: 'Wszystkie narzędzia AI',
    tagline: 'Pełny katalog',
    description: 'Zobacz pełną, zawsze aktualną listę zatwierdzonych narzędzi AI w WBD.',
    badge: '∞',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%)',
    tags: ['Katalog'],
    openUrl: '#',
    requestUrl: '#',
    isAllTools: true,
    singleButtonLabel: 'Zobacz pełną listę',
    singleButtonUrl: LINKS.allTools
  }
];

/** Unikalne tagi narzędzi (do chipów filtra) — z pominięciem kafelka katalogu. */
export const TOOL_TAGS: string[] = (() => {
  const set: { [k: string]: true } = {};
  TOOLS.forEach((t) => {
    if (t.isAllTools) return;
    t.tags.forEach((tag) => { set[tag] = true; });
  });
  return Object.keys(set);
})();

// --- Cele (Wybierz cel — dopasujemy narzędzie) ---------------------------------
export const GOALS: IGoal[] = [
  {
    id: 'goal-write',
    index: '01',
    title: 'Pisz szybciej i lepiej',
    tools: 'Copilot M365',
    icon: '✍️',
    accent: 'linear-gradient(135deg, #2f6bff 0%, #22d3ee 100%)'
  },
  {
    id: 'goal-design',
    index: '02',
    title: 'Twórz bez kursu designu',
    tools: 'Canva AI · Miro AI',
    icon: '🎨',
    accent: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)'
  },
  {
    id: 'goal-transcribe',
    index: '03',
    title: 'Twórz transkrypcje',
    tools: 'Promptly',
    icon: '🎙️',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
  },
  {
    id: 'goal-meetings',
    index: '04',
    title: 'Wychodź ze spotkań z gotowymi notatkami',
    tools: 'Zoom AI',
    icon: '📅',
    accent: 'linear-gradient(135deg, #2f6bff 0%, #6366f1 100%)'
  },
  {
    id: 'goal-data',
    index: '05',
    title: 'Analizuj dane bez formuł',
    tools: 'Copilot M365',
    icon: '📊',
    accent: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)'
  },
  {
    id: 'goal-code',
    index: '06',
    title: 'Koduj szybciej i lepiej',
    tools: 'GitHub Copilot · Cursor',
    icon: '💻',
    accent: 'linear-gradient(135deg, #a855f7 0%, #22d3ee 100%)'
  }
];

// --- Statystyki w hero ---------------------------------------------------------
export const STATS: IStat[] = [
  { value: '6+', label: 'narzędzi AI w stacku' },
  { value: '4', label: 'ścieżki szkoleniowe' },
  { value: '1:1', label: 'sesje w AI Tech Bar' }
];

// --- Pozycje nawigacji (kolejność sekcji) --------------------------------------
export const NAV_ITEMS: INavItem[] = [
  { index: '01', label: 'Strefa Szkoleń', targetId: 'sec-szkolenia' },
  { index: '02', label: 'Cel', targetId: 'sec-cel' },
  { index: '03', label: 'Narzędzia AI', targetId: 'sec-tools' },
  { index: '04', label: 'Tech Bar', targetId: 'sec-booking' },
  { index: '05', label: 'News', targetId: 'sec-news' },
  { index: '06', label: 'Polityka AI', targetId: 'sec-policy' }
];

// --- Zasady korzystania z AI ---------------------------------------------------
export const POLICY_RULES: IPolicyRule[] = [
  {
    icon: '🤝',
    text: 'Traktuj AI jako pomocnika — ostateczna decyzja i odpowiedzialność zawsze należą do Ciebie.'
  },
  {
    icon: '🔒',
    text: 'Nie wprowadzaj do narzędzi AI danych osobowych (klientów, pracowników, partnerów), informacji poufnych ani tajemnic firmy.'
  },
  {
    icon: '✅',
    text: 'Każdy wynik wygenerowany przez AI musi zostać sprawdzony i zweryfikowany przed wysłaniem lub publikacją.'
  },
  {
    icon: '🛡️',
    text: 'Korzystaj wyłącznie z narzędzi AI zatwierdzonych i dostępnych w WBD; użycie innych narzędzi wymaga wcześniejszego zatwierdzenia.'
  }
];

// --- News (aktualności AI) -----------------------------------------------------
export const NEWS_ITEMS: INewsItem[] = [
  {
    id: 'news-copilot-rollout',
    date: '2026-09-08',
    tag: 'Wdrożenie',
    title: 'Copilot M365 dostępny dla kolejnych zespołów',
    excerpt: 'Rozszerzamy dostęp do Copilota w Word, Excel, Outlook i Teams. Sprawdź, jak złożyć wniosek i od czego zacząć.',
    icon: '🚀',
    accent: 'linear-gradient(135deg, #2f6bff 0%, #22d3ee 100%)',
    url: '#'
  },
  {
    id: 'news-prompt-library',
    date: '2026-08-27',
    tag: 'Biblioteka',
    title: 'Nowa paczka promptów dla zespołów',
    excerpt: 'Gotowe prompty do raportów, podsumowań spotkań i analizy danych — skopiuj i użyj od razu w swojej pracy.',
    icon: '💡',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    url: '#'
  },
  {
    id: 'news-policy-update',
    date: '2026-08-12',
    tag: 'Polityka AI',
    title: 'Aktualizacja zasad korzystania z AI',
    excerpt: 'Doprecyzowaliśmy reguły dotyczące danych poufnych i weryfikacji wyników. Zapoznaj się z nową wersją polityki.',
    icon: '🛡️',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    url: '#'
  }
];

// =============================================================================
// USTAWIENIA Z PROPERTY PANE
// Płaska mapa linków edytowalna przez edytora strony. Puste pola = wartość
// domyślna z LINKS / TOOLS powyżej.
// =============================================================================

/**
 * Płaskie właściwości linków zapisywane w web part.
 * Linki narzędzi trzymane są pod dynamicznymi kluczami
 * toolLink_{id}_open / toolLink_{id}_request (czytane przez cast).
 */
export interface ILinkSettings {
  linkBooking?: string;
  linkPolicy?: string;
  linkAllTools?: string;
  linkVideoTraining?: string;
  linkPrompts?: string;
  linkNews?: string;
  bookingBusinessId?: string;
  bookingTimeZone?: string;
  bookingDemoMode?: boolean;
}

export interface IResolvedSettings {
  links: {
    booking: string;
    policyFull: string;
    allTools: string;
    videoTraining: string;
    prompts: string;
    news: string;
  };
  booking: {
    businessId: string;
    timeZone: string;
    daysAhead: number;
    /** Terminy z zaślepek zamiast z Graph — do przeglądu przed zgodą admina. */
    demoMode: boolean;
  };
  toolLinks: { [toolId: string]: { openUrl: string; requestUrl: string } };
}

const pick = (value: unknown, fallback: string): string => {
  const v = typeof value === 'string' ? value.trim() : '';
  return v.length > 0 ? v : fallback;
};

export const toolOpenKey = (id: string): string => `toolLink_${id}_open`;
export const toolRequestKey = (id: string): string => `toolLink_${id}_request`;

/** Łączy domyślną konfigurację z wartościami z Property Pane. */
export const resolveSettings = (p: ILinkSettings | undefined): IResolvedSettings => {
  const props = (p || {}) as ILinkSettings;
  // dynamiczne klucze narzędzi nie są w typie ILinkSettings — czytamy przez rekord
  const rec = (p || {}) as unknown as { [key: string]: unknown };
  const toolLinks: IResolvedSettings['toolLinks'] = {};
  TOOLS.forEach((t) => {
    toolLinks[t.id] = {
      openUrl: pick(rec[toolOpenKey(t.id)], t.openUrl),
      requestUrl: pick(rec[toolRequestKey(t.id)], t.requestUrl)
    };
  });

  return {
    links: {
      booking: pick(props.linkBooking, LINKS.booking),
      policyFull: pick(props.linkPolicy, LINKS.policyFull),
      allTools: pick(props.linkAllTools, LINKS.allTools),
      videoTraining: pick(props.linkVideoTraining, LINKS.videoTraining),
      prompts: pick(props.linkPrompts, LINKS.prompts),
      news: pick(props.linkNews, LINKS.news)
    },
    booking: {
      businessId: pick(props.bookingBusinessId, BOOKING.businessId),
      timeZone: pick(props.bookingTimeZone, BOOKING.timeZone),
      daysAhead: BOOKING.daysAhead,
      demoMode: props.bookingDemoMode === true
    },
    toolLinks
  };
};

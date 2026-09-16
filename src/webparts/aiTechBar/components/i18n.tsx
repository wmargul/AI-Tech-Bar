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
export interface INewsText { tag: string; title: string; excerpt: string; }

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
  };
  policy: {
    kicker: string; title: ITitleParts; lead: string;
    policyTitle: string; policyLink: string;
  };
  bookingFlow: {
    eyebrow: string; title: string; close: string;
    steps: { service: string; slot: string; confirm: string };
    loading: string;
    serviceLead: string; minutes: string; online: string; onsite: string;
    pickService: string; bookingFor: string; dateLabel: string; timeLabel: string;
    prevMonth: string; nextMonth: string; pickDay: string;
    slotLead: string; timeZoneNote: string; allTimesIn: string;
    demoBadge: string; demoNote: string; demoDoneTitle: string; demoDoneLead: string;
    today: string; tomorrow: string;
    noSlots: string; noSlotsHint: string;
    nameLabel: string; emailLabel: string; notesLabel: string; notesPlaceholder: string;
    summaryWhen: string; summaryWhat: string; summaryWho: string;
    back: string; submit: string; submitting: string;
    successTitle: string; successLead: string; successMail: string;
    addToCalendar: string; openOutlook: string; done: string;
    fallbackTitle: string; fallbackLead: string; fallbackCta: string;
    errorPermissions: string; errorRules: string; errorGeneric: string;
    retry: string; openOriginal: string;
  };
  news: {
    kicker: string; title: ITitleParts; lead: string;
    readCta: string; allCta: string;
  };
  navbar: { brand: string; cta: string; };
  fs: { label: string; hint: string; cta: string; };
  lang: { label: string; switchTo: string; };
  toolText: { [id: string]: IToolText };
  goalText: { [id: string]: IGoalText };
  newsText: { [id: string]: INewsText };
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
      'sec-booking': 'Tech Bar',
      'sec-news': 'News',
      'sec-policy': 'Polityka AI'
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
    kicker: '#04 · Tech Bar',
    title: { pre: 'Wpadnij do ', grad: 'AI Tech Bar', post: '' },
    lead: 'Zarezerwuj sesję 1:1 z ekspertem i wyjdź z gotowym planem wdrożenia AI w swojej pracy.',
    bookingPill: 'Booking',
    bookingTitle: 'Zarezerwuj wizytę w AI Tech Bar',
    bookingDesc: 'Indywidualna sesja z ekspertem AI — pokażemy, jak wdrożyć narzędzia w Twojej codziennej pracy.',
    bookingGo: 'Przejdź'
  },
  policy: {
    kicker: '#06 · Polityka AI',
    title: { pre: 'Korzystaj z AI ', grad: 'bezpiecznie', post: '' },
    lead: 'Cztery zasady, które chronią Ciebie i firmę. Poznaj je, zanim zaczniesz pracę z narzędziami AI.',
    policyTitle: 'Zasady korzystania z AI',
    policyLink: 'Przeczytaj pełną Politykę AI'
  },
  bookingFlow: {
    eyebrow: 'AI Tech Bar · Rezerwacja',
    title: 'Zarezerwuj sesję z ekspertem',
    close: 'Zamknij',
    steps: { service: 'Temat', slot: 'Termin', confirm: 'Potwierdzenie' },
    loading: 'Sprawdzam wolne terminy…',
    serviceLead: 'Z czym chcesz popracować? Wybierz temat sesji.',
    minutes: 'min',
    online: 'Online',
    onsite: 'Na miejscu',
    pickService: 'Wybierz lokalizację',
    bookingFor: 'Rezerwacja dla',
    dateLabel: 'Data',
    timeLabel: 'Godzina',
    prevMonth: 'Poprzedni miesiąc',
    nextMonth: 'Następny miesiąc',
    pickDay: 'Wybierz dzień z kalendarza, aby zobaczyć wolne godziny.',
    slotLead: 'Wybierz dzień i godzinę, które Ci pasują.',
    timeZoneNote: 'Godziny w strefie',
    allTimesIn: 'Wszystkie godziny są w strefie',
    demoBadge: 'Tryb demonstracyjny',
    demoNote: 'Terminy są przykładowe, a wizyta nie zostanie zapisana w kalendarzu.',
    demoDoneTitle: 'Tak wygląda potwierdzenie',
    demoDoneLead: 'To podgląd przepływu — rezerwacja nie została utworzona.',
    today: 'Dziś',
    tomorrow: 'Jutro',
    noSlots: 'Brak wolnych terminów w tym zakresie.',
    noSlotsHint: 'Spróbuj wybrać inny dzień albo zajrzyj później — kalendarz zmienia się na bieżąco.',
    nameLabel: 'Imię i nazwisko',
    emailLabel: 'E-mail',
    notesLabel: 'Czego dotyczy sesja? (opcjonalnie)',
    notesPlaceholder: 'Np. chcę nauczyć się analizować dane w Excelu z Copilotem…',
    summaryWhen: 'Termin',
    summaryWhat: 'Temat',
    summaryWho: 'Rezerwuje',
    back: 'Wróć',
    submit: 'Zarezerwuj wizytę',
    submitting: 'Rezerwuję…',
    successTitle: 'Termin zarezerwowany',
    successLead: 'Do zobaczenia w AI Tech Bar!',
    successMail: 'Potwierdzenie z zaproszeniem do kalendarza wysłaliśmy na Twój e-mail.',
    addToCalendar: 'Dodaj do mojego kalendarza',
    openOutlook: 'Otwórz w Outlooku',
    done: 'Gotowe',
    fallbackTitle: 'Dokończ w kalendarzu',
    fallbackLead: 'Nie udało się zapisać terminu automatycznie. Możesz dodać wizytę do swojego kalendarza i potwierdzić ją z ekspertem.',
    fallbackCta: 'Pobierz wydarzenie (.ics)',
    errorPermissions: 'Rezerwacja online czeka na zgodę administratora na dostęp do kalendarza.',
    errorRules: 'Ten termin nie spełnia zasad kalendarza Tech Baru — wybierz inny.',
    errorGeneric: 'Nie udało się połączyć z kalendarzem Tech Baru.',
    retry: 'Spróbuj ponownie',
    openOriginal: 'Otwórz stronę rezerwacji'
  },
  news: {
    kicker: '#05 · News',
    title: { pre: 'Co ', grad: 'nowego', post: ' w AI' },
    lead: 'Wdrożenia, nowe narzędzia i zmiany w zasadach — wszystko, co warto wiedzieć na bieżąco.',
    readCta: 'Czytaj więcej',
    allCta: 'Zobacz wszystkie aktualności'
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
  newsText: {
    'news-copilot-rollout': {
      tag: 'Wdrożenie',
      title: 'Copilot M365 dostępny dla kolejnych zespołów',
      excerpt: 'Rozszerzamy dostęp do Copilota w Word, Excel, Outlook i Teams. Sprawdź, jak złożyć wniosek i od czego zacząć.'
    },
    'news-prompt-library': {
      tag: 'Biblioteka',
      title: 'Nowa paczka promptów dla zespołów',
      excerpt: 'Gotowe prompty do raportów, podsumowań spotkań i analizy danych — skopiuj i użyj od razu w swojej pracy.'
    },
    'news-policy-update': {
      tag: 'Polityka AI',
      title: 'Aktualizacja zasad korzystania z AI',
      excerpt: 'Doprecyzowaliśmy reguły dotyczące danych poufnych i weryfikacji wyników. Zapoznaj się z nową wersją polityki.'
    }
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
      'sec-booking': 'Tech Bar',
      'sec-news': 'News',
      'sec-policy': 'AI Policy'
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
    kicker: '#04 · Tech Bar',
    title: { pre: 'Drop by the ', grad: 'AI Tech Bar', post: '' },
    lead: 'Book a 1:1 session with an expert and leave with a ready plan for using AI in your work.',
    bookingPill: 'Booking',
    bookingTitle: 'Book a visit to the AI Tech Bar',
    bookingDesc: "A one-on-one session with an AI expert — we'll show you how to apply the tools in your daily work.",
    bookingGo: 'Go'
  },
  policy: {
    kicker: '#06 · AI Policy',
    title: { pre: 'Use AI ', grad: 'safely', post: '' },
    lead: 'Four rules that protect you and the company. Get to know them before you start working with AI tools.',
    policyTitle: 'AI usage rules',
    policyLink: 'Read the full AI Policy'
  },
  bookingFlow: {
    eyebrow: 'AI Tech Bar · Booking',
    title: 'Book a session with an expert',
    close: 'Close',
    steps: { service: 'Topic', slot: 'Time', confirm: 'Confirm' },
    loading: 'Checking available times…',
    serviceLead: 'What would you like to work on? Pick a session topic.',
    minutes: 'min',
    online: 'Online',
    onsite: 'On site',
    pickService: 'Choose a location',
    bookingFor: 'Booking for',
    dateLabel: 'Date',
    timeLabel: 'Time',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    pickDay: 'Pick a day in the calendar to see available times.',
    slotLead: 'Pick a day and time that works for you.',
    timeZoneNote: 'Times in',
    allTimesIn: 'All times are in',
    demoBadge: 'Demo mode',
    demoNote: 'Times shown are samples and no appointment will be saved to any calendar.',
    demoDoneTitle: 'This is the confirmation screen',
    demoDoneLead: 'Flow preview only — no booking was created.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    noSlots: 'No available times in this range.',
    noSlotsHint: 'Try another day or check back later — the calendar updates continuously.',
    nameLabel: 'Full name',
    emailLabel: 'Email',
    notesLabel: 'What is the session about? (optional)',
    notesPlaceholder: 'E.g. I want to learn how to analyze data in Excel with Copilot…',
    summaryWhen: 'When',
    summaryWhat: 'Topic',
    summaryWho: 'Booked by',
    back: 'Back',
    submit: 'Book the visit',
    submitting: 'Booking…',
    successTitle: 'Your visit is booked',
    successLead: 'See you at the AI Tech Bar!',
    successMail: 'We sent a confirmation with a calendar invite to your email.',
    addToCalendar: 'Add to my calendar',
    openOutlook: 'Open in Outlook',
    done: 'Done',
    fallbackTitle: 'Finish in your calendar',
    fallbackLead: "We couldn't save the booking automatically. You can add the visit to your calendar and confirm it with the expert.",
    fallbackCta: 'Download event (.ics)',
    errorPermissions: 'Online booking is waiting for an administrator to approve calendar access.',
    errorRules: "That time doesn't meet the Tech Bar calendar rules — please pick another.",
    errorGeneric: "We couldn't reach the Tech Bar calendar.",
    retry: 'Try again',
    openOriginal: 'Open the booking page'
  },
  news: {
    kicker: '#05 · News',
    title: { pre: "What's ", grad: 'new', post: ' in AI' },
    lead: 'Rollouts, new tools and policy changes — everything worth knowing, as it happens.',
    readCta: 'Read more',
    allCta: 'See all news'
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
  newsText: {
    'news-copilot-rollout': {
      tag: 'Rollout',
      title: 'Copilot M365 now available to more teams',
      excerpt: 'We are expanding access to Copilot in Word, Excel, Outlook and Teams. See how to request it and where to start.'
    },
    'news-prompt-library': {
      tag: 'Library',
      title: 'A new prompt pack for teams',
      excerpt: 'Ready-made prompts for reports, meeting summaries and data analysis — copy them and use them at work right away.'
    },
    'news-policy-update': {
      tag: 'AI Policy',
      title: 'Update to the AI usage rules',
      excerpt: 'We clarified the rules on confidential data and result verification. Take a look at the new version of the policy.'
    }
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

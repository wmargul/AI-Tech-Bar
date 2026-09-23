// =============================================================================
// Przewodniki celów — treść okna otwieranego przyciskiem „Dopasuj narzędzie".
//
// Trzymane osobno od i18n.tsx, bo to kilkadziesiąt akapitów na język i w pliku
// tłumaczeń przykryłyby wszystko inne. Układ jest taki sam jak w reszcie
// projektu: liczby i identyfikatory po stronie struktury (GOAL_TOOLS), teksty
// per język (GOAL_GUIDE_TEXT).
//
// Dodanie narzędzia do celu = dopisanie wpisu w GOAL_TOOLS i bloku tekstu pod
// tym samym toolId w obu językach. Cele z więcej niż jednym narzędziem dostają
// w oknie pasek zakładek.
// =============================================================================

import { Lang } from '../i18n';

export interface IGoalToolSetup {
  /** Identyfikator z TOOLS — spina cel z linkami „Otwórz" i „Wniosek". */
  toolId: string;
  /** Czas trwania szkolenia w minutach. */
  videoMin: number;
  /** Link do nagrania; '#' oznacza „w przygotowaniu" i wyłącza odtwarzacz. */
  videoUrl: string;
  /** Szacowany czas wypełnienia wniosku o dostęp, w minutach. */
  requestMin: number;
}

export interface IFaqEntry {
  q: string;
  a: string;
}

export interface IGoalToolText {
  videoTitle: string;
  videoLevel: string;
  videoDesc: string;
  /** Aplikacje / miejsca, w których narzędzie działa — pod kafelkiem wniosku. */
  surfaces: string[];
  faq: IFaqEntry[];
}

export interface IGoalGuideText {
  /** Nadtytuł nad nazwą celu, np. „Pisanie i komunikacja". */
  category: string;
  lead: string;
  /** Grupa odbiorców pokazywana przy wniosku. */
  audience: string;
  tools: { [toolId: string]: IGoalToolText };
}

// --- Struktura ----------------------------------------------------------------

export const GOAL_TOOLS: { [goalId: string]: IGoalToolSetup[] } = {
  'goal-write': [
    { toolId: 'copilot', videoMin: 15, videoUrl: '#', requestMin: 2 }
  ],
  'goal-design': [
    { toolId: 'canva-ai', videoMin: 12, videoUrl: '#', requestMin: 3 },
    { toolId: 'miro-ai', videoMin: 10, videoUrl: '#', requestMin: 3 }
  ],
  'goal-transcribe': [
    { toolId: 'promptly', videoMin: 9, videoUrl: '#', requestMin: 2 }
  ],
  'goal-meetings': [
    { toolId: 'zoom-ai', videoMin: 11, videoUrl: '#', requestMin: 2 }
  ],
  'goal-data': [
    { toolId: 'copilot', videoMin: 14, videoUrl: '#', requestMin: 2 }
  ],
  'goal-code': [
    { toolId: 'github-copilot', videoMin: 16, videoUrl: '#', requestMin: 3 },
    { toolId: 'cursor', videoMin: 13, videoUrl: '#', requestMin: 3 }
  ]
};

export const goalToolsFor = (goalId: string): IGoalToolSetup[] => GOAL_TOOLS[goalId] || [];

// --- Teksty: polski -----------------------------------------------------------

const PL: { [goalId: string]: IGoalGuideText } = {
  'goal-write': {
    category: 'Pisanie i komunikacja',
    lead: 'Napisz i popraw teksty, streść maile i dokumenty oraz zamień notatki w gotowe treści — szybciej i bez ręcznego formatowania.',
    audience: 'Wszyscy pracownicy',
    tools: {
      copilot: {
        videoTitle: 'Copilot w M365 — pierwsze kroki',
        videoLevel: 'Starter',
        videoDesc: 'Jak poprosić Copilota o napisanie e-maila, streszczenie spotkania i przygotowanie slajdów. Zero technicznego żargonu — same konkretne przykłady z codziennej pracy.',
        surfaces: ['Teams', 'Outlook', 'Word', 'Excel', 'PowerPoint'],
        faq: [
          {
            q: 'Do czego mogę używać Copilota?',
            a: 'Do pisania i poprawiania tekstów, streszczania długich maili i dokumentów, przygotowania pierwszej wersji prezentacji oraz porządkowania notatek. Sprawdza się wszędzie tam, gdzie masz materiał wyjściowy i potrzebujesz zrobić z niego gotową treść.'
          },
          {
            q: 'Czy muszę znać specjalne komendy lub prompty?',
            a: 'Nie. Copilot rozumie zwykły język — napisz, czego oczekujesz, tak jakbyś prosił o to współpracownika. Im więcej kontekstu podasz, tym lepszy wynik, ale żadnej składni nie trzeba się uczyć.'
          },
          {
            q: 'W jakich aplikacjach działa Copilot?',
            a: 'W Wordzie, Excelu, PowerPoincie, Outlooku i Teams, a także w osobnym oknie czatu. W każdej z nich widzi treść, nad którą właśnie pracujesz, więc nie musisz niczego wklejać.'
          },
          {
            q: 'Czy Copilot zapisuje lub udostępnia moje treści?',
            a: 'Copilot działa w obrębie Twojego konta i danych, do których i tak masz dostęp — nie udostępnia ich innym pracownikom. Obowiązuje jednak zasada z Polityki AI: nie wprowadzaj danych, których nie wolno przetwarzać.'
          }
        ]
      }
    }
  },

  'goal-design': {
    category: 'Design i współpraca wizualna',
    lead: 'Przygotuj grafiki, prezentacje i tablice warsztatowe bez umiejętności projektowych i bez czekania na wsparcie zespołu kreatywnego.',
    audience: 'Wszyscy pracownicy',
    tools: {
      'canva-ai': {
        videoTitle: 'Canva AI — od pustej strony do gotowej grafiki',
        videoLevel: 'Starter',
        videoDesc: 'Generowanie projektów z opisu, praca na szablonach marki i szybkie poprawki obrazów. Pokazujemy ścieżkę od pomysłu do pliku gotowego do wysłania.',
        surfaces: ['Grafiki', 'Prezentacje', 'Social media', 'Dokumenty'],
        faq: [
          {
            q: 'Czy muszę umieć projektować?',
            a: 'Nie. Opisujesz, co ma powstać, a Canva przygotowuje propozycje układu, kolorów i typografii. Twoja rola to wybór wariantu i ewentualne poprawki tekstu.'
          },
          {
            q: 'Czy mogę korzystać z szablonów marki?',
            a: 'Tak. Po otrzymaniu dostępu zobaczysz zestaw szablonów zgodnych z identyfikacją wizualną, więc materiały są spójne bez pilnowania kolorów i czcionek ręcznie.'
          },
          {
            q: 'Co z prawami do wygenerowanych grafik?',
            a: 'Materiały wygenerowane w Canvie możesz wykorzystywać w pracy, ale przed publikacją zewnętrzną potwierdź to z zespołem prawnym — zasady różnią się w zależności od typu treści.'
          },
          {
            q: 'Czy mogę wrzucać materiały wewnętrzne?',
            a: 'Tylko takie, które nie są poufne. Grafiki i teksty trafiają do usługi zewnętrznej, więc obowiązuje ta sama zasada, co w całej Polityce AI.'
          }
        ]
      },
      'miro-ai': {
        videoTitle: 'Miro AI — warsztat, który sam się porządkuje',
        videoLevel: 'Starter',
        videoDesc: 'Burze mózgów, grupowanie karteczek, mapy myśli i diagramy generowane z opisu. Materiał dla osób prowadzących spotkania i warsztaty.',
        surfaces: ['Tablice', 'Warsztaty', 'Mapy myśli', 'Diagramy'],
        faq: [
          {
            q: 'Do czego najbardziej przydaje się AI w Miro?',
            a: 'Do porządkowania efektów burzy mózgów — automatycznie grupuje karteczki w tematy i podsumowuje je. Potrafi też wygenerować szkielet diagramu albo mapy myśli z krótkiego opisu.'
          },
          {
            q: 'Czy muszę wcześniej znać Miro?',
            a: 'Nie, ale łatwiej zacząć, jeśli widziałeś już tablicę w akcji. Szkolenie prowadzi od pustej tablicy do gotowego podsumowania warsztatu.'
          },
          {
            q: 'Czy AI zmienia treść, którą wpisali uczestnicy?',
            a: 'Nie nadpisuje karteczek — tworzy obok nich nowe grupy i podsumowania. Oryginalne wpisy zostają, więc zawsze można wrócić do źródła.'
          },
          {
            q: 'Czy tablice są widoczne dla całej firmy?',
            a: 'Widoczność ustawiasz sam przy tworzeniu tablicy. Domyślnie dostęp mają tylko zaproszone osoby, ale warto to sprawdzić przed wklejeniem wrażliwych materiałów.'
          }
        ]
      }
    }
  },

  'goal-transcribe': {
    category: 'Transkrypcje i notatki',
    lead: 'Zamień nagrania, wywiady i spotkania w tekst, który da się przeszukać, zacytować i streścić — zamiast odsłuchiwać wszystko od nowa.',
    audience: 'Wszyscy pracownicy',
    tools: {
      promptly: {
        videoTitle: 'Promptly — od nagrania do gotowej notatki',
        videoLevel: 'Starter',
        videoDesc: 'Wgrywanie pliku, wybór języka, poprawianie transkrypcji i eksport streszczenia. Pokazujemy też, jak szybko znaleźć konkretny fragment w długim nagraniu.',
        surfaces: ['Transkrypcje', 'Streszczenia', 'Wywiady', 'Spotkania'],
        faq: [
          {
            q: 'Jakie pliki mogę wgrać?',
            a: 'Typowe formaty audio i wideo z nagrań spotkań oraz wywiadów. Jakość transkrypcji zależy przede wszystkim od czystości dźwięku, a nie od formatu pliku.'
          },
          {
            q: 'Czy transkrypcja działa po polsku?',
            a: 'Tak, polski jest obsługiwany. Przy nagraniach dwujęzycznych warto wskazać język główny, bo poprawia to rozpoznawanie nazw własnych.'
          },
          {
            q: 'Czy muszę poprawiać wynik ręcznie?',
            a: 'Zwykle warto przejrzeć nazwiska, nazwy produktów i liczby — to miejsca, w których najczęściej pojawiają się błędy. Reszta tekstu nadaje się do użycia od razu.'
          },
          {
            q: 'Czy mogę wgrywać nagrania poufne?',
            a: 'Nie, jeśli zawierają dane osobowe lub informacje objęte tajemnicą firmy. W razie wątpliwości skonsultuj nagranie przed wgraniem — zasady opisuje Polityka AI.'
          }
        ]
      }
    }
  },

  'goal-meetings': {
    category: 'Spotkania',
    lead: 'Wychodź ze spotkania z gotowym podsumowaniem, listą decyzji i zadań, zamiast spisywać notatki w trakcie rozmowy.',
    audience: 'Wszyscy pracownicy',
    tools: {
      'zoom-ai': {
        videoTitle: 'Zoom AI Companion — podsumowania bez notowania',
        videoLevel: 'Starter',
        videoDesc: 'Włączanie asystenta przed spotkaniem, odczytywanie podsumowania i listy zadań oraz dzielenie się nimi z zespołem. Materiał dla prowadzących i uczestników.',
        surfaces: ['Spotkania', 'Podsumowania', 'Lista zadań', 'Nagrania'],
        faq: [
          {
            q: 'Kto musi włączyć asystenta — prowadzący czy uczestnik?',
            a: 'Asystenta uruchamia gospodarz spotkania. Uczestnicy widzą wtedy informację, że podsumowanie jest tworzone, i dostają je po zakończeniu rozmowy.'
          },
          {
            q: 'Czy wszyscy wiedzą, że spotkanie jest podsumowywane?',
            a: 'Tak, Zoom pokazuje wyraźny komunikat wszystkim uczestnikom. Warto dodatkowo powiedzieć o tym na początku, zwłaszcza przy rozmowach z osobami spoza firmy.'
          },
          {
            q: 'Czy podsumowanie zastępuje nagranie?',
            a: 'Nie — to osobna rzecz. Podsumowanie to tekst z najważniejszymi ustaleniami, a nagranie włącza się niezależnie i podlega własnym zasadom przechowywania.'
          },
          {
            q: 'Co zrobić, gdy podsumowanie pominie ważną decyzję?',
            a: 'Podsumowanie jest edytowalne przed wysłaniem do zespołu. Traktuj je jak pierwszą wersję do sprawdzenia, a nie oficjalny protokół.'
          }
        ]
      }
    }
  },

  'goal-data': {
    category: 'Analiza danych',
    lead: 'Zadaj pytanie do arkusza w zwykłym języku i dostań odpowiedź, wykres albo podsumowanie — bez pisania formuł i tabel przestawnych.',
    audience: 'Wszyscy pracownicy',
    tools: {
      copilot: {
        videoTitle: 'Copilot w Excelu — analiza bez formuł',
        videoLevel: 'Średni',
        videoDesc: 'Pytania do danych w naturalnym języku, automatyczne wykresy, wykrywanie trendów i porządkowanie tabel. Na przykładach raportów, które przygotowuje się co miesiąc.',
        surfaces: ['Excel', 'Power BI', 'Teams', 'Copilot Chat'],
        faq: [
          {
            q: 'Czy muszę umieć pisać formuły?',
            a: 'Nie. Wystarczy opisać, czego szukasz — na przykład „pokaż sprzedaż według miesięcy i zaznacz spadki". Copilot sam dobierze sposób wyliczenia i pokaże, co zrobił.'
          },
          {
            q: 'Jak przygotować arkusz, żeby to działało dobrze?',
            a: 'Najlepiej działa na danych w formie tabeli: jeden wiersz nagłówka, bez scalonych komórek i pustych wierszy w środku. Uporządkowanie arkusza daje większą różnicę niż sposób zadania pytania.'
          },
          {
            q: 'Czy mogę ufać wynikom bez sprawdzania?',
            a: 'Nie. Każdy wynik trzeba zweryfikować przed użyciem w raporcie — wymaga tego również Polityka AI. Copilot pokazuje użyte kroki, więc sprawdzenie zwykle zajmuje chwilę.'
          },
          {
            q: 'Czy zadziała na danych z bazy albo Power BI?',
            a: 'Tak, o ile masz do nich dostęp i są podłączone do arkusza lub raportu. Copilot nigdy nie sięga po dane, do których sam nie masz uprawnień.'
          }
        ]
      }
    }
  },

  'goal-code': {
    category: 'Programowanie',
    lead: 'Pisz, refaktoryzuj i tłumacz kod z asystentem, który zna kontekst repozytorium — od podpowiedzi w edytorze po agenta wykonującego całe zadania.',
    audience: 'Zespoły techniczne',
    tools: {
      'github-copilot': {
        videoTitle: 'GitHub Copilot — podpowiedzi w Twoim IDE',
        videoLevel: 'Średni',
        videoDesc: 'Uzupełnianie kodu, generowanie testów, wyjaśnianie cudzych fragmentów i praca z czatem w edytorze. Dla osób, które dopiero wdrażają Copilota w codzienny workflow.',
        surfaces: ['VS Code', 'JetBrains', 'Visual Studio', 'GitHub'],
        faq: [
          {
            q: 'W jakich edytorach działa?',
            a: 'W VS Code, produktach JetBrains, Visual Studio oraz bezpośrednio na GitHubie. Ustawienia i historia czatu są wspólne dla wszystkich miejsc.'
          },
          {
            q: 'Czy Copilot widzi całe repozytorium?',
            a: 'Widzi otwarte pliki i kontekst, który mu wskażesz. Im precyzyjniej pokażesz odpowiednie fragmenty, tym trafniejsze podpowiedzi — rzucanie całego projektu nie pomaga.'
          },
          {
            q: 'Czy wygenerowany kod trafia do przeglądu jak każdy inny?',
            a: 'Tak, bez wyjątków. Odpowiadasz za kod, który commitujesz, więc obowiązują te same testy, przegląd i standardy co przy kodzie pisanym ręcznie.'
          },
          {
            q: 'Czy nasz kod jest używany do trenowania modeli?',
            a: 'Nie w wersji firmowej — dostęp jest skonfigurowany tak, by kod nie zasilał treningu modeli publicznych. Mimo to nie wklejaj do czatu sekretów ani danych produkcyjnych.'
          }
        ]
      },
      cursor: {
        videoTitle: 'Cursor — agent kodujący w edytorze',
        videoLevel: 'Zaawansowany',
        videoDesc: 'Praca zadaniami zamiast linijkami: opisujesz zmianę, agent przygotowuje ją w całym projekcie. Pokazujemy, jak prowadzić agenta i jak weryfikować efekt.',
        surfaces: ['Edytor', 'Agent', 'Refaktoryzacja', 'Repozytoria'],
        faq: [
          {
            q: 'Czym Cursor różni się od GitHub Copilota?',
            a: 'Copilot podpowiada w trakcie pisania, Cursor potrafi wykonać całe zadanie w wielu plikach naraz. W praktyce dobrze się uzupełniają, a nie wykluczają.'
          },
          {
            q: 'Czy agent może zmienić coś bez mojej zgody?',
            a: 'Zmiany pokazuje jako propozycję do zaakceptowania. Warto pracować na osobnej gałęzi, żeby cofnięcie całej serii zmian było jedną komendą.'
          },
          {
            q: 'Od czego zacząć, żeby nie zniechęcić się na starcie?',
            a: 'Od małych, dobrze opisanych zadań w znanym Ci kodzie — na przykład dopisania testów. Duże zadania w nieznanym projekcie najczęściej kończą się przeglądem, który trwa dłużej niż ręczna zmiana.'
          },
          {
            q: 'Czy obowiązują te same zasady bezpieczeństwa?',
            a: 'Tak. Kod od agenta przechodzi normalny przegląd, a do edytora nie wprowadzamy sekretów, danych osobowych ani zawartości środowisk produkcyjnych.'
          }
        ]
      }
    }
  }
};

// --- Teksty: angielski --------------------------------------------------------

const EN: { [goalId: string]: IGoalGuideText } = {
  'goal-write': {
    category: 'Writing and communication',
    lead: 'Draft and polish text, summarise long emails and documents, and turn rough notes into finished content — faster and without manual formatting.',
    audience: 'All employees',
    tools: {
      copilot: {
        videoTitle: 'Copilot in M365 — first steps',
        videoLevel: 'Starter',
        videoDesc: 'How to ask Copilot to write an email, summarise a meeting and draft a deck. No technical jargon — just concrete examples from everyday work.',
        surfaces: ['Teams', 'Outlook', 'Word', 'Excel', 'PowerPoint'],
        faq: [
          {
            q: 'What can I use Copilot for?',
            a: 'Writing and improving text, summarising long emails and documents, drafting a first version of a deck and tidying up notes. It shines wherever you already have raw material and need finished content out of it.'
          },
          {
            q: 'Do I need to learn special commands or prompts?',
            a: 'No. Copilot understands plain language — describe what you need the way you would ask a colleague. More context gives better results, but there is no syntax to memorise.'
          },
          {
            q: 'Which apps does Copilot work in?',
            a: 'Word, Excel, PowerPoint, Outlook and Teams, plus a separate chat window. In each of them it can see the content you are working on, so there is nothing to paste.'
          },
          {
            q: 'Does Copilot store or share my content?',
            a: 'Copilot works within your account and the data you can already access, and does not expose it to other employees. The AI Policy rule still applies: never enter data you are not allowed to process.'
          }
        ]
      }
    }
  },

  'goal-design': {
    category: 'Design and visual collaboration',
    lead: 'Produce graphics, decks and workshop boards without design skills and without waiting for the creative team.',
    audience: 'All employees',
    tools: {
      'canva-ai': {
        videoTitle: 'Canva AI — from blank page to finished graphic',
        videoLevel: 'Starter',
        videoDesc: 'Generating designs from a description, working with brand templates and quick image fixes. We walk the path from idea to a file ready to send.',
        surfaces: ['Graphics', 'Decks', 'Social media', 'Documents'],
        faq: [
          {
            q: 'Do I need design skills?',
            a: 'No. You describe what you need and Canva proposes layout, colours and typography. Your job is picking a variant and adjusting the copy.'
          },
          {
            q: 'Can I use brand templates?',
            a: 'Yes. Once access is granted you get templates that follow our visual identity, so materials stay consistent without checking colours and fonts by hand.'
          },
          {
            q: 'Who owns the generated graphics?',
            a: 'You can use Canva output in your work, but confirm with the legal team before publishing externally — the rules differ by content type.'
          },
          {
            q: 'Can I upload internal materials?',
            a: 'Only non-confidential ones. Graphics and text go to an external service, so the same rule as everywhere in the AI Policy applies.'
          }
        ]
      },
      'miro-ai': {
        videoTitle: 'Miro AI — a workshop that tidies itself',
        videoLevel: 'Starter',
        videoDesc: 'Brainstorms, clustering sticky notes, mind maps and diagrams generated from a description. Aimed at people running meetings and workshops.',
        surfaces: ['Boards', 'Workshops', 'Mind maps', 'Diagrams'],
        faq: [
          {
            q: 'Where does AI help most in Miro?',
            a: 'Making sense of a brainstorm — it clusters sticky notes into themes and summarises them. It can also generate the skeleton of a diagram or mind map from a short description.'
          },
          {
            q: 'Do I need to know Miro already?',
            a: 'Not really, though it helps to have seen a board in use. The training goes from an empty board to a finished workshop summary.'
          },
          {
            q: 'Does AI change what participants wrote?',
            a: 'It does not overwrite sticky notes — it creates new groups and summaries next to them. The originals stay, so you can always go back to the source.'
          },
          {
            q: 'Are boards visible to the whole company?',
            a: 'You set visibility when creating the board. By default only invited people have access, but it is worth checking before adding sensitive material.'
          }
        ]
      }
    }
  },

  'goal-transcribe': {
    category: 'Transcripts and notes',
    lead: 'Turn recordings, interviews and meetings into text you can search, quote and summarise — instead of listening through everything again.',
    audience: 'All employees',
    tools: {
      promptly: {
        videoTitle: 'Promptly — from recording to finished note',
        videoLevel: 'Starter',
        videoDesc: 'Uploading a file, picking the language, correcting the transcript and exporting a summary. We also show how to find a specific moment in a long recording.',
        surfaces: ['Transcripts', 'Summaries', 'Interviews', 'Meetings'],
        faq: [
          {
            q: 'Which files can I upload?',
            a: 'Common audio and video formats from meeting and interview recordings. Transcript quality depends far more on how clean the audio is than on the file format.'
          },
          {
            q: 'Does transcription work in Polish?',
            a: 'Yes, Polish is supported. For bilingual recordings it helps to set the main language, as that improves recognition of proper nouns.'
          },
          {
            q: 'Will I have to fix the output by hand?',
            a: 'Names, product names and numbers are worth a quick review — that is where errors usually appear. The rest of the text is typically usable as is.'
          },
          {
            q: 'Can I upload confidential recordings?',
            a: 'Not if they contain personal data or company secrets. When in doubt, check before uploading — the AI Policy covers the details.'
          }
        ]
      }
    }
  },

  'goal-meetings': {
    category: 'Meetings',
    lead: 'Leave every meeting with a ready summary, a list of decisions and action items, instead of taking notes while trying to follow the conversation.',
    audience: 'All employees',
    tools: {
      'zoom-ai': {
        videoTitle: 'Zoom AI Companion — summaries without note-taking',
        videoLevel: 'Starter',
        videoDesc: 'Turning the assistant on before a meeting, reading the summary and action items, and sharing them with the team. For hosts and participants alike.',
        surfaces: ['Meetings', 'Summaries', 'Action items', 'Recordings'],
        faq: [
          {
            q: 'Who turns the assistant on — the host or a participant?',
            a: 'The meeting host starts it. Participants then see a notice that a summary is being produced and receive it once the call ends.'
          },
          {
            q: 'Does everyone know the meeting is being summarised?',
            a: 'Yes, Zoom shows a clear notice to all participants. It is still good practice to mention it at the start, especially with people from outside the company.'
          },
          {
            q: 'Does the summary replace a recording?',
            a: 'No, they are separate. The summary is text with the key outcomes; recording is enabled independently and follows its own retention rules.'
          },
          {
            q: 'What if the summary misses an important decision?',
            a: 'You can edit it before sending it to the team. Treat it as a first draft to review, not an official record.'
          }
        ]
      }
    }
  },

  'goal-data': {
    category: 'Data analysis',
    lead: 'Ask your spreadsheet a question in plain language and get an answer, a chart or a summary — without writing formulas or pivot tables.',
    audience: 'All employees',
    tools: {
      copilot: {
        videoTitle: 'Copilot in Excel — analysis without formulas',
        videoLevel: 'Intermediate',
        videoDesc: 'Plain-language questions about your data, automatic charts, trend spotting and tidying up tables. Built around the kind of report you produce every month.',
        surfaces: ['Excel', 'Power BI', 'Teams', 'Copilot Chat'],
        faq: [
          {
            q: 'Do I need to write formulas?',
            a: 'No. Just describe what you are after — for example "show sales by month and highlight the drops". Copilot picks the method and shows you what it did.'
          },
          {
            q: 'How should I prepare the sheet?',
            a: 'It works best on table-shaped data: a single header row, no merged cells and no blank rows in the middle. Tidying the sheet makes more difference than how you phrase the question.'
          },
          {
            q: 'Can I trust the results without checking?',
            a: 'No. Every result must be verified before it goes into a report — the AI Policy requires it too. Copilot shows the steps it used, so checking is usually quick.'
          },
          {
            q: 'Does it work on database or Power BI data?',
            a: 'Yes, as long as you have access and it is connected to the sheet or report. Copilot never reaches data you are not permitted to see.'
          }
        ]
      }
    }
  },

  'goal-code': {
    category: 'Engineering',
    lead: 'Write, refactor and translate code with an assistant that understands your repository — from inline suggestions to an agent that completes whole tasks.',
    audience: 'Engineering teams',
    tools: {
      'github-copilot': {
        videoTitle: 'GitHub Copilot — suggestions inside your IDE',
        videoLevel: 'Intermediate',
        videoDesc: 'Code completion, generating tests, explaining unfamiliar code and using chat in the editor. For people bringing Copilot into their daily workflow.',
        surfaces: ['VS Code', 'JetBrains', 'Visual Studio', 'GitHub'],
        faq: [
          {
            q: 'Which editors does it support?',
            a: 'VS Code, JetBrains IDEs, Visual Studio and GitHub itself. Settings and chat history are shared across all of them.'
          },
          {
            q: 'Can Copilot see the whole repository?',
            a: 'It sees open files and whatever context you point it at. The more precisely you show the relevant parts, the better the suggestions — throwing the whole project at it does not help.'
          },
          {
            q: 'Does generated code still go through review?',
            a: 'Always. You own the code you commit, so the same tests, review and standards apply as for code written by hand.'
          },
          {
            q: 'Is our code used to train models?',
            a: 'Not on the enterprise plan — access is configured so code does not feed public model training. Even so, never paste secrets or production data into chat.'
          }
        ]
      },
      cursor: {
        videoTitle: 'Cursor — a coding agent in your editor',
        videoLevel: 'Advanced',
        videoDesc: 'Working in tasks rather than lines: you describe the change and the agent prepares it across the project. We show how to steer the agent and how to verify the result.',
        surfaces: ['Editor', 'Agent', 'Refactoring', 'Repositories'],
        faq: [
          {
            q: 'How is Cursor different from GitHub Copilot?',
            a: 'Copilot suggests as you type; Cursor can carry out a whole task across many files. In practice they complement each other rather than compete.'
          },
          {
            q: 'Can the agent change things without my approval?',
            a: 'It presents changes as a proposal to accept. Working on a separate branch is worth the habit, so undoing a whole series of changes is one command.'
          },
          {
            q: 'Where should I start so it does not put me off?',
            a: 'With small, well-described tasks in code you know — adding tests is a good first one. Large tasks in an unfamiliar project usually end in a review that takes longer than doing it by hand.'
          },
          {
            q: 'Do the same security rules apply?',
            a: 'Yes. Agent output goes through normal review, and we never put secrets, personal data or production content into the editor.'
          }
        ]
      }
    }
  }
};

const BY_LANG: { [key in Lang]: { [goalId: string]: IGoalGuideText } } = { pl: PL, en: EN };

export const goalGuideText = (lang: Lang, goalId: string): IGoalGuideText | undefined =>
  BY_LANG[lang][goalId];

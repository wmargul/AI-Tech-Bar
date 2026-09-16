// =============================================================================
// Wyliczanie wolnych terminów wizyt — czysta logika, bez Graph i bez Reacta.
//
// Dlaczego liczymy sloty sami, a nie przez Bookings:
// oficjalna akcja `getStaffAvailability` NIE obsługuje uprawnień delegowanych
// (tylko aplikacyjne), a web part działa client-side jako zalogowany user.
// Dostępność bierzemy więc z `getSchedule` (free/busy) i nakładamy na nią
// reguły usługi z Bookings: godziny pracy, długość wizyty, bufory i krok siatki.
//
// Cała arytmetyka czasu odbywa się na instantach UTC (`Date`), a godziny pracy
// interpretujemy jako czas „ścienny" w strefie kalendarza Bookings — dzięki temu
// wynik jest poprawny także wtedy, gdy przeglądarka użytkownika jest w innej
// strefie niż Tech Bar, i nie wymaga biblioteki do dat.
// =============================================================================

export interface IWorkHoursSlot {
  startTime: string;
  endTime: string;
}

export interface IWorkHoursDay {
  /** Nazwa dnia zgodna z Graph: 'monday', 'tuesday', ... */
  day: string;
  timeSlots: IWorkHoursSlot[];
}

export interface IBusyInterval {
  start: Date;
  end: Date;
}

export interface ISlot {
  start: Date;
  end: Date;
}

interface IZoneParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
}

/** Rozkłada instant na części czasu „ściennego" w podanej strefie. */
const zoneParts = (date: Date, timeZone: string): IZoneParts => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const map: { [key: string]: number } = {};
  dtf.formatToParts(date).forEach((part) => {
    if (part.type !== 'literal') map[part.type] = parseInt(part.value, 10);
  });
  return {
    y: map.year,
    m: map.month,
    d: map.day,
    // część silników zwraca „24" dla północy
    hh: (map.hour || 0) % 24,
    mm: map.minute || 0,
    ss: map.second || 0
  };
};

/** Przesunięcie strefy (w minutach) obowiązujące w danym momencie. */
export const zoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const p = zoneParts(date, timeZone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return Math.round((asUtc - date.getTime()) / 60000);
};

/**
 * Zamienia czas „ścienny" w danej strefie na instant UTC.
 * Dwa przebiegi, bo przesunięcie zależy od wyniku (przejścia DST).
 */
export const zonedWallTimeToUtc = (
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string
): Date => {
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const firstOffset = zoneOffsetMinutes(new Date(guess), timeZone);
  const corrected = guess - firstOffset * 60000;
  const finalOffset = zoneOffsetMinutes(new Date(corrected), timeZone);
  return new Date(guess - finalOffset * 60000);
};

/** Nazwa dnia tygodnia w strefie, w formacie używanym przez Graph. */
export const zoneWeekday = (date: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(date).toLowerCase();

/** Czas „ścienny” 'HH:MM:SS' → minuty od północy. */
const parseWallTime = (value: string): number | undefined => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || '');
  if (!match) return undefined;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

/** Czas trwania ISO 8601 (np. 'PT30M', 'PT1H15M') → minuty. */
export const parseIsoDurationMinutes = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/.exec(value);
  if (!match) return undefined;
  const days = match[1] ? parseInt(match[1], 10) : 0;
  const hours = match[2] ? parseInt(match[2], 10) : 0;
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  const seconds = match[4] ? parseFloat(match[4]) : 0;
  return days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
};

/** Godziny pracy pon–pt w jednym zakresie — używane, gdy Graph ich nie zwróci. */
export const weekdayHours = (startTime: string, endTime: string): IWorkHoursDay[] =>
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({
    day,
    timeSlots: [{ startTime, endTime }]
  }));

export interface IGenerateSlotsInput {
  from: Date;
  to: Date;
  now: Date;
  timeZone: string;
  businessHours: IWorkHoursDay[];
  durationMin: number;
  /** Krok siatki terminów; gdy 0 — równy długości wizyty. */
  stepMin: number;
  preBufferMin: number;
  postBufferMin: number;
  minimumLeadTimeMin: number;
  /**
   * Zajętość w rozbiciu na ekspertów. Termin jest wolny, gdy wolny jest
   * przynajmniej jeden z nich — tak samo dobiera obsługę samo Bookings.
   * Pusta lista = brak danych o zajętości, wszystkie terminy traktujemy jako wolne.
   */
  busyByStaff: IBusyInterval[][];
}

const overlaps = (busy: IBusyInterval[], startMs: number, endMs: number): boolean =>
  busy.some((interval) => interval.start.getTime() < endMs && interval.end.getTime() > startMs);

export const generateSlots = (input: IGenerateSlotsInput): ISlot[] => {
  const {
    from, to, now, timeZone, businessHours, durationMin,
    stepMin, preBufferMin, postBufferMin, minimumLeadTimeMin, busyByStaff
  } = input;

  if (durationMin <= 0) return [];

  const step = stepMin > 0 ? stepMin : durationMin;
  const earliestMs = now.getTime() + minimumLeadTimeMin * 60000;

  const hoursByDay: { [day: string]: IWorkHoursSlot[] } = {};
  businessHours.forEach((entry) => {
    hoursByDay[(entry.day || '').toLowerCase()] = entry.timeSlots || [];
  });

  const slots: ISlot[] = [];
  const startParts = zoneParts(from, timeZone);
  // Dni przechodzimy po kalendarzu cywilnym; UTC służy tu tylko jako licznik dat.
  let civilCursor = Date.UTC(startParts.y, startParts.m - 1, startParts.d);
  const maxDays = 400;

  for (let dayIndex = 0; dayIndex < maxDays; dayIndex += 1) {
    const civil = new Date(civilCursor);
    const y = civil.getUTCFullYear();
    const m = civil.getUTCMonth() + 1;
    const d = civil.getUTCDate();

    // Południe jako reprezentant dnia — nie wpada w godzinę zmiany czasu.
    const dayAnchor = zonedWallTimeToUtc(y, m, d, 12, 0, timeZone);
    if (dayAnchor.getTime() > to.getTime() + 86400000) break;

    const ranges = hoursByDay[zoneWeekday(dayAnchor, timeZone)] || [];
    ranges.forEach((range) => {
      const openMin = parseWallTime(range.startTime);
      const closeMin = parseWallTime(range.endTime);
      if (openMin === undefined || closeMin === undefined) return;

      for (let t = openMin; t + durationMin <= closeMin; t += step) {
        const start = zonedWallTimeToUtc(y, m, d, Math.floor(t / 60), t % 60, timeZone);
        const startMs = start.getTime();
        const endMs = startMs + durationMin * 60000;

        const tooSoon = startMs < earliestMs;
        const outOfRange = startMs < from.getTime() || endMs > to.getTime();
        if (tooSoon || outOfRange) continue;

        const blockStart = startMs - preBufferMin * 60000;
        const blockEnd = endMs + postBufferMin * 60000;
        const anyFree = busyByStaff.length === 0
          || busyByStaff.some((busy) => !overlaps(busy, blockStart, blockEnd));

        if (anyFree) slots.push({ start, end: new Date(endMs) });
      }
    });

    civilCursor += 86400000;
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
};

/** Klucz dnia kalendarzowego ('YYYY-MM-DD') widzianego w danej strefie. */
export const zoneDayKey = (date: Date, timeZone: string): string => {
  const p = zoneParts(date, timeZone);
  const mm = p.m < 10 ? `0${p.m}` : `${p.m}`;
  const dd = p.d < 10 ? `0${p.d}` : `${p.d}`;
  return `${p.y}-${mm}-${dd}`;
};

/** Grupuje terminy po dniu kalendarzowym w strefie Tech Baru. */
export const groupSlotsByDay = (
  slots: ISlot[],
  timeZone: string
): { key: string; date: Date; slots: ISlot[] }[] => {
  const order: string[] = [];
  const byKey: { [key: string]: { key: string; date: Date; slots: ISlot[] } } = {};

  slots.forEach((slot) => {
    const key = zoneDayKey(slot.start, timeZone);
    if (!byKey[key]) {
      byKey[key] = { key, date: slot.start, slots: [] };
      order.push(key);
    }
    byKey[key].slots.push(slot);
  });

  return order.map((key) => byKey[key]);
};

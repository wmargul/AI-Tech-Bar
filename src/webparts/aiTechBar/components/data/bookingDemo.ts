// =============================================================================
// Dane demonstracyjne rezerwacji wizyt.
//
// Pozwalają zobaczyć i pokazać cały przepływ, zanim administrator zatwierdzi
// uprawnienia Graph — bez zgody `loadBookingContext` zwraca 403 i overlay
// pokazuje wyłącznie komunikat o błędzie. Tryb demo idzie przez tę samą logikę
// slotów co produkcja, więc weryfikuje realny wygląd siatki terminów.
//
// Zajętość jest deterministyczna (seed z identyfikatora usługi i dnia), żeby
// terminy nie przeskakiwały przy każdym renderze.
// =============================================================================

import {
  IBusyInterval,
  zoneDayKey,
  zonedWallTimeToUtc
} from './bookingSlots';
import { IBookingContext, IBookingServiceOption, IBookingStaff } from './bookingGraph';

/** Godziny pracy Tech Baru: 11:00–15:30, żeby ostatnia wizyta startowała o 15:00. */
export const DEMO_HOURS = { start: '11:00:00', end: '15:30:00' };

const DEMO_STAFF: IBookingStaff[] = [
  { id: 'demo-staff-krk', displayName: 'Ekspert AI — Kraków', emailAddress: 'demo.krakow@example.invalid' },
  { id: 'demo-staff-waw', displayName: 'Ekspert AI — Warszawa', emailAddress: 'demo.warszawa@example.invalid' }
];

const demoService = (
  id: string,
  displayName: string,
  staffId: string
): IBookingServiceOption => ({
  id,
  displayName,
  description: 'Zapisz się na 30-minutową wizytę w AI Tech Bar.',
  durationMin: 30,
  preBufferMin: 0,
  postBufferMin: 0,
  stepMin: 30,
  minimumLeadTimeMin: 0,
  maximumAdvanceDays: 0,
  allowStaffSelection: true,
  staffMemberIds: [staffId],
  isOnline: false
});

/** Kontekst rezerwacji odwzorowujący konfigurację kalendarza Bookings. */
export const demoBookingContext = (): IBookingContext => ({
  services: [
    demoService('demo-krakow', 'Kraków – AI Tech Bar', 'demo-staff-krk'),
    demoService('demo-warszawa', 'Warszawa – AI Tech Bar', 'demo-staff-waw')
  ],
  staff: DEMO_STAFF,
  businessHours: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({
    day,
    timeSlots: [{ startTime: DEMO_HOURS.start, endTime: DEMO_HOURS.end }]
  }))
});

/** Prosty deterministyczny hash tekstu — ta sama data zawsze daje tę samą zajętość. */
const seedOf = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * Zajętość eksperta wybranej lokalizacji w zadanym zakresie.
 * Zwraca kształt oczekiwany przez `generateSlots` — jedna tablica na eksperta.
 */
export const demoBusyByStaff = (
  serviceId: string,
  from: Date,
  to: Date,
  timeZone: string
): IBusyInterval[][] => {
  const busy: IBusyInterval[] = [];
  const cursor = new Date(from.getTime());

  while (cursor.getTime() <= to.getTime()) {
    const dayKey = zoneDayKey(cursor, timeZone);
    const [y, m, d] = dayKey.split('-').map((part) => parseInt(part, 10));
    const seed = seedOf(`${serviceId}:${dayKey}`);

    // Dwa do trzech zajętych terminów dziennie, rozrzuconych po siatce 11:00–15:00.
    const taken = 2 + (seed % 2);
    for (let i = 0; i < taken; i += 1) {
      const slotIndex = (seed >>> (i * 3 + 2)) % 9;
      const startMin = 11 * 60 + slotIndex * 30;
      const start = zonedWallTimeToUtc(y, m, d, Math.floor(startMin / 60), startMin % 60, timeZone);
      busy.push({ start, end: new Date(start.getTime() + 30 * 60000) });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return [busy];
};

// Testy wyliczania wolnych terminów. Ta logika zastępuje `getStaffAvailability`
// z Bookings (niedostępne dla uprawnień delegowanych), więc błąd w strefach
// czasowych lub buforach oznaczałby proponowanie terminów, których Bookings nie
// przyjmie. Dlatego trzymamy ją pod testami — jest w całości czysta.

import {
  generateSlots,
  groupSlotsByDay,
  parseIsoDurationMinutes,
  weekdayHours,
  zoneDayKey,
  zoneOffsetMinutes,
  zonedWallTimeToUtc,
  IBusyInterval,
  IGenerateSlotsInput
} from './bookingSlots';

const TZ = 'Europe/Warsaw';
const iso = (d: Date): string => d.toISOString().replace('.000Z', 'Z');
const busy = (start: string, end: string): IBusyInterval => ({
  start: new Date(start),
  end: new Date(end)
});

const baseInput: IGenerateSlotsInput = {
  from: new Date('2026-09-21T00:00:00Z'),
  to: new Date('2026-09-21T23:59:00Z'),
  now: new Date('2026-09-18T06:00:00Z'),
  timeZone: TZ,
  businessHours: weekdayHours('09:00:00', '17:00:00'),
  durationMin: 30,
  stepMin: 30,
  preBufferMin: 0,
  postBufferMin: 0,
  minimumLeadTimeMin: 0,
  busyByStaff: []
};

describe('strefy czasowe', () => {
  it('rozpoznaje czas letni i zimowy w Polsce', () => {
    expect(zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), TZ)).toBe(120);
    expect(zoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), TZ)).toBe(60);
  });

  it('przelicza czas ścienny na UTC po obu stronach zmiany czasu', () => {
    expect(iso(zonedWallTimeToUtc(2026, 10, 23, 9, 0, TZ))).toBe('2026-10-23T07:00:00Z');
    expect(iso(zonedWallTimeToUtc(2026, 10, 26, 9, 0, TZ))).toBe('2026-10-26T08:00:00Z');
  });

  it('wyznacza dzień kalendarzowy widziany w strefie', () => {
    // 23:30 UTC to już następny dzień w Warszawie
    expect(zoneDayKey(new Date('2026-09-21T23:30:00Z'), TZ)).toBe('2026-09-22');
  });
});

describe('parsowanie czasu trwania ISO 8601', () => {
  it('obsługuje formaty używane przez Bookings', () => {
    expect(parseIsoDurationMinutes('PT30M')).toBe(30);
    expect(parseIsoDurationMinutes('PT1H15M')).toBe(75);
    expect(parseIsoDurationMinutes('PT0S')).toBe(0);
    expect(parseIsoDurationMinutes(undefined)).toBeUndefined();
  });
});

describe('generowanie terminów', () => {
  it('wypełnia dzień pracy co krok siatki', () => {
    const slots = generateSlots(baseInput);
    expect(slots.length).toBe(16);
    expect(iso(slots[0].start)).toBe('2026-09-21T07:00:00Z');
    expect(iso(slots[slots.length - 1].end)).toBe('2026-09-21T15:00:00Z');
  });

  it('pomija dni poza godzinami pracy', () => {
    const slots = generateSlots({
      ...baseInput,
      from: new Date('2026-09-19T00:00:00Z'),
      to: new Date('2026-09-20T23:59:00Z')
    });
    expect(slots.length).toBe(0);
  });

  it('usuwa terminy kolidujące z zajętością eksperta', () => {
    const slots = generateSlots({
      ...baseInput,
      busyByStaff: [[busy('2026-09-21T07:00:00Z', '2026-09-21T08:00:00Z')]]
    });
    expect(slots.length).toBe(14);
    expect(iso(slots[0].start)).toBe('2026-09-21T08:00:00Z');
  });

  it('uznaje termin za wolny, gdy wolny jest którykolwiek ekspert', () => {
    const slots = generateSlots({
      ...baseInput,
      busyByStaff: [
        [busy('2026-09-21T07:00:00Z', '2026-09-21T15:00:00Z')],
        [busy('2026-09-21T07:00:00Z', '2026-09-21T08:00:00Z')]
      ]
    });
    expect(slots.length).toBe(14);
  });

  it('nie zwraca terminów, gdy wszyscy eksperci są zajęci', () => {
    const allDay = [busy('2026-09-21T00:00:00Z', '2026-09-21T23:00:00Z')];
    const slots = generateSlots({ ...baseInput, busyByStaff: [allDay, allDay] });
    expect(slots.length).toBe(0);
  });

  it('uwzględnia bufory przed i po wizycie', () => {
    const slots = generateSlots({
      ...baseInput,
      preBufferMin: 15,
      postBufferMin: 15,
      busyByStaff: [[busy('2026-09-21T08:00:00Z', '2026-09-21T08:30:00Z')]]
    });
    const starts = slots.map((s) => iso(s.start));
    // 09:30–10:00 odpada, bo bufor po wizycie wchodzi w zajęty blok
    expect(starts).not.toContain('2026-09-21T07:30:00Z');
    expect(starts).toContain('2026-09-21T07:00:00Z');
  });

  it('respektuje minimalny czas wyprzedzenia', () => {
    const slots = generateSlots({
      ...baseInput,
      now: new Date('2026-09-21T07:00:00Z'),
      minimumLeadTimeMin: 120
    });
    expect(iso(slots[0].start)).toBe('2026-09-21T09:00:00Z');
  });

  it('zachowuje godziny pracy po zmianie czasu na zimowy', () => {
    const slots = generateSlots({
      ...baseInput,
      now: new Date('2026-10-20T06:00:00Z'),
      from: new Date('2026-10-26T00:00:00Z'),
      to: new Date('2026-10-26T23:59:00Z')
    });
    expect(slots.length).toBe(16);
    expect(iso(slots[0].start)).toBe('2026-10-26T08:00:00Z');
  });

  it('pozwala na siatkę gęstszą niż długość wizyty', () => {
    const slots = generateSlots({ ...baseInput, durationMin: 30, stepMin: 15 });
    expect(slots.length).toBe(31);
  });
});

describe('konfiguracja AI Tech Bar (Kraków / Warszawa)', () => {
  // Strona Bookings pokazuje 9 terminów od 11:00 do 15:00 przy 30-minutowej
  // wizycie. Żeby ostatni termin startował o 15:00, godziny pracy w kalendarzu
  // muszą kończyć się o 15:30 — 11:00–15:00 dałoby tylko 8 terminów.
  const techBar = (open: string, close: string): string[] =>
    generateSlots({
      ...baseInput,
      businessHours: weekdayHours(open, close),
      durationMin: 30,
      stepMin: 30
    }).map((slot) => new Date(slot.start).toISOString().slice(11, 16));

  it('godziny 11:00–15:30 dają dokładnie siatkę ze strony Bookings', () => {
    const times = techBar('11:00:00', '15:30:00');
    // 11:00 czasu warszawskiego (CEST) = 09:00 UTC
    expect(times).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'
    ]);
    expect(times.length).toBe(9);
  });

  it('godziny 11:00–15:00 ucinają ostatni termin', () => {
    expect(techBar('11:00:00', '15:00:00').length).toBe(8);
  });

  it('każda lokalizacja ma niezależną dostępność', () => {
    // Kraków zajęty 11:00–12:00, Warszawa wolna — liczone osobno, bo dla
    // każdej usługi pobieramy free/busy tylko jej ekspertów.
    const krakow = generateSlots({
      ...baseInput,
      businessHours: weekdayHours('11:00:00', '15:30:00'),
      busyByStaff: [[busy('2026-09-21T09:00:00Z', '2026-09-21T10:00:00Z')]]
    });
    const warszawa = generateSlots({
      ...baseInput,
      businessHours: weekdayHours('11:00:00', '15:30:00'),
      busyByStaff: [[]]
    });
    expect(krakow.length).toBe(7);
    expect(warszawa.length).toBe(9);
  });
});

describe('grupowanie po dniach', () => {
  it('dzieli tydzień roboczy na dni z zachowaniem kolejności', () => {
    const slots = generateSlots({
      ...baseInput,
      from: new Date('2026-09-21T00:00:00Z'),
      to: new Date('2026-09-26T00:00:00Z')
    });
    const days = groupSlotsByDay(slots, TZ);
    expect(days.map((d) => d.key)).toEqual([
      '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'
    ]);
    expect(days.map((d) => d.slots.length)).toEqual([16, 16, 16, 16, 16]);
  });
});

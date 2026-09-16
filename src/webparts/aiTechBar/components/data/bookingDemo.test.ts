import { demoBookingContext, demoBusyByStaff } from './bookingDemo';
import { generateSlots, groupSlotsByDay, zoneWeekday } from './bookingSlots';

const TZ = 'Europe/Warsaw';
const NOW = new Date('2026-09-21T06:00:00Z');   // poniedziałek
const TO = new Date('2026-09-28T06:00:00Z');

const slotsFor = (serviceId: string): ReturnType<typeof generateSlots> => {
  const ctx = demoBookingContext();
  const service = ctx.services.filter((s) => s.id === serviceId)[0];
  return generateSlots({
    from: NOW,
    to: TO,
    now: NOW,
    timeZone: TZ,
    businessHours: ctx.businessHours,
    durationMin: service.durationMin,
    stepMin: service.stepMin,
    preBufferMin: service.preBufferMin,
    postBufferMin: service.postBufferMin,
    minimumLeadTimeMin: service.minimumLeadTimeMin,
    busyByStaff: demoBusyByStaff(serviceId, NOW, TO, TZ)
  });
};

describe('kontekst demonstracyjny', () => {
  it('odwzorowuje dwie lokalizacje po 30 minut', () => {
    const ctx = demoBookingContext();
    expect(ctx.services.length).toBe(2);
    expect(ctx.services.map((s) => s.displayName)).toEqual([
      'Kraków – AI Tech Bar',
      'Warszawa – AI Tech Bar'
    ]);
    ctx.services.forEach((s) => {
      expect(s.durationMin).toBe(30);
      expect(s.stepMin).toBe(30);
      expect(s.staffMemberIds.length).toBe(1);
    });
  });

  it('ustawia godziny 11:00–15:30 od poniedziałku do piątku', () => {
    const ctx = demoBookingContext();
    expect(ctx.businessHours.map((d) => d.day)).toEqual([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
    ]);
    ctx.businessHours.forEach((d) => {
      expect(d.timeSlots).toEqual([{ startTime: '11:00:00', endTime: '15:30:00' }]);
    });
  });
});

describe('zajętość demonstracyjna', () => {
  it('jest deterministyczna, więc terminy nie skaczą przy renderach', () => {
    const first = demoBusyByStaff('demo-krakow', NOW, TO, TZ)[0].map((b) => b.start.toISOString());
    const second = demoBusyByStaff('demo-krakow', NOW, TO, TZ)[0].map((b) => b.start.toISOString());
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it('różni się między Krakowem a Warszawą', () => {
    const krakow = slotsFor('demo-krakow').map((s) => s.start.toISOString());
    const warszawa = slotsFor('demo-warszawa').map((s) => s.start.toISOString());
    expect(krakow).not.toEqual(warszawa);
  });

  it('zostawia wolne terminy w każdy dzień roboczy i żadnego w weekend', () => {
    const days = groupSlotsByDay(slotsFor('demo-krakow'), TZ);
    expect(days.length).toBe(5);
    days.forEach((day) => {
      const weekday = zoneWeekday(day.date, TZ);
      expect(['saturday', 'sunday']).not.toContain(weekday);
      // Dziennie 9 terminów w siatce minus 2–3 zajęte (mogą się powtarzać).
      expect(day.slots.length).toBeGreaterThanOrEqual(6);
      expect(day.slots.length).toBeLessThanOrEqual(8);
    });
  });

  it('nie wychodzi poza godziny 11:00–15:00 jako start wizyty', () => {
    const times = groupSlotsByDay(slotsFor('demo-warszawa'), TZ)[0].slots
      .map((s) => new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit', minute: '2-digit', timeZone: TZ
      }).format(s.start));
    times.forEach((time) => {
      expect(time >= '11:00' && time <= '15:00').toBe(true);
    });
  });
});

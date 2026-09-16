// =============================================================================
// Dodawanie wizyty do kalendarza bez udziału Graph.
//
// Używane w dwóch sytuacjach:
//  1) jako awaryjna ścieżka, gdy uprawnienia Graph nie są jeszcze zatwierdzone
//     albo Bookings odrzuci zapis — użytkownik nie zostaje wtedy z niczym,
//  2) jako przycisk „dodaj do mojego kalendarza" po udanej rezerwacji, żeby
//     wydarzenie trafiło do kalendarza od razu, bez czekania na zaproszenie.
//
// Uwaga: sam plik .ics NIE rezerwuje terminu po stronie Tech Baru.
// =============================================================================

export interface ICalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

/** Format daty ICS w UTC: 20260917T080000Z */
const icsStamp = (date: Date): string =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

const escapeText = (value: string): string =>
  (value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** RFC 5545 wymaga zawijania linii dłuższych niż 75 oktetów. */
const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join('\r\n');
};

export const buildIcs = (event: ICalendarEvent): string => {
  const uid = `aitechbar-${event.start.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Tech Bar//SPFx//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:AI Tech Bar',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.map(foldLine).join('\r\n');
};

export const downloadIcs = (event: ICalendarEvent, fileName: string): void => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.toLowerCase().indexOf('.ics') > -1 ? fileName : `${fileName}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Zwolnienie z opóźnieniem — Safari przerywa pobieranie, gdy URL zniknie od razu.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/** Deeplink do nowego wydarzenia w Outlook Web z wypełnionymi polami. */
export const outlookDeepLink = (event: ICalendarEvent): string => {
  const params = [
    'path=/calendar/action/compose',
    'rru=addevent',
    `subject=${encodeURIComponent(event.title)}`,
    `startdt=${encodeURIComponent(event.start.toISOString())}`,
    `enddt=${encodeURIComponent(event.end.toISOString())}`,
    `body=${encodeURIComponent(event.description)}`,
    `location=${encodeURIComponent(event.location)}`
  ].join('&');
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params}`;
};

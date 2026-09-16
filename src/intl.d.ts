// `Intl.DateTimeFormat.prototype.formatToParts` pochodzi z ES2017, a rig SPFx
// celowo trzyma wąski zestaw `lib` (es5 + wybrane es2015). Zamiast podnosić
// całą konfigurację kompilatora dopisujemy tylko ten jeden brakujący fragment
// typów — API jest dostępne we wszystkich przeglądarkach wspieranych przez
// SharePoint Framework i używamy go do poprawnego liczenia stref czasowych
// przy wyznaczaniu wolnych terminów wizyt.
declare namespace Intl {
  type DateTimeFormatPartType =
    | 'day'
    | 'dayPeriod'
    | 'era'
    | 'hour'
    | 'literal'
    | 'minute'
    | 'month'
    | 'second'
    | 'timeZoneName'
    | 'weekday'
    | 'year';

  interface DateTimeFormatPart {
    type: DateTimeFormatPartType;
    value: string;
  }

  interface DateTimeFormat {
    formatToParts(date?: Date | number): DateTimeFormatPart[];
  }
}

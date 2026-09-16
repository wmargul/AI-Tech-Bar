import * as React from 'react';
import styles from '../AiTechBar.module.scss';

export interface IBookingCalendarProps {
  locale: string;
  /** Liczba wolnych terminów w dniu, kluczowana 'YYYY-MM-DD'. */
  slotsByDay: { [dayKey: string]: number };
  selectedDay: string;
  onSelectDay: (dayKey: string) => void;
  /** Pierwszy i ostatni dzień widełek rezerwacji ('YYYY-MM-DD'). */
  minDay: string;
  maxDay: string;
  labels: { prevMonth: string; nextMonth: string };
}

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
const dayKeyOf = (y: number, m: number, d: number): string => `${y}-${pad(m)}-${pad(d)}`;
const monthKeyOf = (y: number, m: number): string => `${y}-${pad(m)}`;

/** Siatka miesiąca z tygodniem zaczynającym się od poniedziałku. */
const monthCells = (y: number, m: number): (string | undefined)[] => {
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const cells: (string | undefined)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(undefined);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(dayKeyOf(y, m, d));
  return cells;
};

const BookingCalendar: React.FC<IBookingCalendarProps> = ({
  locale, slotsByDay, selectedDay, onSelectDay, minDay, maxDay, labels
}) => {
  const [year, setYear] = React.useState<number>(() => parseInt((selectedDay || minDay).slice(0, 4), 10));
  const [month, setMonth] = React.useState<number>(() => parseInt((selectedDay || minDay).slice(5, 7), 10));

  // Gdy zmiana usługi przestawi wybrany dzień na inny miesiąc — nadążamy za nim.
  React.useEffect(() => {
    if (!selectedDay) return;
    setYear(parseInt(selectedDay.slice(0, 4), 10));
    setMonth(parseInt(selectedDay.slice(5, 7), 10));
  }, [selectedDay]);

  const monthTitleFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [locale]
  );

  // Nagłówki dni tygodnia liczone od znanego poniedziałku (1 I 2024).
  const weekdayHeads = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
    const out: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      out.push(fmt.format(new Date(Date.UTC(2024, 0, 1 + i))).toUpperCase());
    }
    return out;
  }, [locale]);

  const cells = monthCells(year, month);
  const currentMonth = monthKeyOf(year, month);
  const canPrev = currentMonth > minDay.slice(0, 7);
  const canNext = currentMonth < maxDay.slice(0, 7);

  const shiftMonth = (delta: number): void => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
  };

  return (
    <div className={styles.bkCal}>
      <div className={styles.bkCalHead}>
        <button
          type="button"
          className={styles.bkCalNav}
          onClick={() => shiftMonth(-1)}
          disabled={!canPrev}
          aria-label={labels.prevMonth}
        >
          ‹
        </button>
        <span className={styles.bkCalMonth}>
          {monthTitleFmt.format(new Date(Date.UTC(year, month - 1, 1)))}
        </span>
        <button
          type="button"
          className={styles.bkCalNav}
          onClick={() => shiftMonth(1)}
          disabled={!canNext}
          aria-label={labels.nextMonth}
        >
          ›
        </button>
      </div>

      <div className={styles.bkCalWeek} aria-hidden="true">
        {weekdayHeads.map((head, i) => (
          <span key={i} className={styles.bkCalWeekDay}>{head}</span>
        ))}
      </div>

      <div className={styles.bkCalGrid} role="grid">
        {cells.map((key, i) => {
          if (!key) return <span key={`pad-${i}`} className={styles.bkCalPad} />;
          const count = slotsByDay[key] || 0;
          const free = count > 0;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              className={`${styles.bkCalDay} ${key === selectedDay ? styles.bkCalDayActive : ''} ${free ? styles.bkCalDayFree : ''}`}
              onClick={() => onSelectDay(key)}
              disabled={!free}
              aria-selected={key === selectedDay}
            >
              {parseInt(key.slice(8, 10), 10)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingCalendar;

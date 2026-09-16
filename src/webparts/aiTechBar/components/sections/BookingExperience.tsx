import * as React from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';
import styles from '../AiTechBar.module.scss';
import { IResolvedSettings, BOOKING } from '../data/config';
import { useL10n } from '../i18n';
import {
  IBookingContext,
  IBookingError,
  IBookingServiceOption,
  classifyError,
  createAppointment,
  loadBookingContext,
  loadBusyByStaff
} from '../data/bookingGraph';
import {
  ISlot,
  generateSlots,
  groupSlotsByDay,
  zoneDayKey,
  zoneOffsetMinutes
} from '../data/bookingSlots';
import { ICalendarEvent, downloadIcs, outlookDeepLink } from '../data/bookingIcs';
import { demoBookingContext, demoBusyByStaff } from '../data/bookingDemo';
import BookingCalendar from './BookingCalendar';

export interface IBookingExperienceProps {
  open: boolean;
  onClose: () => void;
  origin?: { x: number; y: number };
  settings: IResolvedSettings;
  /** Brak fabryki (np. workbench) — pokazujemy ścieżkę awaryjną. */
  graphFactory?: MSGraphClientFactory;
  userDisplayName: string;
  userEmail: string;
}

type Stage = 'loading' | 'pick' | 'confirm' | 'sending' | 'done' | 'fallback' | 'failed';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Klawisze, którymi strona pod overlayem przewija panele — blokujemy je. */
const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7.5V12l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const BookingExperience: React.FC<IBookingExperienceProps> = ({
  open, onClose, origin, settings, graphFactory, userDisplayName, userEmail
}) => {
  const { t, lang } = useL10n();
  const s = t.bookingFlow;
  const tz = settings.booking.timeZone;
  // Bez fabryki Graph (workbench) demo jest jedyną sensowną ścieżką — inaczej
  // overlay pokazałby wyłącznie błąd uprawnień.
  const demo = settings.booking.demoMode || !graphFactory;

  const panelRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef<boolean>(false);
  // Trzymamy promise, nie gotowego klienta — przypisanie jest synchroniczne,
  // więc równoległe wywołania współdzielą jedną inicjalizację.
  const clientRef = React.useRef<Promise<MSGraphClientV3> | undefined>(undefined);

  const getClient = React.useCallback((): Promise<MSGraphClientV3> => {
    if (!graphFactory) return Promise.reject(new Error('Microsoft Graph niedostępny.'));
    if (!clientRef.current) clientRef.current = graphFactory.getClient('3');
    return clientRef.current;
  }, [graphFactory]);

  const [stage, setStage] = React.useState<Stage>('loading');
  const [slotsLoading, setSlotsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<IBookingError | undefined>(undefined);
  const [context, setContext] = React.useState<IBookingContext | undefined>(undefined);
  const [service, setService] = React.useState<IBookingServiceOption | undefined>(undefined);
  const [slots, setSlots] = React.useState<ISlot[]>([]);
  const [selectedDay, setSelectedDay] = React.useState<string>('');
  const [slot, setSlot] = React.useState<ISlot | undefined>(undefined);
  const [notes, setNotes] = React.useState<string>('');
  const [name, setName] = React.useState<string>(userDisplayName);
  const [email, setEmail] = React.useState<string>(userEmail);

  // --- Formatowanie czasu w strefie Tech Baru ---------------------------------
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const timeFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: tz }),
    [locale, tz]
  );
  const longDayFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: tz
    }),
    [locale, tz]
  );
  const headingDayFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    [locale]
  );

  /** Etykieta strefy w stylu „(UTC+01:00) Europe/Warsaw". */
  const tzLabel = React.useMemo((): string => {
    const offset = zoneOffsetMinutes(new Date(), tz);
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    const two = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
    return `(UTC${sign}${two(hh)}:${two(mm)}) ${tz.replace(/_/g, ' ')}`;
  }, [tz]);

  // --- Wejście / wyjście overlaya ---------------------------------------------
  React.useEffect(() => {
    if (!open) return undefined;
    const el = panelRef.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1, x: 0, y: 0 });
      return undefined;
    }
    // Panel „wyrasta" z miejsca kliknięcia w kartę — tak jak pozostałe overlaye.
    const dx = origin ? (origin.x - window.innerWidth / 2) * 0.25 : 0;
    const dy = origin ? (origin.y - window.innerHeight / 2) * 0.25 : 0;
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.88, x: dx, y: dy },
      { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.65, ease: 'expo.out', clearProps: 'transform' }
    );
    return undefined;
  }, [open, origin]);

  const requestClose = React.useCallback((): void => {
    if (closingRef.current) return;
    const el = panelRef.current;
    if (!el || prefersReducedMotion()) { onClose(); return; }
    closingRef.current = true;
    gsap.to(el, {
      opacity: 0, scale: 0.92, duration: 0.32, ease: 'power2.in',
      onComplete: () => { closingRef.current = false; onClose(); }
    });
  }, [onClose]);

  // Escape zamyka, a klawisze nawigacji nie mogą przewijać strony pod spodem.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (!typing && NAV_KEYS.indexOf(e.key) > -1) e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, requestClose]);

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // --- Pobranie konfiguracji kalendarza ---------------------------------------
  const loadContext = React.useCallback(async (): Promise<void> => {
    if (demo) {
      const ctx = demoBookingContext();
      setContext(ctx);
      setService(ctx.services[0]);
      setError(undefined);
      setStage('pick');
      return;
    }
    setStage('loading');
    setError(undefined);
    try {
      const client = await getClient();
      const ctx = await loadBookingContext(
        client,
        settings.booking.businessId,
        BOOKING.fallbackHours,
        BOOKING.fallbackDurationMin
      );
      setContext(ctx);
      if (ctx.services.length === 0) {
        setError({ kind: 'notFound', message: 'Kalendarz nie udostępnia żadnej usługi.' });
        setStage('failed');
        return;
      }
      // Pierwsza lokalizacja zaznaczona od razu — kalendarz ma co pokazać.
      setService(ctx.services[0]);
      setStage('pick');
    } catch (e) {
      setError(classifyError(e));
      setStage('failed');
    }
  }, [demo, getClient, settings.booking.businessId]);

  React.useEffect(() => {
    if (!open) return;
    setStage('loading');
    setService(undefined);
    setSlot(undefined);
    setSlots([]);
    setSelectedDay('');
    setNotes('');
    setName(userDisplayName);
    setEmail(userEmail);
    loadContext().catch(() => { /* obsłużone w loadContext */ });
  }, [open, loadContext, userDisplayName, userEmail]);

  // --- Wyliczenie wolnych terminów dla wybranej lokalizacji -------------------
  React.useEffect(() => {
    if (!open || !service || !context) return undefined;
    let active = true;
    setSlotsLoading(true);

    const run = async (): Promise<void> => {
      const now = new Date();
      const horizonDays = service.maximumAdvanceDays > 0
        ? Math.min(service.maximumAdvanceDays, settings.booking.daysAhead)
        : settings.booking.daysAhead;
      const to = new Date(now.getTime() + horizonDays * 86400000);

      // Każda lokalizacja ma własną obsługę, więc free/busy sprawdzamy tylko
      // dla ekspertów przypisanych do tej usługi.
      const pool = service.staffMemberIds.length > 0
        ? context.staff.filter((m) => service.staffMemberIds.indexOf(m.id) > -1)
        : context.staff;

      let busyByStaff: { start: Date; end: Date }[][] = [];
      try {
        busyByStaff = demo
          ? demoBusyByStaff(service.id, now, to, tz)
          : await loadBusyByStaff(
            await getClient(),
            pool.map((m) => m.emailAddress),
            now,
            to,
            Math.max(5, Math.min(service.durationMin, 60))
          );
      } catch (e) {
        // Brak wglądu we free/busy nie może zablokować rezerwacji — Bookings
        // i tak odrzuci zajęty termin przy zapisie.
        const classified = classifyError(e);
        if (classified.kind !== 'permissions') {
          if (!active) return;
          setError(classified);
          setStage('failed');
          return;
        }
      }

      const generated = generateSlots({
        from: now,
        to,
        now,
        timeZone: tz,
        businessHours: context.businessHours,
        durationMin: service.durationMin,
        stepMin: service.stepMin,
        preBufferMin: service.preBufferMin,
        postBufferMin: service.postBufferMin,
        minimumLeadTimeMin: service.minimumLeadTimeMin,
        busyByStaff
      });

      if (!active) return;
      setSlots(generated);
      setSlotsLoading(false);

      // Utrzymujemy wybrany dzień, jeśli w nowej lokalizacji nadal ma terminy.
      const days = groupSlotsByDay(generated, tz);
      setSelectedDay((prev) => {
        if (prev && days.filter((d) => d.key === prev).length > 0) return prev;
        return days.length > 0 ? days[0].key : '';
      });
    };

    run().catch(() => {
      if (!active) return;
      setSlotsLoading(false);
      setError({ kind: 'unknown', message: 'Nie udało się wyliczyć terminów.' });
      setStage('failed');
    });

    return () => { active = false; };
  }, [open, service, context, tz, demo, getClient, settings.booking.daysAhead]);

  // --- Zapis rezerwacji -------------------------------------------------------
  const calendarEvent = React.useMemo((): ICalendarEvent | undefined => {
    if (!slot || !service) return undefined;
    return {
      title: `AI Tech Bar — ${service.displayName}`,
      description: notes || service.description || s.title,
      location: service.isOnline ? s.online : service.displayName,
      start: slot.start,
      end: slot.end
    };
  }, [slot, service, notes, s.online, s.title]);

  const submit = React.useCallback(async (): Promise<void> => {
    if (!slot || !service) return;
    setStage('sending');
    setError(undefined);
    if (demo) {
      // Nic nie zapisujemy — pokazujemy tylko, jak wygląda potwierdzenie.
      setStage('done');
      return;
    }
    try {
      const pool = service.staffMemberIds.length > 0
        ? service.staffMemberIds
        : (context ? context.staff.map((m) => m.id) : []);

      await createAppointment(await getClient(), {
        businessId: settings.booking.businessId,
        service,
        start: slot.start,
        end: slot.end,
        customerName: name,
        customerEmail: email,
        customerTimeZone: tz,
        notes,
        staffMemberIds: pool
      });
      setStage('done');
    } catch (e) {
      // Zapis się nie udał — użytkownik nie zostaje z niczym: proponujemy
      // dodanie wizyty do własnego kalendarza i kontakt z ekspertem.
      setError(classifyError(e));
      setStage('fallback');
    }
  }, [slot, service, context, demo, getClient, settings.booking.businessId, name, email, tz, notes]);

  if (!open) return null;

  const days = groupSlotsByDay(slots, tz);
  const slotsByDay: { [key: string]: number } = {};
  days.forEach((d) => { slotsByDay[d.key] = d.slots.length; });
  const activeDay = days.filter((d) => d.key === selectedDay)[0];

  const minDay = zoneDayKey(new Date(), tz);
  const maxDay = zoneDayKey(
    new Date(Date.now() + settings.booking.daysAhead * 86400000),
    tz
  );

  const errorText = (): string => {
    if (!error) return s.errorGeneric;
    if (error.kind === 'permissions') return s.errorPermissions;
    if (error.kind === 'rules') return s.errorRules;
    return s.errorGeneric;
  };

  const stepIndex = stage === 'pick' ? 0 : 1;
  const showSteps = stage === 'pick' || stage === 'confirm' || stage === 'sending';

  const overlay = (
    <div className={styles.bkOverlay} role="dialog" aria-modal="true" aria-label={s.title}>
      <button type="button" className={styles.bkScrim} onClick={requestClose} aria-label={s.close} />

      <div ref={panelRef} className={styles.bkPanel}>
        <div className={styles.bkHead}>
          <div>
            <div className={styles.bkEyebrow}>{s.eyebrow}</div>
            <h2 className={styles.bkTitle}>{s.title}</h2>
          </div>
          <button type="button" className={styles.bkClose} onClick={requestClose} aria-label={s.close}>×</button>
        </div>

        {demo && (
          <p className={styles.bkDemoBanner}>
            <span className={styles.bkDemoBadge}>{s.demoBadge}</span>
            {s.demoNote}
          </p>
        )}

        {showSteps && (
          <ol className={styles.bkSteps}>
            {[s.steps.slot, s.steps.confirm].map((label, i) => (
              <li
                key={label}
                className={`${styles.bkStep} ${i === stepIndex ? styles.bkStepActive : ''} ${i < stepIndex ? styles.bkStepDone : ''}`}
              >
                <span className={styles.bkStepDot}>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        )}

        <div className={styles.bkBody}>
          {stage === 'loading' && (
            <div className={styles.bkCenter}>
              <span className={styles.bkSpinner} aria-hidden="true" />
              <p className={styles.bkMuted}>{s.loading}</p>
            </div>
          )}

          {stage === 'pick' && context && service && (
            <>
              {context.services.length > 1 && (
                <>
                  <div className={styles.bkGroupHead}>
                    <span className={styles.bkGroupIcon}><CalendarIcon /></span>
                    {s.pickService}
                  </div>
                  <div className={styles.bkServiceGrid}>
                    {context.services.map((item) => {
                      const active = item.id === service.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.bkServiceCard} ${active ? styles.bkServiceCardActive : ''}`}
                          onClick={() => { setService(item); setSlot(undefined); }}
                          aria-pressed={active}
                        >
                          <span className={styles.bkServiceTop}>
                            <span className={styles.bkServiceName}>{item.displayName}</span>
                            <span className={`${styles.bkRadio} ${active ? styles.bkRadioOn : ''}`} aria-hidden="true">
                              {active ? '✓' : ''}
                            </span>
                          </span>
                          {item.description && (
                            <span className={styles.bkServiceDesc}>{item.description}</span>
                          )}
                          <span className={styles.bkServiceMeta}>
                            <span className={styles.bkChip}>{item.durationMin} {s.minutes}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.bkForPill}>
                    {s.bookingFor}: <strong>{service.displayName}</strong>
                  </div>
                </>
              )}

              {slotsLoading ? (
                <div className={styles.bkCenter}>
                  <span className={styles.bkSpinner} aria-hidden="true" />
                  <p className={styles.bkMuted}>{s.loading}</p>
                </div>
              ) : days.length === 0 ? (
                <div className={styles.bkCenter}>
                  <p className={styles.bkEmptyTitle}>{s.noSlots}</p>
                  <p className={styles.bkMuted}>{s.noSlotsHint}</p>
                </div>
              ) : (
                <>
                  {selectedDay && (
                    <p className={styles.bkDayHeading}>
                      {headingDayFmt.format(new Date(`${selectedDay}T12:00:00Z`))}
                    </p>
                  )}

                  <div className={styles.bkPickGrid}>
                    <div className={styles.bkPickCol}>
                      <div className={styles.bkGroupHead}>
                        <span className={styles.bkGroupIcon}><CalendarIcon /></span>
                        {s.dateLabel}
                      </div>
                      <BookingCalendar
                        locale={locale}
                        slotsByDay={slotsByDay}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        minDay={minDay}
                        maxDay={maxDay}
                        labels={{ prevMonth: s.prevMonth, nextMonth: s.nextMonth }}
                      />
                    </div>

                    <div className={styles.bkPickCol}>
                      <div className={styles.bkGroupHead}>
                        <span className={styles.bkGroupIcon}><ClockIcon /></span>
                        {s.timeLabel}
                      </div>
                      {activeDay ? (
                        <div className={styles.bkSlotGrid}>
                          {activeDay.slots.map((item) => (
                            <button
                              key={item.start.getTime()}
                              type="button"
                              className={styles.bkSlot}
                              onClick={() => { setSlot(item); setStage('confirm'); }}
                            >
                              {timeFmt.format(item.start)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.bkMuted}>{s.pickDay}</p>
                      )}
                    </div>
                  </div>

                  <p className={styles.bkTzNote}>
                    <GlobeIcon />
                    {s.allTimesIn} {tzLabel}
                  </p>
                </>
              )}
            </>
          )}

          {(stage === 'confirm' || stage === 'sending') && slot && service && (
            <>
              <dl className={styles.bkSummary}>
                <div className={styles.bkSummaryRow}>
                  <dt>{s.summaryWhat}</dt>
                  <dd>{service.displayName} · {service.durationMin} {s.minutes}</dd>
                </div>
                <div className={styles.bkSummaryRow}>
                  <dt>{s.summaryWhen}</dt>
                  <dd>{longDayFmt.format(slot.start)}</dd>
                </div>
                <div className={styles.bkSummaryRow}>
                  <dt>{s.summaryWho}</dt>
                  <dd>{name || email}</dd>
                </div>
              </dl>

              <div className={styles.bkFields}>
                <label className={styles.bkField}>
                  <span className={styles.bkFieldLabel}>{s.nameLabel}</span>
                  <input
                    className={styles.bkInput}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={stage === 'sending'}
                  />
                </label>
                <label className={styles.bkField}>
                  <span className={styles.bkFieldLabel}>{s.emailLabel}</span>
                  <input
                    className={styles.bkInput}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={stage === 'sending'}
                  />
                </label>
              </div>

              <label className={styles.bkField}>
                <span className={styles.bkFieldLabel}>{s.notesLabel}</span>
                <textarea
                  className={styles.bkTextarea}
                  rows={3}
                  value={notes}
                  placeholder={s.notesPlaceholder}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={stage === 'sending'}
                />
              </label>

              {error && <p className={styles.bkError}>{errorText()}</p>}

              <div className={styles.bkActions}>
                <button
                  type="button"
                  className={styles.bkGhostBtn}
                  onClick={() => { setStage('pick'); setError(undefined); }}
                  disabled={stage === 'sending'}
                >
                  {s.back}
                </button>
                <button
                  type="button"
                  className={styles.bkPrimaryBtn}
                  onClick={() => { submit().catch(() => undefined); }}
                  disabled={stage === 'sending' || !email}
                >
                  {stage === 'sending' ? s.submitting : s.submit}
                  {stage !== 'sending' && <ArrowIcon />}
                </button>
              </div>
            </>
          )}

          {stage === 'done' && slot && (
            <div className={styles.bkCenter}>
              <span className={styles.bkTick} aria-hidden="true">✓</span>
              <h3 className={styles.bkDoneTitle}>{demo ? s.demoDoneTitle : s.successTitle}</h3>
              <p className={styles.bkDoneWhen}>{longDayFmt.format(slot.start)}</p>
              <p className={styles.bkMuted}>{demo ? s.demoDoneLead : s.successMail}</p>
              <div className={styles.bkActions}>
                {calendarEvent && (
                  <button
                    type="button"
                    className={styles.bkGhostBtn}
                    onClick={() => downloadIcs(calendarEvent, 'ai-tech-bar')}
                  >
                    {s.addToCalendar}
                  </button>
                )}
                <button type="button" className={styles.bkPrimaryBtn} onClick={requestClose}>
                  {s.done}
                </button>
              </div>
            </div>
          )}

          {stage === 'fallback' && calendarEvent && (
            <div className={styles.bkCenter}>
              <h3 className={styles.bkDoneTitle}>{s.fallbackTitle}</h3>
              <p className={styles.bkMuted}>{s.fallbackLead}</p>
              <p className={styles.bkError}>{errorText()}</p>
              <div className={styles.bkActions}>
                <button
                  type="button"
                  className={styles.bkGhostBtn}
                  onClick={() => downloadIcs(calendarEvent, 'ai-tech-bar')}
                >
                  {s.fallbackCta}
                </button>
                <a
                  className={styles.bkPrimaryBtn}
                  href={outlookDeepLink(calendarEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.openOutlook}
                  <ArrowIcon />
                </a>
              </div>
            </div>
          )}

          {stage === 'failed' && (
            <div className={styles.bkCenter}>
              <p className={styles.bkEmptyTitle}>{errorText()}</p>
              <div className={styles.bkActions}>
                <button
                  type="button"
                  className={styles.bkGhostBtn}
                  onClick={() => { loadContext().catch(() => undefined); }}
                >
                  {s.retry}
                </button>
                {settings.links.booking && settings.links.booking !== '#' && (
                  <a
                    className={styles.bkPrimaryBtn}
                    href={settings.links.booking}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.openOriginal}
                    <ArrowIcon />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};

export default BookingExperience;

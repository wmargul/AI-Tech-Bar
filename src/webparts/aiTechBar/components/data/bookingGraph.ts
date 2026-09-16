// =============================================================================
// Warstwa Microsoft Graph dla rezerwacji wizyt w AI Tech Bar.
//
// Wszystkie wywołania są delegowane (działają jako zalogowany użytkownik) i
// wymagają zgody administratora na uprawnienia zadeklarowane w
// config/package-solution.json:
//   Bookings.Read.All                 — usługi, eksperci, godziny pracy
//   Calendars.Read                    — free/busy ekspertów (getSchedule)
//   BookingsAppointment.ReadWrite.All — utworzenie rezerwacji
//
// Uwaga: `getStaffAvailability` z Bookings jest dostępne wyłącznie dla
// uprawnień aplikacyjnych, dlatego dostępność czytamy przez `getSchedule`.
// =============================================================================

import { MSGraphClientV3 } from '@microsoft/sp-http';
import {
  IBusyInterval,
  IWorkHoursDay,
  parseIsoDurationMinutes,
  weekdayHours
} from './bookingSlots';

export interface IBookingServiceOption {
  id: string;
  displayName: string;
  description: string;
  durationMin: number;
  preBufferMin: number;
  postBufferMin: number;
  stepMin: number;
  minimumLeadTimeMin: number;
  maximumAdvanceDays: number;
  allowStaffSelection: boolean;
  staffMemberIds: string[];
  isOnline: boolean;
}

export interface IBookingStaff {
  id: string;
  displayName: string;
  emailAddress: string;
}

export interface IBookingContext {
  services: IBookingServiceOption[];
  staff: IBookingStaff[];
  businessHours: IWorkHoursDay[];
}

export type BookingErrorKind = 'permissions' | 'notFound' | 'rules' | 'network' | 'unknown';

export interface IBookingError {
  kind: BookingErrorKind;
  status?: number;
  message: string;
}

// --- Typy odpowiedzi Graph (tylko pola, których naprawdę używamy) -------------

interface IGraphDateTime {
  dateTime: string;
  timeZone?: string;
}

interface IGraphSchedulingPolicy {
  timeSlotInterval?: string;
  minimumLeadTime?: string;
  maximumAdvance?: string;
  allowStaffSelection?: boolean;
}

interface IGraphService {
  id?: string;
  displayName?: string;
  description?: string;
  defaultDuration?: string;
  preBuffer?: string;
  postBuffer?: string;
  isHiddenFromCustomers?: boolean;
  isLocationOnline?: boolean;
  staffMemberIds?: string[];
  schedulingPolicy?: IGraphSchedulingPolicy;
}

interface IGraphStaffMember {
  id?: string;
  displayName?: string;
  emailAddress?: string;
}

interface IGraphBusiness {
  businessHours?: IWorkHoursDay[];
  schedulingPolicy?: IGraphSchedulingPolicy;
}

interface IGraphScheduleItem {
  status?: string;
  start?: IGraphDateTime;
  end?: IGraphDateTime;
}

interface IGraphScheduleEntry {
  scheduleId?: string;
  scheduleItems?: IGraphScheduleItem[];
}

interface IGraphCollection<T> {
  value?: T[];
}

// --- Pomocnicze ---------------------------------------------------------------

const businessPath = (businessId: string): string =>
  `/solutions/bookingBusinesses/${encodeURIComponent(businessId)}`;

/** Graph zwraca czas bez strefy w polu `dateTime` — dla UTC trzeba dodać 'Z'. */
const parseGraphDateTime = (value: IGraphDateTime | undefined): Date | undefined => {
  if (!value || !value.dateTime) return undefined;
  const raw = value.dateTime;
  const zone = (value.timeZone || 'UTC').toLowerCase();
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const iso = hasZone || zone !== 'utc' ? raw : `${raw}Z`;
  const parsed = new Date(iso);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

/** Format wymagany przez Graph dla dateTimeTimeZone w strefie UTC. */
export const toGraphUtc = (date: Date): IGraphDateTime => ({
  dateTime: date.toISOString().replace(/\.\d{3}Z$/, '.0000000'),
  timeZone: 'UTC'
});

const statusIsBusy = (status: string | undefined): boolean => {
  const s = (status || '').toLowerCase();
  return s !== '' && s !== 'free' && s !== 'unknown';
};

export const classifyError = (error: unknown): IBookingError => {
  const e = (error || {}) as { statusCode?: number; status?: number; message?: string; code?: string };
  const status = typeof e.statusCode === 'number' ? e.statusCode : e.status;
  const message = e.message || 'Nieznany błąd Microsoft Graph.';

  if (status === 401 || status === 403) return { kind: 'permissions', status, message };
  if (status === 404) return { kind: 'notFound', status, message };
  if (status === 400 || status === 409 || status === 422) return { kind: 'rules', status, message };
  if (typeof status !== 'number') return { kind: 'network', message };
  return { kind: 'unknown', status, message };
};

// --- Odczyt konfiguracji kalendarza ------------------------------------------

const mapService = (
  raw: IGraphService,
  businessPolicy: IGraphSchedulingPolicy | undefined,
  fallbackDurationMin: number
): IBookingServiceOption => {
  const policy = raw.schedulingPolicy || businessPolicy || {};
  const duration = parseIsoDurationMinutes(raw.defaultDuration);
  const maxAdvanceMin = parseIsoDurationMinutes(policy.maximumAdvance);

  return {
    id: raw.id || '',
    displayName: raw.displayName || '',
    description: raw.description || '',
    durationMin: duration && duration > 0 ? duration : fallbackDurationMin,
    preBufferMin: parseIsoDurationMinutes(raw.preBuffer) || 0,
    postBufferMin: parseIsoDurationMinutes(raw.postBuffer) || 0,
    stepMin: parseIsoDurationMinutes(policy.timeSlotInterval) || 0,
    minimumLeadTimeMin: parseIsoDurationMinutes(policy.minimumLeadTime) || 0,
    maximumAdvanceDays: maxAdvanceMin ? Math.round(maxAdvanceMin / 1440) : 0,
    allowStaffSelection: policy.allowStaffSelection === true,
    staffMemberIds: raw.staffMemberIds || [],
    isOnline: raw.isLocationOnline === true
  };
};

export const loadBookingContext = async (
  client: MSGraphClientV3,
  businessId: string,
  fallbackHours: { start: string; end: string },
  fallbackDurationMin: number
): Promise<IBookingContext> => {
  const base = businessPath(businessId);

  const [business, services, staff] = await Promise.all([
    client.api(base).version('v1.0').get() as Promise<IGraphBusiness>,
    client.api(`${base}/services`).version('v1.0').get() as Promise<IGraphCollection<IGraphService>>,
    client.api(`${base}/staffMembers`).version('v1.0').get() as Promise<IGraphCollection<IGraphStaffMember>>
  ]);

  const businessHours = business && business.businessHours && business.businessHours.length > 0
    ? business.businessHours
    : weekdayHours(fallbackHours.start, fallbackHours.end);

  const visibleServices = (services.value || [])
    .filter((s) => s.isHiddenFromCustomers !== true && !!s.id)
    .map((s) => mapService(s, business ? business.schedulingPolicy : undefined, fallbackDurationMin));

  const staffList = (staff.value || [])
    .filter((s) => !!s.id && !!s.emailAddress)
    .map((s) => ({
      id: s.id as string,
      displayName: s.displayName || (s.emailAddress as string),
      emailAddress: s.emailAddress as string
    }));

  return { services: visibleServices, staff: staffList, businessHours };
};

// --- Free/busy ekspertów ------------------------------------------------------

/**
 * Zwraca zajętość osobno dla każdego adresu z `emails` (kolejność zachowana),
 * żeby wyżej móc uznać termin za wolny, gdy wolny jest choć jeden ekspert.
 * getSchedule przyjmuje maksymalnie 20 adresów i zakres krótszy niż 62 dni.
 */
export const loadBusyByStaff = async (
  client: MSGraphClientV3,
  emails: string[],
  from: Date,
  to: Date,
  intervalMin: number
): Promise<IBusyInterval[][]> => {
  if (emails.length === 0) return [];
  const schedules = emails.slice(0, 20);

  const response = await client
    .api('/me/calendar/getSchedule')
    .version('v1.0')
    .post({
      schedules,
      startTime: toGraphUtc(from),
      endTime: toGraphUtc(to),
      availabilityViewInterval: Math.max(5, Math.min(1440, intervalMin))
    }) as IGraphCollection<IGraphScheduleEntry>;

  const byEmail: { [email: string]: IBusyInterval[] } = {};
  (response.value || []).forEach((entry) => {
    const key = (entry.scheduleId || '').toLowerCase();
    const intervals: IBusyInterval[] = [];
    (entry.scheduleItems || []).forEach((item) => {
      if (!statusIsBusy(item.status)) return;
      const start = parseGraphDateTime(item.start);
      const end = parseGraphDateTime(item.end);
      if (start && end && end.getTime() > start.getTime()) intervals.push({ start, end });
    });
    byEmail[key] = intervals;
  });

  return schedules.map((email) => byEmail[email.toLowerCase()] || []);
};

// --- Utworzenie rezerwacji ----------------------------------------------------

export interface ICreateAppointmentInput {
  businessId: string;
  service: IBookingServiceOption;
  start: Date;
  end: Date;
  customerName: string;
  customerEmail: string;
  customerTimeZone: string;
  notes: string;
  staffMemberIds: string[];
}

export interface ICreatedAppointment {
  id: string;
  joinWebUrl?: string;
}

interface IGraphAppointmentResponse {
  id?: string;
  joinWebUrl?: string;
  onlineMeetingUrl?: string;
}

export const createAppointment = async (
  client: MSGraphClientV3,
  input: ICreateAppointmentInput
): Promise<ICreatedAppointment> => {
  // Payload musi trzymać się business rules Bookings — m.in. staffMemberIds
  // wolno przekazać tylko wtedy, gdy kalendarz pozwala wybierać obsługę.
  const body: Record<string, unknown> = {
    '@odata.type': '#microsoft.graph.bookingAppointment',
    serviceId: input.service.id,
    startDateTime: { '@odata.type': '#microsoft.graph.dateTimeTimeZone', ...toGraphUtc(input.start) },
    endDateTime: { '@odata.type': '#microsoft.graph.dateTimeTimeZone', ...toGraphUtc(input.end) },
    customerTimeZone: input.customerTimeZone,
    customers: [
      {
        '@odata.type': '#microsoft.graph.bookingCustomerInformation',
        name: input.customerName,
        emailAddress: input.customerEmail,
        timeZone: input.customerTimeZone,
        notes: input.notes
      }
    ]
  };

  if (input.service.allowStaffSelection && input.staffMemberIds.length > 0) {
    body.staffMemberIds = input.staffMemberIds;
  }

  const created = await client
    .api(`${businessPath(input.businessId)}/appointments`)
    .version('v1.0')
    .post(body) as IGraphAppointmentResponse;

  return {
    id: created.id || '',
    joinWebUrl: created.joinWebUrl || created.onlineMeetingUrl
  };
};

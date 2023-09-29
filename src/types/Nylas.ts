export const NylasAuthProvider = [
  "icloud",
  "gmail",
  "office365",
  "exchange",
  "IMAP",
] as const;

export type NylasObject =
  | "event"
  | "calendar"
  | "contact"
  | "file"
  | "message"
  | "label";

export type Metadata = Record<string, unknown>;
export interface CalendarJSON {
  name: string;
  description: string | null;
  location: string | null;
  timezone: string | null;
  id: string;
  account_id: string;
  object: "calendar";
  read_only: boolean;
  is_primary?: boolean | null;
  hex_color: string | null;
  metadata?: Metadata;
}

export type CalendarsJSON = CalendarJSON[];

export type Calendar = Pick<
  CalendarJSON,
  "name" | "description" | "location" | "timezone" | "id" | "object"
> & {
  provider: (typeof NylasAuthProvider)[number];
  accountId: string;
  readOnly: boolean;
  isPrimary?: boolean | null;
  hexColor?: string | null;
  active: boolean;
};

export type Calendars = Calendar[];

export type ParticipantEventStatus = "yes" | "no" | "maybe" | "noreply";

export interface Participant {
  name?: string;
  email: string;
  status: ParticipantEventStatus;
  comment?: string;
  phone_number?: string;
}

export interface Recurrence {
  rrule: string[];
  timezone: string;
}

export type ReminderMethod = "email" | "popup" | "display" | "sound";

export interface Reminders {
  remainder_minutes: string;
  reminder_method: ReminderMethod;
}

export type WhenObject = "time" | "timespan" | "date" | "datespan";

export interface Time {
  object: "time";
  time: number;
  timezone: string;
}

export interface Timespan {
  object: "timespan";
  start_time: number;
  end_time: number;
  start_timezone?: string;
  end_timezone?: string;
}

export interface Date {
  object: "date";
  date: string;
}

export interface Datespan {
  object: "datespan";
  start_date: string;
  end_date: string;
}

export type When = Time | Timespan | Date | Datespan;

export interface ConferencingDetails {
  provider:
    | "Zoom Meeting"
    | "Google Meet"
    | "Microsoft Teams"
    | "WebEx"
    | "GoToMeeting";
  details: {
    url: string;

    // * Zoom, GoToMeeting
    meeting_code?: string;

    // * Zoom, WebEx
    password?: string;

    // * Google Meet, GoToMeeting
    phone?: string[];

    // * Google Meet, WebEx
    pin?: string;
  };

  // * This feature is still in Private preview, whatever that means
  // autocreate?: {}
}

export interface Conferencing {
  details: Details;
  provider: string;
}

export interface Details {
  meeting_code: string;
  phone: string[];
  url: string;
}

export type CalendarEventStatus = "confirmed" | "tentative" | "cancelled";

export type EventVisibility = "private" | "public" | "normal";

export interface EventJSON {
  account_id: string;
  busy: boolean;
  calendar_id: string;
  customer_event_id: string;
  description?: string;
  ical_uid?: string;
  id: string;
  location?: string;
  message_id: string;
  metadata?: Metadata;
  object: "event";
  owner: string;
  participants: Participant[];
  read_only: boolean;
  recurrence?: Recurrence;
  reminders: Reminders;
  status: CalendarEventStatus;
  title?: string;
  original_start_time?: number;
  visibility?: EventVisibility;
  when: When;
  organizer_email?: string;
  organizer_name?: string;
  conferencing?: Conferencing;
  hide_participants?: boolean;
  updated_at?: number;

  // * This feature is still in Private preview, whatever that means
  // notifications?: {};
}

export type EventsJSON = EventJSON[];

export type Event = Pick<
  EventJSON,
  "id" | "title" | "description" | "location" | "object" | "status"
> & {
  accountId: string;
  calendarId: string;
  reminders: {
    remainderMinutes: string;
    reminderMethod: ReminderMethod;
  };
  when:
    | Time
    | Date
    | {
        object: "timespan";
        startTime: number;
        endTime: number;
        startTimezone?: string;
        endTimezone?: string;
      }
    | {
        object: "datespan";
        startDate: string;
        endDate: string;
      };
  organizerEmail?: string;
  organizerName?: string;
  updatedAt?: number;
};

export type Events = Event[];

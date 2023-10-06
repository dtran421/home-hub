export type ReminderMethod = "email" | "popup";

export interface DefaultReminder {
  method: string;
  minutes: number;
}

export type ConferenceSolutionType =
  | "eventHangout"
  | "eventNamedHangout"
  | "hangoutsMeet";

export interface ConferenceProperties {
  allowedConferenceSolutionTypes: ConferenceSolutionType[];
}

export interface Notification {
  type: string;
  method: string;
}

export interface NotificationSettings {
  notifications: Notification[];
}

export type GoogleCalendarRole =
  | "owner"
  | "writer"
  | "reader"
  | "freeBusyReader";

export interface GoogleCalendarJSON {
  kind: "calendar#calendarListEntry";
  etag: string;
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole: GoogleCalendarRole;
  defaultReminders: DefaultReminder[];
  conferenceProperties?: ConferenceProperties;
  notificationSettings?: NotificationSettings;
  primary?: boolean;
}

export interface GoogleCalendarsJSON {
  kind: "calendar#calendarList";
  etag: string;
  nextSyncToken: string;
  items: GoogleCalendarJSON[];
}

export type GoogleCalendar = Pick<GoogleCalendarJSON, "id" | "kind"> & {
  name: string;
  description: string | null;
  timezone: string | null;
  readOnly: true;
  isPrimary?: boolean | null;
  hexColor?: string | null;
  active: boolean;
};

export type GoogleCalendars = GoogleCalendar[];

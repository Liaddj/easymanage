/**
 * Design hook for Google Calendar one-way sync (provider → Flow).
 * OAuth token exchange and event import ship in a later PR.
 * Client secrets stay on the API; nothing here is a payment integration.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
] as const;

export type GoogleCalendarConnection = {
  connected: boolean;
  googleAccountEmail?: string;
};

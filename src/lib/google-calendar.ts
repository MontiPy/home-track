export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  status: string;
  htmlLink: string;
}

/**
 * Sync events from a Google Calendar into the local database.
 *
 * TODO: Implement Google Calendar API integration.
 * - Use the Google Calendar v3 API to list events
 * - Map GoogleCalendarEvent to local CalendarEvent records
 * - Upsert events based on googleEventId to avoid duplicates
 * - Handle pagination for large calendars
 * - Support incremental sync via syncToken
 */
export async function syncFromGoogle(
  _accessToken: string,
  _calendarId: string
): Promise<GoogleCalendarEvent[]> {
  // TODO: Implement Google Calendar sync
  return [];
}

/**
 * Push a local event to Google Calendar.
 *
 * TODO: Implement pushing events to Google Calendar.
 * - Convert local event format to Google Calendar event resource
 * - Use the Google Calendar v3 API to insert/update the event
 * - Store the returned googleEventId on the local record
 * - Handle conflicts and error responses
 */
export async function pushToGoogle(
  _accessToken: string,
  _event: object
): Promise<void> {
  // TODO: Implement push to Google Calendar
}

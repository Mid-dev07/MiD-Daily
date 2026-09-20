export type GoogleCalendarSyncStatus = 'not-synced' | 'pending' | 'synced' | 'error'

export interface GoogleCalendarSyncMeta {
  status: GoogleCalendarSyncStatus
  calendarId: string
  eventId?: string
  lastSyncedAt?: string
  error?: string
}

export interface GoogleCalendarEventDateTime {
  dateTime: string
  timeZone: string
}

export interface GoogleCalendarEventPayload {
  summary: string
  description?: string
  location?: string
  start: GoogleCalendarEventDateTime
  end: GoogleCalendarEventDateTime
  extendedProperties: {
    private: {
      midDailyScheduleId: string
    }
  }
}

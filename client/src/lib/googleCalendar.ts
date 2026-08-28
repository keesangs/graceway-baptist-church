export type GoogleCalendarEvent = {
  title: string;
  start: Date | string;
  end?: Date | string | null;
  allDay: boolean;
  location?: string | null;
  description?: string | null;
};

function formatUtcDateTime(value: Date | string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function nextDateKey(value: Date | string) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + 1);
  return formatDateKey(next);
}

/** Builds a Google Calendar TEMPLATE URL; it never sends any event data from the website. */
export function createGoogleCalendarUrl(event: GoogleCalendarEvent) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("ctz", "America/Los_Angeles");
  const fallbackEnd = new Date(new Date(event.start).getTime() + 60 * 60 * 1000);
  url.searchParams.set(
    "dates",
    event.allDay
      ? `${formatDateKey(event.start)}/${event.end ? formatDateKey(event.end) : nextDateKey(event.start)}`
      : `${formatUtcDateTime(event.start)}/${formatUtcDateTime(event.end ?? fallbackEnd)}`,
  );
  if (event.location) url.searchParams.set("location", event.location);
  if (event.description) url.searchParams.set("details", event.description);
  return url.toString();
}

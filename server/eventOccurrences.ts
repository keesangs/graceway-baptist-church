export type CalendarEventSeries = {
  id: number;
  startAt: Date;
  endAt: Date | null;
  recurrence: "none" | "weekly";
  recurrenceUntil: Date | null;
};

export type CalendarEventOccurrence<T extends CalendarEventSeries = CalendarEventSeries> = T & {
  seriesId: number;
  occurrenceStart: Date;
  occurrenceEnd: Date | null;
  isRecurring: boolean;
};

const WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function occurrenceEndAt<T extends CalendarEventSeries>(event: T, occurrenceStart: Date) {
  if (!event.endAt) return null;
  const duration = Math.max(0, event.endAt.getTime() - event.startAt.getTime());
  return new Date(occurrenceStart.getTime() + duration);
}

function overlapsRange(startAt: Date, endAt: Date | null, rangeStart: Date, rangeEnd: Date) {
  const effectiveEnd = endAt ?? startAt;
  return startAt < rangeEnd && effectiveEnd >= rangeStart;
}

/**
 * Expands persisted event series only for the requested interval. A weekly series
 * is never copied into the database; editing or cancelling the base record affects
 * the whole series. `recurrenceUntil` is inclusive of an occurrence's start time.
 */
export function expandCalendarEventOccurrences<T extends CalendarEventSeries>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventOccurrence<T>[] {
  if (rangeEnd <= rangeStart) return [];

  const occurrences: CalendarEventOccurrence<T>[] = [];

  for (const event of events) {
    if (event.recurrence === "none") {
      if (overlapsRange(event.startAt, event.endAt, rangeStart, rangeEnd)) {
        occurrences.push({
          ...event,
          seriesId: event.id,
          occurrenceStart: event.startAt,
          occurrenceEnd: event.endAt,
          isRecurring: false,
        });
      }
      continue;
    }

    const duration = Math.max(0, (event.endAt?.getTime() ?? event.startAt.getTime()) - event.startAt.getTime());
    const firstRelevantStart = rangeStart.getTime() - duration;
    const offsetWeeks = Math.max(0, Math.ceil((firstRelevantStart - event.startAt.getTime()) / WEEK_IN_MILLISECONDS));
    let occurrenceStart = new Date(event.startAt.getTime() + offsetWeeks * WEEK_IN_MILLISECONDS);

    while (occurrenceStart < rangeEnd && (!event.recurrenceUntil || occurrenceStart <= event.recurrenceUntil)) {
      const occurrenceEnd = occurrenceEndAt(event, occurrenceStart);
      if (overlapsRange(occurrenceStart, occurrenceEnd, rangeStart, rangeEnd)) {
        occurrences.push({
          ...event,
          seriesId: event.id,
          occurrenceStart,
          occurrenceEnd,
          isRecurring: true,
        });
      }
      occurrenceStart = new Date(occurrenceStart.getTime() + WEEK_IN_MILLISECONDS);
    }
  }

  return occurrences.sort((left, right) => left.occurrenceStart.getTime() - right.occurrenceStart.getTime());
}

/** Return the next visible occurrences, including an already-started multi-hour event. */
export function getUpcomingCalendarEventOccurrences<T extends CalendarEventSeries>(
  events: T[],
  now: Date,
  limit: number,
): CalendarEventOccurrence<T>[] {
  const searchEnd = new Date(now.getTime());
  searchEnd.setUTCFullYear(searchEnd.getUTCFullYear() + 2);
  return expandCalendarEventOccurrences(events, now, searchEnd).slice(0, limit);
}

/**
 * Return the closest future special event. When staff have not yet categorized an
 * older one-off event as `special`, use the closest non-recurring non-service event
 * so a meaningful public highlight is not silently absent.
 */
export function getFeaturedSpecialCalendarEventOccurrence<T extends CalendarEventSeries & { eventType: string }>(
  events: T[],
  now: Date,
): CalendarEventOccurrence<T> | null {
  const categorizedSpecials = events.filter(event => event.eventType === "special");
  const fallbackOneOffEvents = events.filter(event => event.recurrence === "none" && !["worship", "prayer"].includes(event.eventType));
  const candidates = categorizedSpecials.length ? categorizedSpecials : fallbackOneOffEvents;
  return getUpcomingCalendarEventOccurrences(candidates, now, 1)[0] ?? null;
}

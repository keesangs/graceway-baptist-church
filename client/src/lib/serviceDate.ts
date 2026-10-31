export type ServiceDateValue = Date | string | null | undefined;

/** Extracts a valid YYYY.MM.DD-style service date embedded in a video label. */
export function getServiceDateFromLabel(value: string) {
  const match = value.match(/(20\d{2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3])
    ? date
    : null;
}

/** Resolves a service date from a dated label, readable date, or upload fallback. */
export function getServiceDateTimestamp(label: string, fallback: ServiceDateValue) {
  const embeddedDate = getServiceDateFromLabel(label);
  if (embeddedDate) return embeddedDate.getTime();

  const suppliedDate = new Date(label).getTime();
  if (!Number.isNaN(suppliedDate)) return suppliedDate;

  const parsedFallback = fallback == null ? Number.NaN : new Date(fallback).getTime();
  return Number.isNaN(parsedFallback) ? 0 : parsedFallback;
}

/** Returns a new array ordered newest Sunday service first. */
export function sortByServiceDateDesc<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  getFallback: (item: T) => ServiceDateValue,
) {
  return [...items].sort(
    (left, right) => getServiceDateTimestamp(getLabel(right), getFallback(right))
      - getServiceDateTimestamp(getLabel(left), getFallback(left)),
  );
}

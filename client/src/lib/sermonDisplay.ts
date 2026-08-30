export type SermonDisplayData = {
  date: string;
  title: string;
  titleKo: string;
  scripture: string;
  scriptureEn: string;
};

function getDateFromLabel(value: string) {
  const match = value.match(/(20\d{2})\.\s*(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function getSermonDateTimestamp(title: string, fallback: Date | string) {
  const embeddedDate = getDateFromLabel(title);
  if (embeddedDate) return embeddedDate.getTime();
  const parsed = new Date(fallback).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatSermonServiceDate({ date, title }: Pick<SermonDisplayData, "date" | "title">, lang: "ko" | "en") {
  const serviceDate = getDateFromLabel(title) ?? new Date(date);
  if (Number.isNaN(serviceDate.getTime())) return lang === "ko" ? "주일예배 말씀" : "Sunday Worship Message";

  if (lang === "ko") {
    const year = serviceDate.getUTCFullYear();
    const month = String(serviceDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(serviceDate.getUTCDate()).padStart(2, "0");
    return `${year}. ${month}.${day} 주일예배 말씀`;
  }

  return `${serviceDate.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })} Sunday Worship Message`;
}

export function getSermonMetadataLines(sermon: SermonDisplayData, lang: "ko" | "en") {
  if (lang === "ko") {
    return {
      date: formatSermonServiceDate(sermon, lang),
      title: sermon.titleKo,
      scripture: `본문: ${sermon.scripture}`,
    };
  }

  return {
    date: formatSermonServiceDate(sermon, lang),
    title: `Title: ${sermon.title}`,
    scripture: `Scripture: ${sermon.scriptureEn}`,
  };
}

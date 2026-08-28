import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Clock3, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { Calendar } from "@/components/ui/calendar";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const CHURCH_TIME_ZONE = "America/Los_Angeles";
const churchDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: CHURCH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type EventOccurrence = {
  id: number;
  seriesId: number;
  titleKo: string;
  titleEn: string | null;
  occurrenceStart: Date | string;
  occurrenceEnd: Date | string | null;
  allDay: number;
  venueKo: string | null;
  venueEn: string | null;
  descriptionKo: string | null;
  descriptionEn: string | null;
  eventType: "worship" | "prayer" | "fellowship" | "ministry" | "special" | "other";
  isRecurring: boolean;
};

function dateKey(value: Date | string) {
  const parts = Object.fromEntries(churchDateParts.formatToParts(new Date(value)).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { start, end };
}

const eventTypeLabels = {
  worship: { ko: "예배", en: "Worship" },
  prayer: { ko: "기도", en: "Prayer" },
  fellowship: { ko: "교제", en: "Fellowship" },
  ministry: { ko: "사역", en: "Ministry" },
  special: { ko: "특별 행사", en: "Special" },
  other: { ko: "행사", en: "Event" },
} as const;

function formatEventTime(event: EventOccurrence, lang: "ko" | "en") {
  if (event.allDay) return lang === "ko" ? "종일" : "All day";
  return new Date(event.occurrenceStart).toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: CHURCH_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventCard({ event, lang }: { event: EventOccurrence; lang: "ko" | "en" }) {
  const title = lang === "en" && event.titleEn ? event.titleEn : event.titleKo;
  const venue = lang === "en" && event.venueEn ? event.venueEn : event.venueKo;
  const description = lang === "en" && event.descriptionEn ? event.descriptionEn : event.descriptionKo;
  return (
    <article className="group rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5 transition-all duration-200 hover:border-[#B9955E]/55 hover:shadow-[0_10px_24px_rgba(22,59,89,0.07)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-[#F6F0E5] px-2 py-1 text-[0.68rem] font-semibold tracking-wide text-[#8A6420]">{eventTypeLabels[event.eventType][lang]}</span>
        {event.isRecurring && <span className="rounded-sm bg-[#E7EEF1] px-2 py-1 text-[0.68rem] font-semibold tracking-wide text-[#607A91]">{lang === "ko" ? "매주" : "Weekly"}</span>}
      </div>
      <h3 className="mt-3 font-serif text-xl font-semibold text-[#163B59]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#607A91]">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-[#B07834]" />{formatEventTime(event, lang)}</span>
        {venue && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-[#B07834]" />{venue}</span>}
      </div>
      {description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#44515C]">{description}</p>}
    </article>
  );
}

export default function Events() {
  const { lang, t } = useLang();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const range = useMemo(() => monthRange(month), [month]);
  const rangeInput = useMemo(() => ({ start: range.start, end: range.end }), [range]);
  const eventsQuery = trpc.events.listRange.useQuery(rangeInput);
  const upcomingQuery = trpc.events.upcoming.useQuery();
  const occurrences = (eventsQuery.data ?? []) as EventOccurrence[];
  const selectedKey = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}` : null;
  const selectedEvents = selectedKey ? occurrences.filter(event => dateKey(event.occurrenceStart) === selectedKey) : [];
  const eventDates = useMemo(() => Array.from(new Set(occurrences.map(event => dateKey(event.occurrenceStart)))).map(calendarDate), [occurrences]);
  const upcoming = (upcomingQuery.data ?? []) as EventOccurrence[];

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F7]">
      <Navbar />
      <BrandPageHero
        eyebrow={lang === "ko" ? "Church calendar" : "Church calendar"}
        title={lang === "ko" ? "일정과 행사" : "Events & calendar"}
        description={lang === "ko" ? "그레이스웨이의 예배, 기도회, 공동체 모임과 특별 행사를 한눈에 확인하세요." : "See Graceway worship services, prayer gatherings, community meetings, and special events in one place."}
        visual="path"
        imageSrc="/manus-storage/graceway-events-journey-2026_a03d3ec8.png"
      />

      <main className="container flex-1 py-12 md:py-16">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
          <section className="brand-surface rounded-xl border border-[#DCE4E7] p-4 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="mt-1 rounded-sm bg-[#F6F0E5] p-2 text-[#8A6420]"><CalendarDays className="size-5" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{t("home.calendar")}</p><h2 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "월간 일정" : "Monthly calendar"}</h2></div>
            </div>
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "bg-[#C9973E]/20 text-[#163B59] font-bold" }}
              className="w-full p-0 [&_.rdp-root]:w-full [&_.rdp-month]:w-full [&_.rdp-month_grid]:w-full"
            />
            <p className="mt-4 text-xs leading-relaxed text-[#607A91]">{lang === "ko" ? "금색으로 강조된 날짜에 예정된 일정이 있습니다. 날짜를 선택하면 자세한 내용을 확인할 수 있습니다. 모든 시간은 교회 현지 시간(PT) 기준입니다." : "Gold-highlighted dates have scheduled events. Select a date to see details. All times are shown in church local time (PT)."}</p>
          </section>

          <section aria-live="polite" className="rounded-xl border border-[#DCE4E7] bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{selectedDate ? (lang === "ko" ? "선택한 날짜" : "Selected date") : (lang === "ko" ? "행사 안내" : "Event details")}</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{selectedDate ? selectedDate.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric", weekday: "long" }) : (lang === "ko" ? "날짜를 선택하세요" : "Select a date")}</h2>
            <div className="mt-5 space-y-3">
              {eventsQuery.isLoading ? <p className="text-sm text-[#607A91]">{lang === "ko" ? "일정을 불러오는 중입니다…" : "Loading events…"}</p> : selectedDate && selectedEvents.length ? selectedEvents.map(event => <EventCard key={`${event.seriesId}-${new Date(event.occurrenceStart).toISOString()}`} event={event} lang={lang} />) : <div className="rounded-lg bg-[#F4F6F7] px-4 py-6 text-sm leading-6 text-[#607A91]">{selectedDate ? (lang === "ko" ? "선택한 날짜에 공개된 일정이 없습니다." : "There are no published events on this date.") : (lang === "ko" ? "달력에서 금색으로 강조된 날짜를 선택해 일정과 장소를 확인하세요." : "Select a gold-highlighted date on the calendar to see event times and locations.")}</div>}
            </div>
          </section>
        </div>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{lang === "ko" ? "Looking ahead" : "Looking ahead"}</p><h2 className="mt-1 font-serif text-3xl font-semibold text-[#163B59]">{t("home.upcomingEvents")}</h2></div><ChevronRight className="size-5 text-[#B07834]" /></div>
          {upcomingQuery.isLoading ? <p className="text-sm text-[#607A91]">{lang === "ko" ? "다가오는 일정을 불러오는 중입니다…" : "Loading upcoming events…"}</p> : upcoming.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{upcoming.map(event => <EventCard key={`${event.seriesId}-${new Date(event.occurrenceStart).toISOString()}`} event={event} lang={lang} />)}</div> : <div className="rounded-xl border border-dashed border-[#C8D4D9] bg-[#FFFEFB] px-6 py-12 text-center"><p className="font-serif text-xl font-semibold text-[#163B59]">{lang === "ko" ? "등록된 공개 일정이 아직 없습니다." : "No published events yet."}</p><p className="mt-2 text-sm text-[#607A91]">{lang === "ko" ? "새 일정이 공개되면 이곳에 자동으로 표시됩니다." : "Published events will appear here automatically."}</p></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

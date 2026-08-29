import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, CalendarPlus, ChevronRight, Clock3, Download, ExternalLink, Eye, FileText, MapPin, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { createGoogleCalendarUrl } from "@/lib/googleCalendar";
import { getCountdownParts } from "@/lib/eventCountdown";
import { VideoShareButton } from "@/components/VideoShareButton";
import { WeeklyNewsletterPdfPreview } from "@/components/WeeklyNewsletterPdfPreview";

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

type EventType = EventOccurrence["eventType"];
type EventFilter = "all" | EventType;

type WeeklyNewsletterIssue = {
  id: number;
  issueDate: string;
  titleKo: string;
  titleEn: string | null;
  driveFileId: string;
  storageUrl: string;
  fileSize: number;
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

function formatEventDate(event: EventOccurrence, lang: "ko" | "en") {
  return new Date(event.occurrenceStart).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: CHURCH_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatNewsletterDate(issueDate: string, lang: "ko" | "en") {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: CHURCH_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${issueDate}T12:00:00Z`));
}

function formatNewsletterFileSize(fileSize: number) {
  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

function newsletterYearMonth(issueDate: string) {
  const [year = "", month = ""] = issueDate.split("-");
  return { year, month };
}

function newsletterMonthLabel(month: string, lang: "ko" | "en") {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", { month: "long" }).format(new Date(Date.UTC(2026, Number(month) - 1, 1)));
}

function FeaturedCountdown({ startAt, lang }: { startAt: Date | string; lang: "ko" | "en" }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = getCountdownParts(startAt, now);
  if (countdown.hasStarted) {
    return <p className="mt-4 text-sm font-medium text-[#E5C484]">{lang === "ko" ? "행사가 시작되었습니다" : "This event has started"}</p>;
  }

  const units = [
    [countdown.days, lang === "ko" ? "일" : "Days"],
    [countdown.hours, lang === "ko" ? "시간" : "Hours"],
    [countdown.minutes, lang === "ko" ? "분" : "Min"],
  ] as const;
  return (
    <dl aria-label={lang === "ko" ? "행사 시작까지 남은 시간" : "Time remaining until the event"} className="mt-5 flex flex-wrap gap-2">
      {units.map(([value, label]) => <div key={label} className="min-w-15 rounded-sm border border-white/15 bg-white/8 px-3 py-2 text-center"><dd className="font-serif text-xl font-semibold leading-none text-white">{String(value).padStart(2, "0")}</dd><dt className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-[#D7E4EA]">{label}</dt></div>)}
    </dl>
  );
}

function EventCard({ event, lang, id }: { event: EventOccurrence; lang: "ko" | "en"; id?: string }) {
  const title = lang === "en" && event.titleEn ? event.titleEn : event.titleKo;
  const venue = lang === "en" && event.venueEn ? event.venueEn : event.venueKo;
  const description = lang === "en" && event.descriptionEn ? event.descriptionEn : event.descriptionKo;
  const googleCalendarUrl = createGoogleCalendarUrl({
    title,
    start: event.occurrenceStart,
    end: event.occurrenceEnd,
    allDay: Boolean(event.allDay),
    location: venue,
    description,
  });
  return (
    <article id={id} className="group scroll-mt-24 rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-[#B9955E]/65 hover:shadow-[0_16px_30px_rgba(22,59,89,0.12)] focus-within:-translate-y-1 focus-within:border-[#B9955E]/65 focus-within:shadow-[0_16px_30px_rgba(22,59,89,0.12)] motion-reduce:transform-none motion-reduce:transition-none">
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
      <div className="mt-5 flex justify-end border-t border-[#DCE4E7]/85 pt-4">
        <a href={googleCalendarUrl} target="_blank" rel="noreferrer" aria-label={lang === "ko" ? `${title}을 Google Calendar에 추가` : `Add ${title} to Google Calendar`} className="inline-flex items-center gap-1.5 rounded-sm border border-[#B9955E]/50 bg-white px-3 py-2 text-xs font-semibold text-[#163B59] transition-[transform,background-color,border-color] duration-200 hover:border-[#B9955E] hover:bg-[#F6F0E5] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 motion-reduce:transition-none">
          <CalendarPlus className="size-3.5 text-[#B07834]" />
          {lang === "ko" ? "Google Calendar에 추가" : "Add to Google Calendar"}
        </a>
      </div>
    </article>
  );
}

export default function Events() {
  const { lang, t } = useLang();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [previewIssue, setPreviewIssue] = useState<WeeklyNewsletterIssue | null>(null);
  const [newsletterYearFilter, setNewsletterYearFilter] = useState("all");
  const [newsletterMonthFilter, setNewsletterMonthFilter] = useState("all");
  const range = useMemo(() => monthRange(month), [month]);
  const rangeInput = useMemo(() => ({ start: range.start, end: range.end }), [range]);
  const eventsQuery = trpc.events.listRange.useQuery(rangeInput);
  const upcomingQuery = trpc.events.upcoming.useQuery();
  const featuredSpecialQuery = trpc.events.featuredSpecial.useQuery();
  const newsletterListInput = useMemo(() => ({ limit: 100 }), []);
  const latestNewsletterQuery = trpc.weeklyNewsletter.latest.useQuery();
  const newsletterArchiveQuery = trpc.weeklyNewsletter.list.useQuery(newsletterListInput);
  const occurrences = (eventsQuery.data ?? []) as EventOccurrence[];
  const filteredOccurrences = useMemo(() => eventFilter === "all" ? occurrences : occurrences.filter(event => event.eventType === eventFilter), [eventFilter, occurrences]);
  const selectedKey = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}` : null;
  const selectedEvents = selectedKey ? filteredOccurrences.filter(event => dateKey(event.occurrenceStart) === selectedKey) : [];
  const eventDates = useMemo(() => Array.from(new Set(filteredOccurrences.map(event => dateKey(event.occurrenceStart)))).map(calendarDate), [filteredOccurrences]);
  const upcoming = (upcomingQuery.data ?? []) as EventOccurrence[];
  const featuredSpecial = (featuredSpecialQuery.data ?? null) as EventOccurrence | null;
  const filteredUpcoming = useMemo(() => eventFilter === "all" ? upcoming : upcoming.filter(event => event.eventType === eventFilter), [eventFilter, upcoming]);
  const filterOptions: { value: EventFilter; label: string }[] = [
    { value: "all", label: lang === "ko" ? "전체" : "All" },
    ...Object.entries(eventTypeLabels).map(([value, label]) => ({ value: value as EventType, label: label[lang] })),
  ];
  const featuredTitle = featuredSpecial ? (lang === "en" && featuredSpecial.titleEn ? featuredSpecial.titleEn : featuredSpecial.titleKo) : "";
  const featuredVenue = featuredSpecial ? (lang === "en" && featuredSpecial.venueEn ? featuredSpecial.venueEn : featuredSpecial.venueKo) : null;
  const featuredDescription = featuredSpecial ? (lang === "en" && featuredSpecial.descriptionEn ? featuredSpecial.descriptionEn : featuredSpecial.descriptionKo) : null;
  const featuredCalendarUrl = featuredSpecial ? createGoogleCalendarUrl({
    title: featuredTitle,
    start: featuredSpecial.occurrenceStart,
    end: featuredSpecial.occurrenceEnd,
    allDay: Boolean(featuredSpecial.allDay),
    location: featuredVenue,
    description: featuredDescription,
  }) : "";
  const featuredCardId = featuredSpecial ? `event-occurrence-${featuredSpecial.seriesId}-${dateKey(featuredSpecial.occurrenceStart)}` : "";
  const latestNewsletter = (latestNewsletterQuery.data ?? null) as WeeklyNewsletterIssue | null;
  const newsletterArchive = (newsletterArchiveQuery.data ?? []) as WeeklyNewsletterIssue[];
  const priorNewsletters = latestNewsletter ? newsletterArchive.filter(issue => issue.id !== latestNewsletter.id) : newsletterArchive;
  const newsletterYears = useMemo(() => Array.from(new Set(priorNewsletters.map(issue => newsletterYearMonth(issue.issueDate).year).filter(Boolean))).sort((a, b) => b.localeCompare(a)), [priorNewsletters]);
  const newsletterMonths = useMemo(() => Array.from(new Set(priorNewsletters.filter(issue => newsletterYearFilter === "all" || newsletterYearMonth(issue.issueDate).year === newsletterYearFilter).map(issue => newsletterYearMonth(issue.issueDate).month).filter(Boolean))).sort((a, b) => Number(b) - Number(a)), [newsletterYearFilter, priorNewsletters]);
  const filteredPriorNewsletters = useMemo(() => priorNewsletters.filter(issue => {
    const { year, month: issueMonth } = newsletterYearMonth(issue.issueDate);
    return (newsletterYearFilter === "all" || year === newsletterYearFilter) && (newsletterMonthFilter === "all" || issueMonth === newsletterMonthFilter);
  }), [newsletterMonthFilter, newsletterYearFilter, priorNewsletters]);

  const showFeaturedDate = () => {
    if (!featuredSpecial) return;
    const start = new Date(featuredSpecial.occurrenceStart);
    setMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    setSelectedDate(calendarDate(dateKey(featuredSpecial.occurrenceStart)));
    setEventFilter("all");
    window.setTimeout(() => document.getElementById(featuredCardId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

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
        {featuredSpecial && (
          <section aria-labelledby="featured-event-title" onClick={event => { if (!(event.target as HTMLElement).closest("a, button")) showFeaturedDate(); }} className="relative mb-10 cursor-pointer overflow-hidden rounded-xl border border-[#B9955E]/40 bg-[#163B59] px-6 py-7 text-white shadow-[0_18px_36px_rgba(22,59,89,0.17)] sm:px-8 sm:py-8">
            <div aria-hidden="true" className="absolute -right-20 -top-28 size-72 rounded-full border border-[#C9973E]/25" />
            <div aria-hidden="true" className="absolute right-12 top-8 size-32 rounded-full bg-[#2F6F9F]/25 blur-3xl" />
            <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E5C484]"><Sparkles className="size-3.5" />{lang === "ko" ? "추천 행사" : "Featured event"}</p>
                <h2 id="featured-event-title" className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">{featuredTitle}</h2>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#E7EEF1]">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-[#E5C484]" />{formatEventDate(featuredSpecial, lang)}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-[#E5C484]" />{formatEventTime(featuredSpecial, lang)}</span>
                  {featuredVenue && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-[#E5C484]" />{featuredVenue}</span>}
                </div>
                {featuredDescription && <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#D7E4EA]">{featuredDescription}</p>}
                <FeaturedCountdown startAt={featuredSpecial.occurrenceStart} lang={lang} />
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <button type="button" onClick={showFeaturedDate} className="inline-flex items-center gap-2 rounded-sm bg-[#C9973E] px-4 py-2.5 text-sm font-semibold text-[#163B59] transition-[transform,background-color] duration-200 hover:bg-[#E5C484] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#163B59] motion-reduce:transition-none">
                  {lang === "ko" ? "일정 자세히 보기" : "View event details"}<ArrowUpRight className="size-4" />
                </button>
                <a href={featuredCalendarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-[transform,background-color,border-color] duration-200 hover:border-[#E5C484] hover:bg-white/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#163B59] motion-reduce:transition-none">
                  <CalendarPlus className="size-4 text-[#E5C484]" />{lang === "ko" ? "내 캘린더에 추가" : "Add to my calendar"}
                </a>
                <VideoShareButton title={featuredTitle} url={`${window.location.origin}/events#${featuredCardId}`} lang={lang} contentType="event" className="border-white/40 bg-white/5 text-white hover:border-[#E5C484] hover:bg-white/10 hover:text-white" />
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="weekly-newsletter-title" className="mb-12 overflow-hidden rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] shadow-[0_14px_32px_rgba(22,59,89,0.06)]">
          <div className="border-b border-[#DCE4E7] bg-[linear-gradient(110deg,#F6F0E5_0%,#FFFEFB_58%,#E7EEF1_100%)] px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]"><FileText className="size-3.5" />Weekly newsletter</p>
                <h2 id="weekly-newsletter-title" className="mt-2 font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "이번 주 교회 주보" : "This week’s bulletin"}</h2>
                <p className="mt-1 text-sm text-[#607A91]">{lang === "ko" ? "주일 예배와 공동체 소식을 PDF로 확인하세요." : "Read Sunday worship and community news in PDF."}</p>
              </div>
              <span className="rounded-sm border border-[#B9955E]/40 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#8A6420]">{lang === "ko" ? "매주 업데이트" : "Updated weekly"}</span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {latestNewsletterQuery.isLoading ? (
              <div className="h-80 animate-pulse rounded-lg bg-[#E7EEF1]" aria-label={lang === "ko" ? "주보를 불러오는 중" : "Loading weekly newsletter"} />
            ) : latestNewsletter ? (
              <div className="grid gap-7 lg:grid-cols-[minmax(0,0.86fr)_minmax(19rem,1.14fr)] lg:items-start">
                <article className="flex min-h-full flex-col justify-between rounded-lg border border-[#DCE4E7] bg-[#F4F6F7] p-5 shadow-[0_14px_28px_rgba(22,59,89,0.08)] sm:p-6">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">{formatNewsletterDate(latestNewsletter.issueDate, lang)}</p><button type="button" onClick={() => setPreviewIssue(latestNewsletter)} className="group relative mt-4 block aspect-[3/4] w-full overflow-hidden border border-[#DCE4E7] bg-[#E7EEF1] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2"><img src={`https://drive.google.com/thumbnail?id=${latestNewsletter.driveFileId}&sz=w1000`} alt="" className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none" /><span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#163B59]/65 to-transparent" /><span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-sm bg-[#163B59]/92 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"><FileText className="size-3.5 text-[#E5C484]" />{lang === "ko" ? "웹에서 미리보기" : "Preview online"}</span></button><h3 className="mt-4 font-serif text-2xl font-semibold text-[#163B59]">{lang === "en" && latestNewsletter.titleEn ? latestNewsletter.titleEn : latestNewsletter.titleKo}</h3><p className="mt-2 text-sm leading-6 text-[#607A91]">{lang === "ko" ? "첫 페이지를 미리 보고, 웹에서 전체 주보를 바로 열어 보세요." : "Preview the first page, then open the complete bulletin online."}</p><p className="mt-4 text-sm text-[#607A91]">PDF · {formatNewsletterFileSize(latestNewsletter.fileSize)}</p></div>
                  <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => setPreviewIssue(latestNewsletter)} className="inline-flex items-center gap-2 rounded-sm bg-[#163B59] px-4 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-200 hover:bg-[#245170] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 motion-reduce:transition-none"><Eye className="size-4" />{lang === "ko" ? "웹에서 미리보기" : "Preview online"}</button><a href={latestNewsletter.storageUrl} download className="inline-flex items-center gap-2 rounded-sm border border-[#B9955E]/50 bg-white px-4 py-2.5 text-sm font-semibold text-[#163B59] transition-[transform,background-color,border-color] duration-200 hover:border-[#B9955E] hover:bg-[#F6F0E5] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 motion-reduce:transition-none"><Download className="size-4 text-[#B07834]" />{lang === "ko" ? "다운로드" : "Download"}</a></div>
                </article>

                <aside aria-labelledby="previous-newsletters-title" className="min-w-0">
                  <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">Archive</p><h3 id="previous-newsletters-title" className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "지난 교회 주보" : "Previous bulletins"}</h3></div><span aria-live="polite" className="text-xs text-[#607A91]">{lang === "ko" ? `${filteredPriorNewsletters.length}개 보기` : `${filteredPriorNewsletters.length} issue${filteredPriorNewsletters.length === 1 ? "" : "s"}`}</span></div>
                  {priorNewsletters.length > 0 ? <>
                    <div aria-label={lang === "ko" ? "지난 주보 필터" : "Previous bulletin filters"} className="mb-4 grid grid-cols-2 gap-2">
                      <Select value={newsletterYearFilter} onValueChange={value => { setNewsletterYearFilter(value); setNewsletterMonthFilter("all"); }}><SelectTrigger className="w-full border-[#C8D4D9] bg-white text-[#163B59] focus-visible:ring-[#607A91]"><SelectValue placeholder={lang === "ko" ? "연도 전체" : "All years"} /></SelectTrigger><SelectContent><SelectItem value="all">{lang === "ko" ? "연도 전체" : "All years"}</SelectItem>{newsletterYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select>
                      <Select value={newsletterMonthFilter} onValueChange={setNewsletterMonthFilter}><SelectTrigger className="w-full border-[#C8D4D9] bg-white text-[#163B59] focus-visible:ring-[#607A91]"><SelectValue placeholder={lang === "ko" ? "월 전체" : "All months"} /></SelectTrigger><SelectContent><SelectItem value="all">{lang === "ko" ? "월 전체" : "All months"}</SelectItem>{newsletterMonths.map(issueMonth => <SelectItem key={issueMonth} value={issueMonth}>{newsletterMonthLabel(issueMonth, lang)}</SelectItem>)}</SelectContent></Select>
                    </div>
                    {filteredPriorNewsletters.length > 0 ? <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {filteredPriorNewsletters.map(issue => <button key={issue.id} type="button" onClick={() => setPreviewIssue(issue)} className="group flex w-full items-center gap-4 rounded-lg border border-[#DCE4E7] bg-white p-3 text-left transition-[transform,border-color,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#B9955E]/65 hover:bg-[#FFFEFB] hover:shadow-[0_8px_18px_rgba(22,59,89,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"><div className="grid size-11 shrink-0 place-items-center rounded-sm bg-[#F6F0E5] text-[#B07834]"><FileText className="size-5" /></div><span className="min-w-0 flex-1"><span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#B07834]">{formatNewsletterDate(issue.issueDate, lang)}</span><span className="mt-0.5 block truncate font-serif text-base font-semibold text-[#163B59]">{lang === "en" && issue.titleEn ? issue.titleEn : issue.titleKo}</span><span className="mt-1 block text-xs text-[#607A91]">{lang === "ko" ? "웹에서 미리보기" : "Preview online"}</span></span><Eye className="size-4 shrink-0 text-[#607A91] transition-transform duration-200 group-hover:scale-110 group-hover:text-[#B07834] motion-reduce:transform-none" /></button>)}
                    </div> : <div className="rounded-lg border border-dashed border-[#C8D4D9] bg-[#F4F6F7] px-5 py-10 text-center text-sm leading-6 text-[#607A91]">{lang === "ko" ? "선택한 연도와 월에 해당하는 주보가 없습니다." : "No bulletins match the selected year and month."}</div>}
                  </> : <div className="rounded-lg border border-dashed border-[#C8D4D9] bg-[#F4F6F7] px-5 py-10 text-center text-sm leading-6 text-[#607A91]">{lang === "ko" ? "지난 주보가 게시되면 이곳에서 볼 수 있습니다." : "Previous bulletins will appear here once published."}</div>}
                </aside>
              </div>
            ) : (
              <div className="rounded-lg bg-[#F4F6F7] px-5 py-8 text-center"><FileText className="mx-auto mb-3 size-7 text-[#B07834]" /><p className="font-serif text-lg font-semibold text-[#163B59]">{lang === "ko" ? "이번 주 주보를 준비 중입니다" : "This week’s bulletin is being prepared"}</p><p className="mt-2 text-sm text-[#607A91]">{lang === "ko" ? "새 주보가 게시되면 이곳에서 바로 열람할 수 있습니다." : "The new bulletin will be available here once it is published."}</p></div>
            )}
          </div>
        </section>

        <div id="events-calendar" className="scroll-mt-24 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
          <section className="brand-surface rounded-xl border border-[#DCE4E7] p-4 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="mt-1 rounded-sm bg-[#F6F0E5] p-2 text-[#8A6420]"><CalendarDays className="size-5" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{t("home.calendar")}</p><h2 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "월간 일정" : "Monthly calendar"}</h2></div>
            </div>
            <div className="mb-5 border-y border-[#DCE4E7] py-3">
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#607A91]">{lang === "ko" ? "유형별 보기" : "Filter by type"}</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={eventFilter === option.value}
                    onClick={() => setEventFilter(option.value)}
                    className={`shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 motion-reduce:transition-none ${eventFilter === option.value ? "border-[#163B59] bg-[#163B59] text-white" : "border-[#C8D4D9] bg-white text-[#607A91] hover:border-[#B9955E]/70 hover:bg-[#F6F0E5] hover:text-[#163B59]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
              {eventsQuery.isLoading ? <p className="text-sm text-[#607A91]">{lang === "ko" ? "일정을 불러오는 중입니다…" : "Loading events…"}</p> : selectedDate && selectedEvents.length ? selectedEvents.map(event => <EventCard key={`${event.seriesId}-${new Date(event.occurrenceStart).toISOString()}`} id={`event-occurrence-${event.seriesId}-${dateKey(event.occurrenceStart)}`} event={event} lang={lang} />) : <div className="rounded-lg bg-[#F4F6F7] px-4 py-6 text-sm leading-6 text-[#607A91]">{selectedDate ? (lang === "ko" ? "선택한 날짜에 공개된 일정이 없습니다." : "There are no published events on this date.") : (lang === "ko" ? "달력에서 금색으로 강조된 날짜를 선택해 일정과 장소를 확인하세요." : "Select a gold-highlighted date on the calendar to see event times and locations.")}</div>}
            </div>
          </section>
        </div>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{lang === "ko" ? "Looking ahead" : "Looking ahead"}</p><h2 className="mt-1 font-serif text-3xl font-semibold text-[#163B59]">{t("home.upcomingEvents")}</h2></div><ChevronRight className="size-5 text-[#B07834]" /></div>
          {upcomingQuery.isLoading ? <p className="text-sm text-[#607A91]">{lang === "ko" ? "다가오는 일정을 불러오는 중입니다…" : "Loading upcoming events…"}</p> : filteredUpcoming.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredUpcoming.map(event => <EventCard key={`${event.seriesId}-${new Date(event.occurrenceStart).toISOString()}`} event={event} lang={lang} />)}</div> : <div className="rounded-xl border border-dashed border-[#C8D4D9] bg-[#FFFEFB] px-6 py-12 text-center"><p className="font-serif text-xl font-semibold text-[#163B59]">{upcoming.length ? (lang === "ko" ? "선택한 유형의 다가오는 일정이 없습니다." : "No upcoming events match this filter.") : (lang === "ko" ? "등록된 공개 일정이 아직 없습니다." : "No published events yet.")}</p><p className="mt-2 text-sm text-[#607A91]">{lang === "ko" ? "새 일정이 공개되면 이곳에 자동으로 표시됩니다." : "Published events will appear here automatically."}</p></div>}
        </section>
      </main>
      <WeeklyNewsletterPdfPreview issue={previewIssue} lang={lang} onOpenChange={open => { if (!open) setPreviewIssue(null); }} />
      <Footer />
    </div>
  );
}

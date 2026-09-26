import { useMemo, useState } from "react";
import { Ban, CalendarDays, Check, Edit2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CHURCH_TIME_ZONE = "America/Los_Angeles";
const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHURCH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHURCH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type EventRecord = {
  id: number;
  titleKo: string;
  titleEn: string | null;
  startAt: Date | string;
  endAt: Date | string | null;
  allDay: number;
  venueKo: string | null;
  venueEn: string | null;
  descriptionKo: string | null;
  descriptionEn: string | null;
  featuredImageUrl: string | null;
  eventType: "worship" | "prayer" | "fellowship" | "ministry" | "special" | "other";
  status: "draft" | "published" | "cancelled";
  recurrence: "none" | "weekly";
  recurrenceUntil: Date | string | null;
};
type EventForm = {
  titleKo: string;
  titleEn: string;
  startLocal: string;
  endLocal: string;
  allDay: boolean;
  venueKo: string;
  venueEn: string;
  descriptionKo: string;
  descriptionEn: string;
  featuredImageUrl: string;
  eventType: "worship" | "prayer" | "fellowship" | "ministry" | "special" | "other";
  status: "draft" | "published" | "cancelled";
  recurrence: "none" | "weekly";
  recurrenceUntil: string;
};

function dateParts(date: Date) {
  const values = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function churchDateTimeInput(date: Date) {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function churchDateInput(date: Date) {
  const values = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

/** Interprets date-time fields as church local time, then persists the matching UTC instant. */
function churchDateTimeToUtc(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Enter a valid church date and time.");
  const [, year, month, day, hour, minute] = match;
  const localAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const offsetAt = (instant: number) => {
    const parts = dateParts(new Date(instant));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute)) - instant;
  };
  const firstPass = localAsUtc - offsetAt(localAsUtc);
  return new Date(localAsUtc - offsetAt(firstPass));
}

function addChurchDays(dateTime: string, days: number) {
  const [date, time] = dateTime.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.toISOString().slice(0, 10)}T${time}`;
}

function emptyEventForm(): EventForm {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return {
    titleKo: "",
    titleEn: "",
    startLocal: churchDateTimeInput(now),
    endLocal: "",
    allDay: false,
    venueKo: "",
    venueEn: "",
    descriptionKo: "",
    descriptionEn: "",
    featuredImageUrl: "",
    eventType: "other",
    status: "draft",
    recurrence: "none",
    recurrenceUntil: "",
  };
}

function eventToForm(event: EventRecord): EventForm {
  return {
    titleKo: event.titleKo,
    titleEn: event.titleEn ?? "",
    startLocal: churchDateTimeInput(new Date(event.startAt)),
    endLocal: event.allDay ? "" : event.endAt ? churchDateTimeInput(new Date(event.endAt)) : "",
    allDay: event.allDay === 1,
    venueKo: event.venueKo ?? "",
    venueEn: event.venueEn ?? "",
    descriptionKo: event.descriptionKo ?? "",
    descriptionEn: event.descriptionEn ?? "",
    featuredImageUrl: event.featuredImageUrl ?? "",
    eventType: event.eventType,
    status: event.status,
    recurrence: event.recurrence,
    recurrenceUntil: event.recurrenceUntil ? churchDateInput(new Date(event.recurrenceUntil)) : "",
  };
}

function formToEventInput(form: EventForm) {
  const allDayStart = `${form.startLocal.slice(0, 10)}T00:00`;
  const startAt = churchDateTimeToUtc(form.allDay ? allDayStart : form.startLocal);
  const recurrenceTime = form.allDay ? "T00:00" : form.startLocal.slice(10);
  return {
    titleKo: form.titleKo,
    titleEn: form.titleEn || null,
    startAt,
    endAt: form.allDay ? churchDateTimeToUtc(addChurchDays(allDayStart, 1)) : form.endLocal ? churchDateTimeToUtc(form.endLocal) : null,
    allDay: form.allDay,
    venueKo: form.venueKo || null,
    venueEn: form.venueEn || null,
    descriptionKo: form.descriptionKo || null,
    descriptionEn: form.descriptionEn || null,
    featuredImageUrl: form.featuredImageUrl || null,
    eventType: form.eventType,
    status: form.status,
    recurrence: form.recurrence,
    recurrenceUntil: form.recurrence === "weekly" && form.recurrenceUntil
      ? churchDateTimeToUtc(`${form.recurrenceUntil}${recurrenceTime}`)
      : null,
  } as const;
}

const eventTypeLabels = {
  worship: "예배 / Worship",
  prayer: "기도 / Prayer",
  fellowship: "교제 / Fellowship",
  ministry: "사역 / Ministry",
  special: "특별 행사 / Special",
  other: "기타 / Other",
} as const;

export default function AdminEventsPanel() {
  const { lang } = useLang();
  const utils = trpc.useUtils();
  const eventsQuery = trpc.events.listAdmin.useQuery();
  const [form, setForm] = useState<EventForm>(emptyEventForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const finish = async (text: string) => {
    await utils.events.listAdmin.invalidate();
    await utils.events.listRange.invalidate();
    await utils.events.upcoming.invalidate();
    await utils.events.featuredSpecial.invalidate();
    setNotice({ kind: "success", text });
  };

  const createMutation = trpc.events.create.useMutation({
    onSuccess: async () => {
      await finish(lang === "ko" ? "일정을 저장했습니다." : "Event saved.");
      setForm(emptyEventForm());
    },
    onError: error => setNotice({ kind: "error", text: error.message }),
  });
  const updateMutation = trpc.events.update.useMutation({
    onSuccess: async () => {
      await finish(lang === "ko" ? "일정을 수정했습니다." : "Event updated.");
      setEditingId(null);
      setForm(emptyEventForm());
    },
    onError: error => setNotice({ kind: "error", text: error.message }),
  });
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: async () => {
      await finish(lang === "ko" ? "일정을 삭제했습니다." : "Event deleted.");
      setEditingId(null);
      setForm(emptyEventForm());
    },
    onError: error => setNotice({ kind: "error", text: error.message }),
  });

  const eventDates = useMemo(
    () => (eventsQuery.data ?? []).map(event => {
      const [year, month, day] = churchDateInput(new Date(event.startAt)).split("-").map(Number);
      return new Date(year, month - 1, day);
    }),
    [eventsQuery.data],
  );

  const setValue = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const updateStatus = (event: EventRecord, status: EventForm["status"]) => {
    const updatedForm = { ...eventToForm(event), status };
    updateMutation.mutate({ id: event.id, event: formToEventInput(updatedForm) });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const eventInput = formToEventInput(form);
      if (editingId) updateMutation.mutate({ id: editingId, event: eventInput });
      else createMutation.mutate(eventInput);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Unable to prepare event." });
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <section aria-label={lang === "ko" ? "일정 관리" : "Event management"} className="space-y-7">
      <div className="rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Church calendar</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">
              {lang === "ko" ? "일정과 행사 관리" : "Manage events"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#607A91]">
              {lang === "ko"
                ? "여기서 저장·공개·취소한 내용은 공개 행사 캘린더와 Home의 다음 일정에 즉시 반영됩니다. 반복 일정은 시리즈 전체에 적용됩니다."
                : "Saved, published, and cancelled events update the public calendar and Home’s upcoming list immediately. Changes to a recurring event apply to the full series."}
            </p>
          </div>
          <Button variant="outline" onClick={() => eventsQuery.refetch()} className="border-[#C8D4D9] bg-white text-[#163B59] hover:bg-[#E7EEF1]">
            <RefreshCw className="mr-2 size-4" /> {lang === "ko" ? "새로고침" : "Refresh"}
          </Button>
        </div>
      </div>

      {notice && (
        <p role="status" className={`rounded-lg px-4 py-3 text-sm ${notice.kind === "success" ? "bg-[#EDF5EE] text-[#315C3A]" : "bg-red-50 text-red-700"}`}>
          {notice.text}
        </p>
      )}

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={submit} className="brand-surface rounded-xl border border-[#DCE4E7] p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="font-serif text-xl font-semibold text-[#163B59]">
              {editingId ? (lang === "ko" ? "일정 수정" : "Edit event") : (lang === "ko" ? "새 일정 추가" : "Add event")}
            </h3>
            {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(emptyEventForm()); }} className="text-[#607A91]">{lang === "ko" ? "새 일정으로" : "New event"}</Button>}
          </div>

          <div className="grid gap-4 md:grid-cols-2 [&_input]:border-[#C8D4D9] [&_select]:border-[#C8D4D9] [&_textarea]:border-[#C8D4D9]">
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "제목 (한국어)" : "Korean title"}<Input required value={form.titleKo} onChange={event => setValue("titleKo", event.target.value)} className="mt-2 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "영문 제목" : "English title"}<Input value={form.titleEn} onChange={event => setValue("titleEn", event.target.value)} className="mt-2 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "시작 (교회 현지 PT)" : "Start (church PT)"}<Input required type="datetime-local" value={form.startLocal} onChange={event => setValue("startLocal", event.target.value)} className="mt-2 bg-white" /></label>
            {!form.allDay && <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "종료 (선택)" : "End (optional)"}<Input type="datetime-local" value={form.endLocal} onChange={event => setValue("endLocal", event.target.value)} className="mt-2 bg-white" /></label>}
            <label className="flex items-center gap-2 text-sm font-semibold text-[#17324D] md:col-span-2"><input type="checkbox" checked={form.allDay} onChange={event => setValue("allDay", event.target.checked)} className="size-4 accent-[#163B59]" />{lang === "ko" ? "종일 일정 (교회 현지 날짜로 표시)" : "All-day event (shown in church-local date)"}</label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "유형" : "Type"}<select value={form.eventType} onChange={event => setValue("eventType", event.target.value as EventForm["eventType"])} className="mt-2 h-9 w-full rounded-md bg-white px-3 text-sm"><option value="worship">{eventTypeLabels.worship}</option><option value="prayer">{eventTypeLabels.prayer}</option><option value="fellowship">{eventTypeLabels.fellowship}</option><option value="ministry">{eventTypeLabels.ministry}</option><option value="special">{eventTypeLabels.special}</option><option value="other">{eventTypeLabels.other}</option></select></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "공개 상태" : "Visibility"}<select value={form.status} onChange={event => setValue("status", event.target.value as EventForm["status"])} className="mt-2 h-9 w-full rounded-md bg-white px-3 text-sm"><option value="draft">{lang === "ko" ? "초안" : "Draft"}</option><option value="published">{lang === "ko" ? "공개" : "Published"}</option><option value="cancelled">{lang === "ko" ? "취소" : "Cancelled"}</option></select></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "장소 (한국어)" : "Korean venue"}<Input value={form.venueKo} onChange={event => setValue("venueKo", event.target.value)} className="mt-2 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "영문 장소" : "English venue"}<Input value={form.venueEn} onChange={event => setValue("venueEn", event.target.value)} className="mt-2 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "반복" : "Repeat"}<select value={form.recurrence} onChange={event => setValue("recurrence", event.target.value as EventForm["recurrence"])} className="mt-2 h-9 w-full rounded-md bg-white px-3 text-sm"><option value="none">{lang === "ko" ? "반복 없음" : "Does not repeat"}</option><option value="weekly">{lang === "ko" ? "매주" : "Weekly"}</option></select></label>
            {form.recurrence === "weekly" && <label className="text-sm font-semibold text-[#17324D]">{lang === "ko" ? "반복 종료일 (선택)" : "Repeat until (optional)"}<Input type="date" value={form.recurrenceUntil} onChange={event => setValue("recurrenceUntil", event.target.value)} className="mt-2 bg-white" /><span className="mt-1 block text-xs font-normal text-[#607A91]">{lang === "ko" ? "비워두면 계속 반복됩니다. 개별 날짜 예외는 현재 지원하지 않습니다." : "Leave blank to continue. Individual occurrence exceptions are not yet supported."}</span></label>}
            <label className="text-sm font-semibold text-[#17324D] md:col-span-2">{lang === "ko" ? "설명 (한국어)" : "Korean description"}<Textarea value={form.descriptionKo} onChange={event => setValue("descriptionKo", event.target.value)} className="mt-2 min-h-24 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D] md:col-span-2">{lang === "ko" ? "영문 설명" : "English description"}<Textarea value={form.descriptionEn} onChange={event => setValue("descriptionEn", event.target.value)} className="mt-2 min-h-24 bg-white" /></label>
            <label className="text-sm font-semibold text-[#17324D] md:col-span-2">{lang === "ko" ? "추천 행사 포스터 URL (선택)" : "Featured event poster URL (optional)"}<Input type="url" value={form.featuredImageUrl} onChange={event => setValue("featuredImageUrl", event.target.value)} placeholder="/manus-storage/event-poster.png" className="mt-2 bg-white" /><span className="mt-1 block text-xs font-normal leading-relaxed text-[#607A91]">{lang === "ko" ? "특별 행사에 포스터를 연결하면 공개 추천 행사 배너에서 전체 포스터와 확대 보기가 제공됩니다. 관리된 /manus-storage/ 경로나 HTTPS 이미지 주소를 입력하세요." : "A connected poster appears in the public featured-event banner with an enlarged view. Use a managed /manus-storage/ path or HTTPS image URL."}</span></label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={pending} type="submit" className="bg-[#163B59] text-white hover:bg-[#245170]"><Plus className="mr-2 size-4" />{editingId ? (lang === "ko" ? "수정 저장" : "Save changes") : (lang === "ko" ? "일정 저장" : "Save event")}</Button>
            {editingId && <Button disabled={pending} type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyEventForm()); }} className="border-[#C8D4D9] bg-white text-[#163B59]">{lang === "ko" ? "취소" : "Cancel"}</Button>}
          </div>
        </form>

        <aside className="brand-surface h-fit rounded-xl border border-[#DCE4E7] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#163B59]"><CalendarDays className="size-4" /><h3 className="font-serif text-lg font-semibold">{lang === "ko" ? "날짜 선택" : "Pick a date"}</h3></div>
          <Calendar mode="single" selected={selectedDate} onSelect={date => { if (!date) return; setSelectedDate(date); const start = form.startLocal || emptyEventForm().startLocal; const time = start.slice(10); setValue("startLocal", `${date.toISOString().slice(0, 10)}${time}`); }} modifiers={{ hasEvent: eventDates }} modifiersClassNames={{ hasEvent: "bg-[#C9973E]/20 text-[#163B59] font-semibold" }} className="w-full p-0" />
          <p className="mt-3 text-xs leading-relaxed text-[#607A91]">{lang === "ko" ? "금색으로 표시된 날짜에는 저장된 일정이 있습니다. 이 달력은 새 일정의 시작 날짜를 빠르게 선택하는 용도입니다." : "Gold dates have saved events. Use this calendar to set a new event’s start date."}</p>
        </aside>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2"><CalendarDays className="size-5 text-[#B07834]" /><h3 className="font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "저장된 일정" : "Saved events"}</h3></div>
        {eventsQuery.isLoading ? <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#163B59]" /></div> : eventsQuery.data?.length ? <div className="space-y-3">{eventsQuery.data.map(event => <article key={event.id} className="brand-surface flex flex-col gap-4 rounded-xl border border-[#DCE4E7] p-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-2 flex flex-wrap gap-2"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${event.status === "published" ? "bg-[#EDF5EE] text-[#315C3A]" : event.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-[#E7EEF1] text-[#607A91]"}`}>{event.status === "published" ? (lang === "ko" ? "공개" : "Published") : event.status === "cancelled" ? (lang === "ko" ? "취소" : "Cancelled") : (lang === "ko" ? "초안" : "Draft")}</span><span className="rounded-sm bg-[#F6F0E5] px-2 py-1 text-xs font-semibold text-[#8A6420]">{event.recurrence === "weekly" ? (lang === "ko" ? "매주" : "Weekly") : (lang === "ko" ? "단일" : "One-time")}</span></div><h4 className="font-semibold text-[#163B59]">{lang === "en" && event.titleEn ? event.titleEn : event.titleKo}</h4><p className="mt-1 text-sm text-[#607A91]">{new Date(event.startAt).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", { timeZone: CHURCH_TIME_ZONE, dateStyle: "medium", timeStyle: event.allDay ? undefined : "short" })}{event.allDay ? (lang === "ko" ? " · 종일" : " · All day") : ""}{event.venueKo ? ` · ${lang === "en" && event.venueEn ? event.venueEn : event.venueKo}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingId(event.id); setForm(eventToForm(event)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="border-[#C8D4D9] bg-white text-[#163B59]"><Edit2 className="mr-1 size-3.5" />{lang === "ko" ? "수정" : "Edit"}</Button>{event.status !== "published" && <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus(event, "published")} className="border-[#B9955E]/50 bg-[#FFFEFB] text-[#8A6420]"><Check className="mr-1 size-3.5" />{lang === "ko" ? "공개" : "Publish"}</Button>}{event.status !== "cancelled" && <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus(event, "cancelled")} className="border-red-200 bg-white text-red-700"><Ban className="mr-1 size-3.5" />{lang === "ko" ? "취소" : "Cancel"}</Button>}<Button size="sm" variant="outline" disabled={pending} onClick={() => { if (window.confirm(lang === "ko" ? "이 일정을 완전히 삭제하시겠습니까?" : "Delete this event permanently?")) deleteMutation.mutate({ id: event.id }); }} className="border-red-200 bg-white text-red-700"><Trash2 className="size-3.5" /><span className="sr-only">{lang === "ko" ? "삭제" : "Delete"}</span></Button></div></article>)}</div> : <p className="rounded-xl border border-dashed border-[#C8D4D9] px-5 py-10 text-center text-sm text-[#607A91]">{lang === "ko" ? "아직 저장된 일정이 없습니다. 위 양식으로 첫 일정을 추가해 주세요." : "No events have been saved yet. Add the first event above."}</p>}
      </div>
    </section>
  );
}

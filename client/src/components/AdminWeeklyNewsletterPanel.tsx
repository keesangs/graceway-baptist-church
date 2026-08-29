import { useState } from "react";
import { CheckCircle2, ExternalLink, Eye, EyeOff, FileText, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NewsletterIssue = {
  id: number;
  issueDate: string;
  titleKo: string;
  titleEn: string | null;
  sourceFilename: string;
  storageUrl: string;
  fileSize: number;
  status: "draft" | "published" | "hidden";
  syncedAt: Date | string;
};

function formatIssueDate(issueDate: string, lang: "ko" | "en") {
  const date = new Date(`${issueDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function AdminWeeklyNewsletterPanel() {
  const { lang } = useLang();
  const utils = trpc.useUtils();
  const issuesQuery = trpc.weeklyNewsletter.listAdmin.useQuery();
  const syncStatusQuery = trpc.weeklyNewsletter.syncStatus.useQuery();
  const [titleDrafts, setTitleDrafts] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const refresh = async () => {
    await Promise.all([
      utils.weeklyNewsletter.list.invalidate(),
      utils.weeklyNewsletter.latest.invalidate(),
      utils.weeklyNewsletter.listAdmin.invalidate(),
      utils.weeklyNewsletter.syncStatus.invalidate(),
    ]);
  };

  const syncMutation = trpc.weeklyNewsletter.syncNow.useMutation({
    onSuccess: async result => {
      await refresh();
      setNotice({
        kind: "success",
        text: lang === "ko"
          ? `${result.scanned}개 PDF를 확인했습니다. 신규 ${result.added}개, 갱신 ${result.updated}개를 게시했습니다.`
          : `Checked ${result.scanned} PDF(s). Published ${result.added} new and updated ${result.updated}.`,
      });
    },
    onError: error => setNotice({ kind: "error", text: error.message }),
  });
  const updateMutation = trpc.weeklyNewsletter.update.useMutation({
    onSuccess: async () => {
      await refresh();
      setNotice({ kind: "success", text: lang === "ko" ? "주보 설정을 저장했습니다." : "Newsletter settings saved." });
    },
    onError: error => setNotice({ kind: "error", text: error.message }),
  });

  const issues = (issuesQuery.data ?? []) as NewsletterIssue[];
  const syncStatus = syncStatusQuery.data;
  const pending = syncMutation.isPending || updateMutation.isPending;

  return (
    <section aria-label={lang === "ko" ? "주보 관리" : "Weekly newsletter management"} className="space-y-6">
      <div className="rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Weekly newsletter</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">
              {lang === "ko" ? "교회 주보 자동 게시" : "Weekly newsletter publishing"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#607A91]">
              {lang === "ko"
                ? "공개 Google Drive 폴더의 최신 PDF를 사이트 보관함으로 복사해 행사 페이지에 게시합니다. 동기화가 실패해도 현재 공개된 주보는 유지됩니다."
                : "The latest PDF from the public Google Drive folder is copied into the site archive and published on Events. The currently published bulletin remains visible if a sync fails."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => Promise.all([issuesQuery.refetch(), syncStatusQuery.refetch()])} className="border-[#C8D4D9] bg-white text-[#163B59] hover:bg-[#E7EEF1]">
              <RefreshCw className="mr-2 size-4" /> {lang === "ko" ? "새로고침" : "Refresh"}
            </Button>
            <Button type="button" disabled={pending} onClick={() => { setNotice(null); syncMutation.mutate(); }} className="bg-[#163B59] text-white hover:bg-[#245170]">
              {syncMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />}
              {syncMutation.isPending ? (lang === "ko" ? "동기화 중…" : "Syncing…") : (lang === "ko" ? "지금 동기화" : "Sync now")}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[#E7EEF1] px-4 py-3 text-sm text-[#163B59]"><span className="block text-xs font-semibold uppercase tracking-wider text-[#607A91]">{lang === "ko" ? "보관 주보" : "Archived"}</span><strong className="mt-1 block text-xl">{issues.length}</strong></div>
          <div className="rounded-lg bg-[#E7EEF1] px-4 py-3 text-sm text-[#163B59]"><span className="block text-xs font-semibold uppercase tracking-wider text-[#607A91]">{lang === "ko" ? "마지막 성공" : "Last success"}</span><strong className="mt-1 block text-sm">{syncStatus?.lastSuccessAt ? new Date(syncStatus.lastSuccessAt).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" }) : "—"}</strong></div>
          <div className={`rounded-lg px-4 py-3 text-sm ${syncStatus?.lastError ? "bg-red-50 text-red-700" : "bg-[#EDF5EE] text-[#315C3A]"}`}><span className="block text-xs font-semibold uppercase tracking-wider opacity-70">{lang === "ko" ? "동기화 상태" : "Sync status"}</span><strong className="mt-1 block text-sm">{syncStatus?.lastError ? (lang === "ko" ? "확인 필요" : "Needs attention") : (lang === "ko" ? "정상" : "Ready")}</strong></div>
        </div>
        {syncStatus?.lastError && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{syncStatus.lastError}</p>}
      </div>

      {notice && <p role="status" className={`rounded-lg px-4 py-3 text-sm ${notice.kind === "success" ? "bg-[#EDF5EE] text-[#315C3A]" : "bg-red-50 text-red-700"}`}>{notice.text}</p>}

      {issuesQuery.isLoading ? (
        <div className="flex justify-center py-14"><Loader2 className="size-7 animate-spin text-[#163B59]" /></div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#C8D4D9] bg-[#FFFEFB] px-6 py-14 text-center">
          <FileText className="mx-auto mb-4 size-8 text-[#B07834]" />
          <h3 className="font-serif text-xl font-semibold text-[#163B59]">{lang === "ko" ? "아직 게시된 주보가 없습니다" : "No weekly newsletter yet"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#607A91]">{lang === "ko" ? "공개 Drive 폴더에 PDF를 올린 뒤 ‘지금 동기화’를 선택하세요." : "Upload a PDF to the public Drive folder, then choose Sync now."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => {
            const title = titleDrafts[issue.id] ?? issue.titleKo;
            return (
              <article key={issue.id} className="brand-surface rounded-xl border border-[#DCE4E7] p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${issue.status === "published" ? "bg-[#EDF5EE] text-[#315C3A]" : issue.status === "hidden" ? "bg-[#E7EEF1] text-[#607A91]" : "bg-[#F6F0E5] text-[#8A6420]"}`}>{issue.status === "published" ? (lang === "ko" ? "공개" : "Published") : issue.status === "hidden" ? (lang === "ko" ? "숨김" : "Hidden") : (lang === "ko" ? "초안" : "Draft")}</span><span className="text-xs text-[#607A91]">{formatIssueDate(issue.issueDate, lang)} · {formatFileSize(issue.fileSize)}</span></div>
                    <Input value={title} onChange={event => setTitleDrafts(current => ({ ...current, [issue.id]: event.target.value }))} aria-label={lang === "ko" ? "주보 제목" : "Newsletter title"} className="max-w-xl border-[#C8D4D9] bg-white font-semibold text-[#163B59]" />
                    <p className="mt-2 truncate text-xs text-[#607A91]">{issue.sourceFilename}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button size="sm" variant="outline" asChild className="border-[#C8D4D9] bg-white text-[#163B59]"><a href={issue.storageUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 size-3.5" />{lang === "ko" ? "PDF 열기" : "Open PDF"}</a></Button>
                    <Button size="sm" variant="outline" disabled={pending || title === issue.titleKo} onClick={() => updateMutation.mutate({ id: issue.id, titleKo: title })} className="border-[#C8D4D9] bg-white text-[#163B59]"><CheckCircle2 className="mr-1 size-3.5" />{lang === "ko" ? "제목 저장" : "Save title"}</Button>
                    {issue.status !== "published" ? <Button size="sm" variant="outline" disabled={pending} onClick={() => updateMutation.mutate({ id: issue.id, status: "published" })} className="border-[#B9955E]/50 bg-[#FFFEFB] text-[#8A6420]"><Eye className="mr-1 size-3.5" />{lang === "ko" ? "공개" : "Publish"}</Button> : <Button size="sm" variant="outline" disabled={pending} onClick={() => updateMutation.mutate({ id: issue.id, status: "hidden" })} className="border-[#C8D4D9] bg-white text-[#607A91]"><EyeOff className="mr-1 size-3.5" />{lang === "ko" ? "숨기기" : "Hide"}</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

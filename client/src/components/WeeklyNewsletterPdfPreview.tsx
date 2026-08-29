import { Download, ExternalLink, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WeeklyNewsletterPreviewIssue = {
  id: number;
  issueDate: string;
  titleKo: string;
  titleEn: string | null;
  driveFileId: string;
  storageUrl: string;
};

export function WeeklyNewsletterPdfPreview({
  issue,
  lang,
  onOpenChange,
}: {
  issue: WeeklyNewsletterPreviewIssue | null;
  lang: "ko" | "en";
  onOpenChange: (open: boolean) => void;
}) {
  const title = issue ? (lang === "en" && issue.titleEn ? issue.titleEn : issue.titleKo) : "";
  const googleDrivePreviewUrl = issue ? `https://drive.google.com/file/d/${issue.driveFileId}/preview` : "";

  return (
    <Dialog open={Boolean(issue)} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[94vh] max-w-[min(96vw,76rem)] gap-0 overflow-hidden border-[#DCE4E7] bg-[#FFFEFB] p-0 shadow-2xl">
        <DialogHeader className="border-b border-[#DCE4E7] bg-[#F6F0E5] px-5 py-4 text-left sm:px-7">
          <div className="flex items-start justify-between gap-4 pr-7">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#B07834]"><FileText className="size-3.5" />{lang === "ko" ? "교회 주보 PDF" : "Church bulletin PDF"}</p>
              <DialogTitle className="mt-1 truncate font-serif text-xl font-semibold text-[#163B59] sm:text-2xl">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-[#607A91]">{lang === "ko" ? "뷰어의 페이지 제어를 사용해 주보를 넘겨 볼 수 있습니다." : "Use the viewer controls to browse through the bulletin pages."}</DialogDescription>
            </div>
            <DialogClose aria-label={lang === "ko" ? "주보 미리보기 닫기" : "Close bulletin preview"} className="absolute right-4 top-4 rounded-sm p-2 text-[#607A91] transition-colors hover:bg-white hover:text-[#163B59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2"><X className="size-5" /></DialogClose>
          </div>
        </DialogHeader>

        {issue && <iframe key={issue.id} src={googleDrivePreviewUrl} title={lang === "ko" ? `${title} PDF 미리보기` : `${title} PDF preview`} className="h-[67vh] min-h-[28rem] w-full bg-[#E7EEF1]" />}

        {issue && <DialogFooter className="border-t border-[#DCE4E7] bg-white px-5 py-4 sm:px-7">
          <DialogClose className="inline-flex h-10 items-center justify-center rounded-sm border border-[#C8D4D9] px-4 text-sm font-semibold text-[#163B59] transition-colors hover:bg-[#F4F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2">{lang === "ko" ? "닫기" : "Close"}</DialogClose>
          <a href={issue.storageUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-[#B9955E]/50 px-4 text-sm font-semibold text-[#163B59] transition-colors hover:border-[#B9955E] hover:bg-[#F6F0E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2"><ExternalLink className="size-4 text-[#B07834]" />{lang === "ko" ? "새 창에서 열기" : "Open in new tab"}</a>
          <a href={issue.storageUrl} download className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#163B59] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#245170] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2"><Download className="size-4" />{lang === "ko" ? "다운로드" : "Download"}</a>
        </DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

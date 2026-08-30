import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryLightboxPhoto = {
  id: number;
  storageUrl: string;
  captionKo: string | null;
  captionEn: string | null;
  altTextKo: string | null;
  altTextEn: string | null;
};

type GalleryLightboxProps = {
  photo: GalleryLightboxPhoto | null;
  photos: GalleryLightboxPhoto[];
  lang: "ko" | "en";
  onSelect: (id: number | null) => void;
};

/** Full-screen, keyboard-friendly viewer for already-public church gallery photos. */
export function GalleryLightbox({ photo, photos, lang, onSelect }: GalleryLightboxProps) {
  const activeIndex = photo ? photos.findIndex((item) => item.id === photo.id) : -1;
  const goToPhoto = (offset: number) => {
    if (activeIndex < 0 || photos.length < 2) return;
    const nextIndex = (activeIndex + offset + photos.length) % photos.length;
    onSelect(photos[nextIndex]?.id ?? null);
  };

  const caption = photo ? (lang === "en" ? photo.captionEn ?? photo.captionKo : photo.captionKo ?? photo.captionEn) : null;
  const alt = photo ? (lang === "en" ? photo.altTextEn ?? photo.altTextKo : photo.altTextKo ?? photo.altTextEn) || caption || (lang === "ko" ? "교회 갤러리 사진" : "Church gallery photo") : "";

  return (
    <Dialog open={Boolean(photo)} onOpenChange={(open) => { if (!open) onSelect(null); }}>
      <DialogContent onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); goToPhoto(-1); } if (event.key === "ArrowRight") { event.preventDefault(); goToPhoto(1); } }} showCloseButton={false} className="max-h-[calc(100vh-2rem)] max-w-[min(92rem,calc(100%-2rem))] gap-0 overflow-hidden border-white/15 bg-[#0C263B] p-0 text-white sm:max-w-[min(92rem,calc(100%-3rem))]">
        <DialogTitle className="sr-only">{lang === "ko" ? "갤러리 사진 미리보기" : "Gallery photo preview"}</DialogTitle>
        <DialogDescription className="sr-only">{lang === "ko" ? "화살표 키를 사용해 이전 또는 다음 사진을 볼 수 있습니다." : "Use the arrow keys to view the previous or next photo."}</DialogDescription>
        {photo && <div className="relative flex min-h-0 flex-col"><div className="relative grid min-h-[18rem] flex-1 place-items-center bg-black/35 sm:min-h-[28rem]"><img src={photo.storageUrl} alt={alt} className="max-h-[calc(100vh-13rem)] w-full object-contain" />{photos.length > 1 && <><button type="button" onClick={() => goToPhoto(-1)} className="absolute left-3 grid size-10 place-items-center rounded-full border border-white/25 bg-[#0C263B]/80 text-white transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-[#163B59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C484] motion-reduce:transform-none" aria-label={lang === "ko" ? "이전 사진" : "Previous photo"}><ChevronLeft className="size-5" /></button><button type="button" onClick={() => goToPhoto(1)} className="absolute right-3 grid size-10 place-items-center rounded-full border border-white/25 bg-[#0C263B]/80 text-white transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-[#163B59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C484] motion-reduce:transform-none" aria-label={lang === "ko" ? "다음 사진" : "Next photo"}><ChevronRight className="size-5" /></button></>}</div><div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:px-6"><p className="min-w-0 text-sm leading-6 text-[#E7EEF1]">{caption ?? (lang === "ko" ? "교회 공동체의 순간" : "A moment in our church community")}</p><span className="shrink-0 text-xs text-[#D8C49E]">{activeIndex + 1} / {photos.length}</span></div><DialogClose className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/25 bg-[#0C263B]/80 text-white transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-[#163B59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C484] motion-reduce:transform-none" aria-label={lang === "ko" ? "사진 뷰어 닫기" : "Close photo viewer"}><X className="size-5" /></DialogClose></div>}
      </DialogContent>
    </Dialog>
  );
}

import { GalleryLightbox } from "@/components/GalleryLightbox";
import { BrandPageHero } from "@/components/BrandPageHero";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarDays, ChevronRight, Image as ImageIcon, Images, LayoutGrid, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

type GalleryCategory = "all" | "worship" | "prayer" | "fellowship" | "ministry" | "special" | "community" | "other";

const galleryCategories: Array<{ value: GalleryCategory; ko: string; en: string }> = [
  { value: "all", ko: "전체", en: "All" },
  { value: "worship", ko: "예배", en: "Worship" },
  { value: "prayer", ko: "기도", en: "Prayer" },
  { value: "fellowship", ko: "교제", en: "Fellowship" },
  { value: "ministry", ko: "사역", en: "Ministry" },
  { value: "special", ko: "특별 행사", en: "Special" },
  { value: "community", ko: "공동체", en: "Community" },
  { value: "other", ko: "기타", en: "Other" },
];

function formatAlbumDate(value: string | null, lang: "ko" | "en") {
  if (!value) return lang === "ko" ? "날짜 미정" : "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function EmptyPhoto({ label }: { label: string }) {
  return <div className="grid h-full min-h-52 place-items-center bg-[radial-gradient(circle_at_75%_20%,rgba(201,151,62,0.24),transparent_30%),linear-gradient(145deg,#173F5D_0%,#102F49_62%,#10263A_100%)] text-center text-sm text-[#D7E4EA]"><span className="flex flex-col items-center gap-3"><ImageIcon className="size-8 text-[#E5C484]" />{label}</span></div>;
}

export default function Gallery() {
  const { lang } = useLang();
  const [category, setCategory] = useState<GalleryCategory>("all");
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const galleryInput = useMemo(() => category === "all" ? undefined : { category }, [category]);
  const selectedAlbumInput = useMemo(() => ({ id: albumId ?? 1 }), [albumId]);
  const albumsQuery = trpc.gallery.listAlbums.useQuery(galleryInput);
  const albumQuery = trpc.gallery.getAlbum.useQuery(selectedAlbumInput, { enabled: albumId !== null });
  const albums = albumsQuery.data ?? [];
  const selectedAlbum = albumQuery.data;
  const selectedPhoto = selectedAlbum?.photos.find((photo) => photo.id === selectedPhotoId) ?? null;

  const openAlbum = (id: number) => { setSelectedPhotoId(null); setAlbumId(id); };
  const categoryLabel = (value: string) => galleryCategories.find((item) => item.value === value)?.[lang] ?? value;

  return <div className="flex min-h-screen flex-col bg-[#F4F6F7]"><Navbar /><BrandPageHero eyebrow={lang === "ko" ? "Graceway gallery" : "Graceway gallery"} title={lang === "ko" ? "우리의 순간들" : "Moments together"} description={lang === "ko" ? "예배와 기도, 섬김과 교제 가운데 함께하신 은혜의 순간을 나눕니다." : "Share in moments of grace from worship, prayer, service, and fellowship."} visual="community" />
    <main className="container flex-1 py-12 md:py-16">
      {albumId !== null ? <section aria-labelledby="album-title"><Button type="button" variant="outline" onClick={() => { setAlbumId(null); setSelectedPhotoId(null); }} className="border-[#C8D4D9] bg-white text-[#163B59] hover:bg-[#F6F0E5]"><ArrowLeft className="mr-2 size-4" />{lang === "ko" ? "모든 앨범" : "All albums"}</Button>{albumQuery.isLoading ? <div className="grid min-h-80 place-items-center"><Loader2 className="size-8 animate-spin text-[#B07834]" /></div> : selectedAlbum ? <><div className="mt-8 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">{categoryLabel(selectedAlbum.category)}</p><h1 id="album-title" className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#163B59] md:text-5xl">{lang === "en" && selectedAlbum.titleEn ? selectedAlbum.titleEn : selectedAlbum.titleKo}</h1><div className="mt-4 flex items-center gap-2 text-sm text-[#607A91]"><CalendarDays className="size-4 text-[#B07834]" />{formatAlbumDate(selectedAlbum.albumDate, lang)}</div>{(lang === "en" ? selectedAlbum.descriptionEn ?? selectedAlbum.descriptionKo : selectedAlbum.descriptionKo ?? selectedAlbum.descriptionEn) && <p className="mt-5 whitespace-pre-line text-base leading-7 text-[#456276]">{lang === "en" ? selectedAlbum.descriptionEn ?? selectedAlbum.descriptionKo : selectedAlbum.descriptionKo ?? selectedAlbum.descriptionEn}</p>}</div>{selectedAlbum.photos.length ? <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">{selectedAlbum.photos.map((photo) => { const label = lang === "en" ? photo.altTextEn ?? photo.altTextKo ?? photo.captionEn ?? photo.captionKo : photo.altTextKo ?? photo.altTextEn ?? photo.captionKo ?? photo.captionEn; return <button key={photo.id} type="button" onClick={() => setSelectedPhotoId(photo.id)} className="group relative aspect-[3/2] overflow-hidden rounded-md bg-[#173F5D] text-left shadow-[0_8px_18px_rgba(22,59,89,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B07834] focus-visible:ring-offset-2"><img src={photo.storageUrl} alt={label ?? (lang === "ko" ? "교회 행사 사진" : "Church event photo")} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none" /><span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0F2E47]/75 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none" /></button>; })}</div> : <div className="mt-10 rounded-lg border border-dashed border-[#C8D4D9] bg-white px-6 py-14 text-center text-[#607A91]"><Images className="mx-auto mb-3 size-8 text-[#B07834]" />{lang === "ko" ? "공개된 사진을 준비하고 있습니다." : "Published photos are being prepared."}</div>}</> : <div className="mt-10 rounded-lg border border-dashed border-[#C8D4D9] bg-white px-6 py-14 text-center text-[#607A91]">{lang === "ko" ? "요청한 앨범을 찾을 수 없습니다." : "The requested album could not be found."}</div>}</section> : <section aria-labelledby="gallery-archive-title"><div className="flex flex-col justify-between gap-6 border-b border-[#DCE4E7] pb-7 sm:flex-row sm:items-end"><div><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]"><LayoutGrid className="size-3.5" />Photo albums</p><h2 id="gallery-archive-title" className="mt-2 font-serif text-3xl font-semibold text-[#163B59]">{lang === "ko" ? "사진 앨범" : "Photo albums"}</h2><p className="mt-2 text-sm leading-6 text-[#607A91]">{lang === "ko" ? "사진을 선택하면 앨범 안의 모든 순간을 크게 볼 수 있습니다." : "Select an album to view every moment in a larger, focused gallery."}</p></div><div className="flex flex-wrap gap-2" aria-label={lang === "ko" ? "갤러리 유형 필터" : "Gallery category filters"}>{galleryCategories.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#607A91] focus-visible:ring-offset-2 ${category === item.value ? "border-[#163B59] bg-[#163B59] text-white" : "border-[#C8D4D9] bg-white text-[#456276] hover:border-[#B9955E] hover:bg-[#F6F0E5]"}`}>{item[lang]}</button>)}</div></div>{albumsQuery.isLoading ? <div className="grid min-h-96 place-items-center"><Loader2 className="size-8 animate-spin text-[#B07834]" /></div> : albums.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{albums.map((album, index) => <article key={album.id} className={`group overflow-hidden rounded-lg border border-[#DCE4E7] bg-white shadow-[0_10px_25px_rgba(22,59,89,0.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(22,59,89,0.12)] motion-reduce:transform-none ${index === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}><button type="button" onClick={() => openAlbum(album.id)} className={`block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B07834] focus-visible:ring-inset ${index === 0 ? "md:grid md:grid-cols-[1.15fr_0.85fr]" : ""}`}><div className={index === 0 ? "aspect-[16/9] md:aspect-auto md:min-h-72" : "aspect-[3/2]"}>{album.coverPhoto ? <img src={album.coverPhoto.storageUrl} alt={lang === "en" ? album.coverPhoto.altTextEn ?? album.coverPhoto.altTextKo ?? album.titleEn ?? album.titleKo : album.coverPhoto.altTextKo ?? album.coverPhoto.altTextEn ?? album.titleKo} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none" /> : <EmptyPhoto label={lang === "ko" ? "대표 사진 준비 중" : "Cover photo coming soon"} />}</div><div className="flex flex-col justify-between p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">{categoryLabel(album.category)}</p><h3 className="mt-2 font-serif text-2xl font-semibold text-[#163B59]">{lang === "en" && album.titleEn ? album.titleEn : album.titleKo}</h3><p className="mt-2 text-sm text-[#607A91]">{formatAlbumDate(album.albumDate, lang)} · {lang === "ko" ? `${album.photoCount}장` : `${album.photoCount} photos`}</p>{(lang === "en" ? album.descriptionEn ?? album.descriptionKo : album.descriptionKo ?? album.descriptionEn) && <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#456276]">{lang === "en" ? album.descriptionEn ?? album.descriptionKo : album.descriptionKo ?? album.descriptionEn}</p>}</div><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B07834]">{lang === "ko" ? "앨범 보기" : "View album"}<ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" /></span></div></button></article>)}</div> : <div className="mt-9 rounded-lg border border-dashed border-[#C8D4D9] bg-white px-6 py-16 text-center"><Images className="mx-auto mb-4 size-9 text-[#B07834]" /><h3 className="font-serif text-2xl font-semibold text-[#163B59]">{lang === "ko" ? "사진 앨범을 준비하고 있습니다" : "Photo albums are being prepared"}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#607A91]">{lang === "ko" ? "공개가 승인된 교회 행사와 예배 사진이 이곳에 차례로 추가됩니다." : "Approved photos from worship and church events will appear here."}</p></div>}</section>}
    </main><GalleryLightbox photo={selectedPhoto} photos={selectedAlbum?.photos ?? []} lang={lang} onSelect={setSelectedPhotoId} /><Footer />
  </div>;
}

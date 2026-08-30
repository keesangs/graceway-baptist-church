import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ImagePlus, Images, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

type GalleryCategory = "worship" | "prayer" | "fellowship" | "ministry" | "special" | "community" | "other";
type GalleryStatus = "draft" | "published" | "hidden";

const categories: Array<{ value: GalleryCategory; label: string }> = [
  { value: "worship", label: "예배" }, { value: "prayer", label: "기도" }, { value: "fellowship", label: "교제" }, { value: "ministry", label: "사역" }, { value: "special", label: "특별 행사" }, { value: "community", label: "공동체" }, { value: "other", label: "기타" },
];

function emptyAlbumForm() {
  return { titleKo: "", titleEn: "", descriptionKo: "", descriptionEn: "", albumDate: "", category: "other" as GalleryCategory, status: "draft" as GalleryStatus };
}

function statusLabel(status: GalleryStatus) {
  return status === "published" ? "공개" : status === "hidden" ? "숨김" : "초안";
}

function statusStyle(status: GalleryStatus) {
  return status === "published" ? "bg-[#E5F3E8] text-[#2F6741]" : status === "hidden" ? "bg-[#EEF2F4] text-[#617384]" : "bg-[#F8EEDB] text-[#865E1C]";
}

export default function AdminGalleryPanel() {
  const utils = trpc.useUtils();
  const albumsQuery = trpc.gallery.listAdmin.useQuery();
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [photoStatus, setPhotoStatus] = useState<GalleryStatus>("draft");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoAlt, setPhotoAlt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminAlbumInput = useMemo(() => ({ id: albumId ?? 1 }), [albumId]);
  const albumQuery = trpc.gallery.getAdminAlbum.useQuery(adminAlbumInput, { enabled: albumId !== null });
  const activeAlbum = albumQuery.data;

  const refreshGallery = async () => {
    await Promise.all([utils.gallery.listAdmin.invalidate(), utils.gallery.listAlbums.invalidate()]);
    await albumQuery.refetch();
  };

  const createAlbum = trpc.gallery.createAlbum.useMutation({
    onSuccess: async (album) => {
      await refreshGallery();
      if (album) setAlbumId(album.id);
      setAlbumForm(emptyAlbumForm());
    },
  });
  const updateAlbum = trpc.gallery.updateAlbum.useMutation({ onSuccess: refreshGallery });
  const deleteAlbum = trpc.gallery.deleteAlbum.useMutation({ onSuccess: async () => { setAlbumId(null); await utils.gallery.listAdmin.invalidate(); await utils.gallery.listAlbums.invalidate(); } });
  const uploadPhoto = trpc.gallery.uploadPhoto.useMutation({
    onSuccess: async () => {
      setSelectedFile(null); setPhotoCaption(""); setPhotoAlt(""); setPhotoStatus("draft");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshGallery();
    },
  });
  const updatePhoto = trpc.gallery.updatePhoto.useMutation({ onSuccess: refreshGallery });
  const deletePhoto = trpc.gallery.deletePhoto.useMutation({ onSuccess: refreshGallery });

  const submitAlbum = (event: React.FormEvent) => {
    event.preventDefault();
    createAlbum.mutate({
      titleKo: albumForm.titleKo,
      titleEn: albumForm.titleEn || null,
      descriptionKo: albumForm.descriptionKo || null,
      descriptionEn: albumForm.descriptionEn || null,
      albumDate: albumForm.albumDate || null,
      category: albumForm.category,
      status: albumForm.status,
      coverPhotoId: null,
    });
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const submitPhoto = () => {
    if (!selectedFile || !albumId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result.split(",")[1] : null;
      if (!data) return;
      uploadPhoto.mutate({
        albumId,
        filename: selectedFile.name,
        mimeType: selectedFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif",
        fileSize: selectedFile.size,
        data,
        photo: { status: photoStatus, captionKo: photoCaption || null, altTextKo: photoAlt || null },
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const publishAlbum = (status: GalleryStatus) => {
    if (!activeAlbum) return;
    updateAlbum.mutate({ id: activeAlbum.id, album: {
      titleKo: activeAlbum.titleKo, titleEn: activeAlbum.titleEn, descriptionKo: activeAlbum.descriptionKo, descriptionEn: activeAlbum.descriptionEn,
      albumDate: activeAlbum.albumDate, category: activeAlbum.category, status, coverPhotoId: activeAlbum.coverPhotoId,
    } });
  };

  const chooseCover = (coverPhotoId: number) => {
    if (!activeAlbum) return;
    updateAlbum.mutate({ id: activeAlbum.id, album: {
      titleKo: activeAlbum.titleKo, titleEn: activeAlbum.titleEn, descriptionKo: activeAlbum.descriptionKo, descriptionEn: activeAlbum.descriptionEn,
      albumDate: activeAlbum.albumDate, category: activeAlbum.category, status: activeAlbum.status, coverPhotoId,
    } });
  };

  return <section className="space-y-6" aria-labelledby="gallery-admin-title">
    <div className="rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Church gallery</p><h2 id="gallery-admin-title" className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">사진 앨범 관리</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#607A91]">사진은 먼저 초안으로 저장한 뒤, 사진과 앨범을 모두 공개로 전환해야 방문자에게 보입니다. 미성년자나 민감한 장면이 보이는 사진은 필요한 동의를 확인한 뒤 공개해 주세요.</p></div>

    <div className="grid gap-6 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
      <form onSubmit={submitAlbum} className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)]"><h3 className="font-serif text-xl font-semibold text-[#163B59]">새 앨범 만들기</h3><div className="mt-5 space-y-4"><div><Label htmlFor="album-title-ko">앨범 제목 *</Label><Input id="album-title-ko" value={albumForm.titleKo} onChange={(event) => setAlbumForm((form) => ({ ...form, titleKo: event.target.value }))} required className="mt-1.5" placeholder="예: 2026 여름 수련회" /></div><div><Label htmlFor="album-title-en">English title</Label><Input id="album-title-en" value={albumForm.titleEn} onChange={(event) => setAlbumForm((form) => ({ ...form, titleEn: event.target.value }))} className="mt-1.5" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="album-date">행사 날짜</Label><Input id="album-date" type="date" value={albumForm.albumDate} onChange={(event) => setAlbumForm((form) => ({ ...form, albumDate: event.target.value }))} className="mt-1.5" /></div><div><Label>유형</Label><Select value={albumForm.category} onValueChange={(value) => setAlbumForm((form) => ({ ...form, category: value as GalleryCategory }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div><div><Label htmlFor="album-description">앨범 소개</Label><Textarea id="album-description" value={albumForm.descriptionKo} onChange={(event) => setAlbumForm((form) => ({ ...form, descriptionKo: event.target.value }))} className="mt-1.5 min-h-24" placeholder="공개 페이지에 보여 줄 짧은 설명" /></div><div><Label>공개 상태</Label><Select value={albumForm.status} onValueChange={(value) => setAlbumForm((form) => ({ ...form, status: value as GalleryStatus }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">초안 — 관리자만 보기</SelectItem><SelectItem value="published">공개 — 방문자에게 표시</SelectItem></SelectContent></Select></div><Button type="submit" disabled={createAlbum.isPending} className="w-full bg-[#163B59] text-white hover:bg-[#245170]">{createAlbum.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Images className="mr-2 size-4" />}앨범 만들기</Button>{createAlbum.error && <p className="text-sm text-red-700">{createAlbum.error.message}</p>}</div></form>

      <div className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)]"><div className="flex items-center justify-between gap-3"><h3 className="font-serif text-xl font-semibold text-[#163B59]">앨범 목록</h3><span className="text-sm text-[#607A91]">{albumsQuery.data?.length ?? 0}개</span></div>{albumsQuery.isLoading ? <div className="grid min-h-44 place-items-center"><Loader2 className="size-6 animate-spin text-[#B07834]" /></div> : albumsQuery.data?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{albumsQuery.data.map((album) => <button type="button" key={album.id} onClick={() => setAlbumId(album.id)} className={`rounded-lg border p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B07834] ${albumId === album.id ? "border-[#B07834] bg-[#FFFAF0]" : "border-[#DCE4E7] hover:border-[#B7C5CD] hover:bg-[#F8FAFA]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#163B59]">{album.titleKo}</p><p className="mt-1 text-xs text-[#607A91]">{album.albumDate ?? "날짜 미정"} · {categories.find((item) => item.value === album.category)?.label}</p></div><span className={`rounded-full px-2 py-1 text-[0.7rem] font-semibold ${statusStyle(album.status)}`}>{statusLabel(album.status)}</span></div></button>)}</div> : <div className="grid min-h-44 place-items-center text-center text-sm text-[#607A91]"><Images className="mb-3 size-7 text-[#B07834]" />첫 사진 앨범을 만들어 보세요.</div>}</div>
    </div>

    {albumId !== null && <section className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)] sm:p-6">{albumQuery.isLoading ? <div className="grid min-h-56 place-items-center"><Loader2 className="size-7 animate-spin text-[#B07834]" /></div> : activeAlbum && <><div className="flex flex-col justify-between gap-4 border-b border-[#E2E9EB] pb-5 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">Selected album</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{activeAlbum.titleKo}</h3><p className="mt-1 text-sm text-[#607A91]">{activeAlbum.albumDate ?? "날짜 미정"} · 현재 {statusLabel(activeAlbum.status)}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => publishAlbum(activeAlbum.status === "published" ? "draft" : "published")} disabled={updateAlbum.isPending} className="border-[#B9955E]/55 text-[#163B59]">{activeAlbum.status === "published" ? "초안으로 전환" : "앨범 공개"}</Button><Button type="button" variant="outline" onClick={() => { if (window.confirm("이 앨범과 안의 사진 메타데이터를 삭제할까요?")) deleteAlbum.mutate({ id: activeAlbum.id }); }} disabled={deleteAlbum.isPending} className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="mr-1.5 size-4" />삭제</Button></div></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]"><div className="rounded-lg bg-[#F4F6F7] p-4"><h4 className="font-semibold text-[#163B59]">사진 올리기</h4><p className="mt-1 text-xs leading-5 text-[#607A91]">JPG, PNG, WebP, AVIF · 최대 20 MB</p><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectFile} className="mt-4 block w-full text-sm text-[#456276] file:mr-3 file:rounded-md file:border-0 file:bg-[#E7EEF1] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#163B59] hover:file:bg-[#DCE7EB]" /><div className="mt-4 space-y-3"><div><Label htmlFor="photo-caption">사진 설명</Label><Input id="photo-caption" value={photoCaption} onChange={(event) => setPhotoCaption(event.target.value)} className="mt-1.5" /></div><div><Label htmlFor="photo-alt">대체 텍스트</Label><Input id="photo-alt" value={photoAlt} onChange={(event) => setPhotoAlt(event.target.value)} className="mt-1.5" placeholder="사진에 보이는 내용을 짧게 설명" /></div><div><Label>사진 상태</Label><Select value={photoStatus} onValueChange={(value) => setPhotoStatus(value as GalleryStatus)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">초안</SelectItem><SelectItem value="published">공개</SelectItem></SelectContent></Select></div><Button type="button" disabled={!selectedFile || uploadPhoto.isPending} onClick={submitPhoto} className="w-full bg-[#163B59] text-white hover:bg-[#245170]">{uploadPhoto.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}사진 업로드</Button>{uploadPhoto.error && <p className="text-sm text-red-700">{uploadPhoto.error.message}</p>}</div></div>
      <div><div className="flex items-center justify-between"><h4 className="font-semibold text-[#163B59]">사진 검토</h4><span className="text-sm text-[#607A91]">{activeAlbum.photos.length}장</span></div>{activeAlbum.photos.length ? <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{activeAlbum.photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-lg border border-[#DCE4E7] bg-white"><img src={photo.storageUrl} alt={photo.altTextKo ?? photo.captionKo ?? photo.filename} className="aspect-[3/2] w-full object-cover" /><div className="p-3"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusStyle(photo.status)}`}>{statusLabel(photo.status)}</span>{activeAlbum.coverPhotoId === photo.id && <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-[#A76B1E]"><Star className="size-3 fill-current" />대표</span>}</div><p className="mt-2 truncate text-xs text-[#607A91]">{photo.captionKo || photo.filename}</p><div className="mt-3 flex flex-wrap gap-1.5"><button type="button" onClick={() => chooseCover(photo.id)} className="rounded border border-[#D7C08E] px-2 py-1 text-[0.65rem] font-semibold text-[#765114] hover:bg-[#FFF7E5]">대표로</button><button type="button" onClick={() => updatePhoto.mutate({ id: photo.id, photo: { status: photo.status === "published" ? "draft" : "published" } })} className="rounded border border-[#C8D4D9] px-2 py-1 text-[0.65rem] font-semibold text-[#456276] hover:bg-[#EEF3F5]">{photo.status === "published" ? "초안" : "공개"}</button><button type="button" onClick={() => { if (window.confirm("이 사진의 공개 레코드를 삭제할까요?")) deletePhoto.mutate({ id: photo.id }); }} className="rounded border border-red-200 px-2 py-1 text-[0.65rem] font-semibold text-red-700 hover:bg-red-50" aria-label={`${photo.filename} 삭제`}><Trash2 className="size-3" /></button></div></div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-[#C8D4D9] px-5 py-12 text-center text-sm text-[#607A91]"><ImagePlus className="mx-auto mb-3 size-7 text-[#B07834]" />사진을 올리면 이곳에서 공개 여부와 대표 사진을 관리할 수 있습니다.</div>}</div></div>{updateAlbum.error && <p className="mt-4 text-sm text-red-700">{updateAlbum.error.message}</p>}<p className="mt-5 inline-flex items-center gap-2 text-xs text-[#607A91]"><CheckCircle2 className="size-4 text-[#4A8A5A]" />앨범과 사진이 모두 ‘공개’일 때만 방문자 갤러리에 나타납니다.</p></>}</section>}
  </section>;
}

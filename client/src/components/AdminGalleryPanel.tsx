import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Cloud, ImagePlus, Images, Link2, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

type GalleryCategory = "worship" | "prayer" | "fellowship" | "ministry" | "special" | "community" | "other";
type GalleryStatus = "draft" | "published" | "hidden";

const categories: Array<{ value: GalleryCategory; label: string }> = [
  { value: "worship", label: "예배" },
  { value: "prayer", label: "기도" },
  { value: "fellowship", label: "교제" },
  { value: "ministry", label: "사역" },
  { value: "special", label: "특별 행사" },
  { value: "community", label: "공동체" },
  { value: "other", label: "기타" },
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
  const connectionQuery = trpc.googlePhotos.connectionStatus.useQuery();
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [photoStatus, setPhotoStatus] = useState<GalleryStatus>("draft");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoAlt, setPhotoAlt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(() => new Set());
  const [pickerSession, setPickerSession] = useState<{ sessionId: string; pickerUri: string } | null>(null);
  const [importStage, setImportStage] = useState<"idle" | "selecting" | "checking" | "importing">("idle");
  const [googlePhotosMessage, setGooglePhotosMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const result = new URLSearchParams(window.location.search).get("googlePhotos");
    return result === "connected" ? "Google Photos가 연결되었습니다. 이제 사진 선택을 시작할 수 있습니다." : result === "error" ? "Google Photos 연결을 완료하지 못했습니다. 연결 설정을 확인한 뒤 다시 시도해 주세요." : null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminAlbumInput = useMemo(() => ({ id: albumId ?? 1 }), [albumId]);
  const activeAlbumQuery = trpc.gallery.getAdminAlbum.useQuery(adminAlbumInput, { enabled: albumId !== null });
  const activeAlbum = activeAlbumQuery.data;
  const pickerSessionInput = useMemo(() => ({ sessionId: pickerSession?.sessionId ?? "pending-picker-session" }), [pickerSession?.sessionId]);
  const pickerStatusQuery = trpc.googlePhotos.getPickerSession.useQuery(pickerSessionInput, { enabled: Boolean(pickerSession) });

  const refreshGallery = async () => {
    await Promise.all([utils.gallery.listAdmin.invalidate(), utils.gallery.listAlbums.invalidate()]);
    await activeAlbumQuery.refetch();
  };

  const createAlbum = trpc.gallery.createAlbum.useMutation({
    onSuccess: async (album) => {
      await refreshGallery();
      if (album) setAlbumId(album.id);
      setAlbumForm(emptyAlbumForm());
    },
  });
  const updateAlbum = trpc.gallery.updateAlbum.useMutation({ onSuccess: refreshGallery });
  const deleteAlbum = trpc.gallery.deleteAlbum.useMutation({
    onSuccess: async () => {
      setAlbumId(null);
      await Promise.all([utils.gallery.listAdmin.invalidate(), utils.gallery.listAlbums.invalidate()]);
    },
  });
  const uploadPhoto = trpc.gallery.uploadPhoto.useMutation({
    onSuccess: async () => {
      setSelectedFile(null);
      setPhotoCaption("");
      setPhotoAlt("");
      setPhotoStatus("draft");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshGallery();
    },
  });
  const updatePhoto = trpc.gallery.updatePhoto.useMutation({ onSuccess: refreshGallery });
  const publishDraftPhotos = trpc.gallery.publishDraftPhotos.useMutation({ onSuccess: refreshGallery });
  const hidePhotos = trpc.gallery.hidePhotos.useMutation({ onSuccess: async () => { setSelectedPhotoIds(new Set()); await refreshGallery(); } });
  const deletePhotos = trpc.gallery.deletePhotos.useMutation({ onSuccess: async () => { setSelectedPhotoIds(new Set()); await refreshGallery(); } });
  const deletePhoto = trpc.gallery.deletePhoto.useMutation({ onSuccess: refreshGallery });
  const beginGooglePhotosAuthorization = trpc.googlePhotos.beginAuthorization.useMutation({
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
  });
  const createGooglePhotosPicker = trpc.googlePhotos.createPickerSession.useMutation({
    onSuccess: (session) => {
      setPickerSession(session);
      setImportStage("selecting");
      setGooglePhotosMessage("Google Photos 창에서 사진을 선택한 뒤 ‘완료’를 누르고 이 화면으로 돌아와 주세요.");
      window.open(`${session.pickerUri.replace(/\/$/, "")}/autoclose`, "_blank", "noopener,noreferrer");
    },
  });
  const importGooglePhotosSelection = trpc.googlePhotos.importSelection.useMutation({
    onSuccess: async (result) => {
      const details = [
        result.diagnostics.duplicate ? `이미 가져온 사진 ${result.diagnostics.duplicate}장` : null,
        result.diagnostics.nonPhoto ? `사진이 아닌 항목 ${result.diagnostics.nonPhoto}개` : null,
        result.diagnostics.unsupportedFormat ? `지원하지 않는 형식 ${result.diagnostics.unsupportedFormat}장` : null,
        result.diagnostics.tooLarge ? `20MB 초과 ${result.diagnostics.tooLarge}장` : null,
        result.diagnostics.downloadFailed ? `다운로드 실패 ${result.diagnostics.downloadFailed}장` : null,
      ].filter(Boolean);
      setGooglePhotosMessage(`${result.imported}장을 초안으로 가져왔습니다.${details.length ? ` 처리하지 못한 항목: ${details.join(", ")}.` : ""}`);
      setPickerSession(null);
      setImportStage("idle");
      await refreshGallery();
    },
  });
  const disconnectGooglePhotos = trpc.googlePhotos.disconnect.useMutation({ onSuccess: () => connectionQuery.refetch() });

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

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => setSelectedFile(event.target.files?.[0] ?? null);

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

  const updateActiveAlbum = (status: GalleryStatus, coverPhotoId = activeAlbum?.coverPhotoId ?? null) => {
    if (!activeAlbum) return;
    updateAlbum.mutate({
      id: activeAlbum.id,
      album: {
        titleKo: activeAlbum.titleKo,
        titleEn: activeAlbum.titleEn,
        descriptionKo: activeAlbum.descriptionKo,
        descriptionEn: activeAlbum.descriptionEn,
        albumDate: activeAlbum.albumDate,
        category: activeAlbum.category,
        status,
        coverPhotoId,
      },
    });
  };

  const importGooglePhotos = async () => {
    if (!albumId || !pickerSession) return;
    setGooglePhotosMessage(null);
    setImportStage("checking");
    const session = await pickerStatusQuery.refetch();
    if (!session.data?.mediaItemsSet) {
      setGooglePhotosMessage("Google Photos 창에서 사진을 선택하고 ‘완료’를 누른 뒤 다시 가져오기를 눌러 주세요.");
      setImportStage("selecting");
      return;
    }
    setImportStage("importing");
    importGooglePhotosSelection.mutate(
      { albumId, sessionId: pickerSession.sessionId },
      { onError: () => setImportStage("idle"), onSettled: () => setImportStage("idle") },
    );
  };

  const googlePhotosError = beginGooglePhotosAuthorization.error?.message ?? createGooglePhotosPicker.error?.message ?? importGooglePhotosSelection.error?.message;
  const selectedPhotos = activeAlbum?.photos.filter((photo) => selectedPhotoIds.has(photo.id)) ?? [];
  const toggleSelectedPhoto = (photoId: number) => setSelectedPhotoIds((current) => {
    const next = new Set(current);
    if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
    return next;
  });

  return (
    <section className="space-y-6" aria-labelledby="gallery-admin-title">
      <div className="rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Church gallery</p>
        <h2 id="gallery-admin-title" className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">사진 앨범 관리</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607A91]">사진은 먼저 초안으로 저장한 뒤, 사진과 앨범을 모두 공개로 전환해야 방문자에게 보입니다. 미성년자나 민감한 장면이 보이는 사진은 필요한 동의를 확인한 뒤 공개해 주세요.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E3EAEC] pt-4">
          {connectionQuery.data?.connected ? <><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B714A]"><CheckCircle2 className="size-3.5" />Google Photos 연결됨</span><button type="button" onClick={() => disconnectGooglePhotos.mutate()} disabled={disconnectGooglePhotos.isPending} className="text-xs text-[#607A91] underline-offset-2 hover:text-[#163B59] hover:underline">연결 해제</button></> : <><Button type="button" variant="outline" onClick={() => beginGooglePhotosAuthorization.mutate()} disabled={beginGooglePhotosAuthorization.isPending} className="border-[#B9955E]/55 text-[#163B59]">{beginGooglePhotosAuthorization.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Link2 className="mr-1.5 size-4" />}Google Photos 연결</Button><span className="text-xs text-[#607A91]">연결 후 앨범을 선택해 필요한 사진만 가져올 수 있습니다.</span></>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
        <form onSubmit={submitAlbum} className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)]">
          <h3 className="font-serif text-xl font-semibold text-[#163B59]">새 앨범 만들기</h3>
          <div className="mt-5 space-y-4">
            <div><Label htmlFor="album-title-ko">앨범 제목 *</Label><Input id="album-title-ko" value={albumForm.titleKo} onChange={(event) => setAlbumForm((form) => ({ ...form, titleKo: event.target.value }))} required className="mt-1.5" placeholder="예: 2026 여름 수련회" /></div>
            <div><Label htmlFor="album-title-en">English title</Label><Input id="album-title-en" value={albumForm.titleEn} onChange={(event) => setAlbumForm((form) => ({ ...form, titleEn: event.target.value }))} className="mt-1.5" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="album-date">행사 날짜</Label><Input id="album-date" type="date" value={albumForm.albumDate} onChange={(event) => setAlbumForm((form) => ({ ...form, albumDate: event.target.value }))} className="mt-1.5" /></div><div><Label>유형</Label><Select value={albumForm.category} onValueChange={(value) => setAlbumForm((form) => ({ ...form, category: value as GalleryCategory }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label htmlFor="album-description">앨범 소개</Label><Textarea id="album-description" value={albumForm.descriptionKo} onChange={(event) => setAlbumForm((form) => ({ ...form, descriptionKo: event.target.value }))} className="mt-1.5 min-h-24" placeholder="공개 페이지에 보여 줄 짧은 설명" /></div>
            <div><Label>공개 상태</Label><Select value={albumForm.status} onValueChange={(value) => setAlbumForm((form) => ({ ...form, status: value as GalleryStatus }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">초안 — 관리자만 보기</SelectItem><SelectItem value="published">공개 — 방문자에게 표시</SelectItem></SelectContent></Select></div>
            <Button type="submit" disabled={createAlbum.isPending} className="w-full bg-[#163B59] text-white hover:bg-[#245170]">{createAlbum.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Images className="mr-2 size-4" />}앨범 만들기</Button>
            {createAlbum.error && <p className="text-sm text-red-700">{createAlbum.error.message}</p>}
          </div>
        </form>

        <div className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)]">
          <div className="flex items-center justify-between gap-3"><h3 className="font-serif text-xl font-semibold text-[#163B59]">앨범 목록</h3><span className="text-sm text-[#607A91]">{albumsQuery.data?.length ?? 0}개</span></div>
          {albumsQuery.isLoading ? <div className="grid min-h-44 place-items-center"><Loader2 className="size-6 animate-spin text-[#B07834]" /></div> : albumsQuery.data?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{albumsQuery.data.map((album) => <button type="button" key={album.id} onClick={() => { setAlbumId(album.id); setSelectedPhotoIds(new Set()); }} className={`rounded-lg border p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B07834] ${albumId === album.id ? "border-[#B07834] bg-[#FFFAF0]" : "border-[#DCE4E7] hover:border-[#B7C5CD] hover:bg-[#F8FAFA]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#163B59]">{album.titleKo}</p><p className="mt-1 text-xs text-[#607A91]">{album.albumDate ?? "날짜 미정"} · {categories.find((item) => item.value === album.category)?.label}</p></div><span className={`rounded-full px-2 py-1 text-[0.7rem] font-semibold ${statusStyle(album.status)}`}>{statusLabel(album.status)}</span></div></button>)}</div> : <div className="grid min-h-44 place-items-center text-center text-sm text-[#607A91]"><Images className="mb-3 size-7 text-[#B07834]" />첫 사진 앨범을 만들어 보세요.</div>}
        </div>
      </div>

      {albumId !== null && <section className="rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_8px_20px_rgba(22,59,89,0.05)] sm:p-6">
        {activeAlbumQuery.isLoading ? <div className="grid min-h-56 place-items-center"><Loader2 className="size-7 animate-spin text-[#B07834]" /></div> : activeAlbum && <>
          <div className="flex flex-col justify-between gap-4 border-b border-[#E2E9EB] pb-5 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">Selected album</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#163B59]">{activeAlbum.titleKo}</h3><p className="mt-1 text-sm text-[#607A91]">{activeAlbum.albumDate ?? "날짜 미정"} · 현재 {statusLabel(activeAlbum.status)}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => updateActiveAlbum(activeAlbum.status === "published" ? "draft" : "published")} disabled={updateAlbum.isPending} className="border-[#B9955E]/55 text-[#163B59]">{activeAlbum.status === "published" ? "초안으로 전환" : "앨범 공개"}</Button>{activeAlbum.photos.filter((photo) => photo.status === "draft").length > 0 && <Button type="button" onClick={() => { const count = activeAlbum.photos.filter((photo) => photo.status === "draft").length; if (window.confirm(`초안 사진 ${count}장을 모두 공개할까요? 숨김 사진은 변경되지 않습니다.`)) publishDraftPhotos.mutate({ albumId: activeAlbum.id }); }} disabled={publishDraftPhotos.isPending} className="bg-[#163B59] text-white hover:bg-[#245170]">{publishDraftPhotos.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 size-4" />}초안 사진 {activeAlbum.photos.filter((photo) => photo.status === "draft").length}장 모두 공개</Button>}<Button type="button" variant="outline" onClick={() => { if (window.confirm("이 앨범과 안의 사진 메타데이터를 삭제할까요?")) deleteAlbum.mutate({ id: activeAlbum.id }); }} disabled={deleteAlbum.isPending} className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="mr-1.5 size-4" />삭제</Button></div></div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
            <div className="space-y-4">
              <div className="rounded-lg border border-[#D9E2E6] bg-[#F8FAFA] p-4"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#163B59] text-[#E5C484]"><Cloud className="size-4" /></div><div><h4 className="font-semibold text-[#163B59]">Google Photos에서 가져오기</h4><p className="mt-1 text-xs leading-5 text-[#607A91]">사진을 직접 선택하면 사이트에 초안으로 복사됩니다. 전체 앨범은 자동으로 동기화하지 않습니다.</p></div></div>{connectionQuery.data?.connected ? <div className="mt-4"><p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B714A]"><CheckCircle2 className="size-3.5" />Google Photos 연결됨</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { setGooglePhotosMessage(null); setImportStage("selecting"); createGooglePhotosPicker.mutate(); }} disabled={createGooglePhotosPicker.isPending || importStage === "importing"} className="border-[#B9955E]/55 text-[#163B59]">{createGooglePhotosPicker.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <ImagePlus className="mr-1.5 size-4" />}사진 선택</Button>{pickerSession && <Button type="button" onClick={importGooglePhotos} disabled={importGooglePhotosSelection.isPending || pickerStatusQuery.isFetching} className="bg-[#163B59] text-white hover:bg-[#245170]">{importGooglePhotosSelection.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <UploadCloud className="mr-1.5 size-4" />}선택한 사진 가져오기</Button>}<button type="button" onClick={() => disconnectGooglePhotos.mutate()} disabled={disconnectGooglePhotos.isPending} className="text-xs text-[#607A91] underline-offset-2 hover:text-[#163B59] hover:underline">연결 해제</button></div>{importStage !== "idle" && <div className="mt-4 rounded-md border border-[#D5E0E5] bg-white px-3 py-3" role="status" aria-live="polite" aria-busy={importStage === "checking" || importStage === "importing"}><div className="flex items-center gap-2 text-xs font-semibold text-[#163B59]"><Loader2 className={`size-4 text-[#B07834] ${importStage === "selecting" ? "" : "animate-spin"}`} />{importStage === "selecting" ? "Google Photos에서 사진 선택을 기다리고 있습니다" : importStage === "checking" ? "선택 완료 여부를 확인하고 있습니다" : "선택한 사진을 안전하게 가져오고 있습니다"}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5ECEF]" role="progressbar" aria-label="Google Photos 가져오기 진행 상태" aria-valuetext={importStage === "selecting" ? "사진 선택 대기 중" : importStage === "checking" ? "선택 결과 확인 중" : "사진 가져오기 처리 중"}><div className={`h-full rounded-full bg-[#B07834] ${importStage === "selecting" ? "w-1/3" : "w-2/3 animate-pulse"}`} /></div></div>}</div> : <div className="mt-4"><Button type="button" variant="outline" onClick={() => beginGooglePhotosAuthorization.mutate()} disabled={beginGooglePhotosAuthorization.isPending} className="border-[#B9955E]/55 text-[#163B59]">{beginGooglePhotosAuthorization.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Link2 className="mr-1.5 size-4" />}Google Photos 연결</Button><p className="mt-2 text-xs leading-5 text-[#607A91]">연결은 이 관리자 계정의 명시적 사진 선택에만 사용됩니다.</p></div>}{(googlePhotosMessage || googlePhotosError) && <p className="mt-3 rounded-md bg-[#FFF7E8] px-3 py-2 text-xs leading-5 text-[#765114]">{googlePhotosMessage ?? googlePhotosError}</p>}</div>

              <div className="rounded-lg bg-[#F4F6F7] p-4"><h4 className="font-semibold text-[#163B59]">사진 직접 올리기</h4><p className="mt-1 text-xs leading-5 text-[#607A91]">JPG, PNG, WebP, AVIF · 최대 20 MB</p><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectFile} className="mt-4 block w-full text-sm text-[#456276] file:mr-3 file:rounded-md file:border-0 file:bg-[#E7EEF1] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#163B59] hover:file:bg-[#DCE7EB]" /><div className="mt-4 space-y-3"><div><Label htmlFor="photo-caption">사진 설명</Label><Input id="photo-caption" value={photoCaption} onChange={(event) => setPhotoCaption(event.target.value)} className="mt-1.5" /></div><div><Label htmlFor="photo-alt">대체 텍스트</Label><Input id="photo-alt" value={photoAlt} onChange={(event) => setPhotoAlt(event.target.value)} className="mt-1.5" placeholder="사진에 보이는 내용을 짧게 설명" /></div><div><Label>사진 상태</Label><Select value={photoStatus} onValueChange={(value) => setPhotoStatus(value as GalleryStatus)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">초안</SelectItem><SelectItem value="published">공개</SelectItem></SelectContent></Select></div><Button type="button" disabled={!selectedFile || uploadPhoto.isPending} onClick={submitPhoto} className="w-full bg-[#163B59] text-white hover:bg-[#245170]">{uploadPhoto.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}사진 업로드</Button>{uploadPhoto.error && <p className="text-sm text-red-700">{uploadPhoto.error.message}</p>}</div></div>
            </div>

            <div><div className="flex items-center justify-between"><h4 className="font-semibold text-[#163B59]">사진 검토</h4><span className="text-sm text-[#607A91]">{activeAlbum.photos.length}장</span></div>{selectedPhotos.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#D7C08E] bg-[#FFF9EE] px-3 py-2.5" role="status"><span className="mr-auto text-xs font-semibold text-[#765114]">{selectedPhotos.length}장 선택됨</span><button type="button" onClick={() => { if (window.confirm(`선택한 사진 ${selectedPhotos.length}장을 숨길까요? 공개 갤러리에서는 보이지 않게 됩니다.`)) hidePhotos.mutate({ albumId: activeAlbum.id, photoIds: selectedPhotos.map((photo) => photo.id) }); }} disabled={hidePhotos.isPending || deletePhotos.isPending} className="rounded border border-[#C8A466] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#765114] hover:bg-[#FFF4D9]">{hidePhotos.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "선택 사진 숨김"}</button><button type="button" onClick={() => { if (window.confirm(`선택한 사진 ${selectedPhotos.length}장을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) deletePhotos.mutate({ albumId: activeAlbum.id, photoIds: selectedPhotos.map((photo) => photo.id) }); }} disabled={hidePhotos.isPending || deletePhotos.isPending} className="rounded border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">{deletePhotos.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "선택 사진 삭제"}</button><button type="button" onClick={() => setSelectedPhotoIds(new Set())} disabled={hidePhotos.isPending || deletePhotos.isPending} className="px-1.5 text-xs font-semibold text-[#607A91] hover:text-[#163B59]">선택 해제</button></div>}{activeAlbum.photos.length ? <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{activeAlbum.photos.map((photo) => <article key={photo.id} className={`relative overflow-hidden rounded-lg border bg-white ${selectedPhotoIds.has(photo.id) ? "border-[#B07834] ring-2 ring-[#D7C08E]/55" : "border-[#DCE4E7]"}`}><label className="absolute left-2 top-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm"><input type="checkbox" checked={selectedPhotoIds.has(photo.id)} onChange={() => toggleSelectedPhoto(photo.id)} className="size-4 accent-[#B07834]" aria-label={`${photo.filename} 선택`} /></label><img src={photo.storageUrl} alt={photo.altTextKo ?? photo.captionKo ?? photo.filename} className="aspect-[3/2] w-full object-cover" /><div className="p-3"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusStyle(photo.status)}`}>{statusLabel(photo.status)}</span>{activeAlbum.coverPhotoId === photo.id && <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-[#A76B1E]"><Star className="size-3 fill-current" />대표</span>}</div><p className="mt-2 truncate text-xs text-[#607A91]">{photo.captionKo || photo.filename}</p><div className="mt-3 flex flex-wrap gap-1.5"><button type="button" onClick={() => updateActiveAlbum(activeAlbum.status, photo.id)} className="rounded border border-[#D7C08E] px-2 py-1 text-[0.65rem] font-semibold text-[#765114] hover:bg-[#FFF7E5]">대표로</button><button type="button" onClick={() => updatePhoto.mutate({ id: photo.id, photo: { status: photo.status === "published" ? "draft" : "published" } })} className="rounded border border-[#C8D4D9] px-2 py-1 text-[0.65rem] font-semibold text-[#456276] hover:bg-[#EEF3F5]">{photo.status === "published" ? "초안" : "공개"}</button><button type="button" onClick={() => { if (window.confirm("이 사진의 공개 레코드를 삭제할까요?")) deletePhoto.mutate({ id: photo.id }); }} className="rounded border border-red-200 px-2 py-1 text-[0.65rem] font-semibold text-red-700 hover:bg-red-50" aria-label={`${photo.filename} 삭제`}><Trash2 className="size-3" /></button></div></div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-[#C8D4D9] px-5 py-12 text-center text-sm text-[#607A91]"><ImagePlus className="mx-auto mb-3 size-7 text-[#B07834]" />사진을 올리면 이곳에서 공개 여부와 대표 사진을 관리할 수 있습니다.</div>}</div>
          </div>
          {updateAlbum.error && <p className="mt-4 text-sm text-red-700">{updateAlbum.error.message}</p>}
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-[#607A91]"><CheckCircle2 className="size-4 text-[#4A8A5A]" />앨범과 사진이 모두 ‘공개’일 때만 방문자 갤러리에 나타납니다.</p>
        </>}
      </section>}
    </section>
  );
}

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const galleryPage = readFileSync(new URL("../client/src/pages/Gallery.tsx", import.meta.url), "utf8");
const galleryLightbox = readFileSync(new URL("../client/src/components/GalleryLightbox.tsx", import.meta.url), "utf8");
const adminGalleryPanel = readFileSync(new URL("../client/src/components/AdminGalleryPanel.tsx", import.meta.url), "utf8");
const adminInbox = readFileSync(new URL("../client/src/pages/AdminInbox.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const navbar = readFileSync(new URL("../client/src/components/Navbar.tsx", import.meta.url), "utf8");
const galleryRouter = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("church photo gallery experience", () => {
  it("adds a publicly reachable gallery route and bilingual navigation entry", () => {
    expect(app).toContain('path="/gallery" component={Gallery}');
    expect(navbar).toContain('{ href: "/gallery", label: lang === "ko" ? "갤러리" : "Gallery" }');
    expect(galleryPage).toContain("우리의 순간들");
    expect(galleryPage).toContain("Photo albums");
  });

  it("uses category filters, album cards, and an approved-only empty state without fabricated photos", () => {
    expect(galleryPage).toContain("galleryCategories");
    expect(galleryPage).toContain("trpc.gallery.listAlbums.useQuery(galleryInput)");
    expect(galleryPage).toContain("공개가 승인된 교회 행사와 예배 사진");
    expect(galleryRouter).toContain("listPublishedPhotoAlbums(input?.category)");
    expect(galleryRouter).toContain("getPublishedPhotoAlbum(input.id)");
  });

  it("opens published album photos in an accessible keyboard-friendly viewer", () => {
    expect(galleryPage).toContain("GalleryLightbox");
    expect(galleryLightbox).toContain('event.key === "ArrowLeft"');
    expect(galleryLightbox).toContain('event.key === "ArrowRight"');
    expect(galleryLightbox).toContain("사진 뷰어 닫기");
    expect(galleryLightbox).toContain("max-h-[calc(100vh-13rem)]");
  });

  it("keeps album and photo creation, publishing, and review behind the administrator interface", () => {
    expect(adminInbox).toContain('key: "gallery" as Tab');
    expect(adminInbox).toContain("AdminGalleryPanel");
    expect(adminGalleryPanel).toContain("trpc.gallery.createAlbum.useMutation");
    expect(adminGalleryPanel).toContain("trpc.gallery.uploadPhoto.useMutation");
    expect(adminGalleryPanel).toContain("앨범과 사진이 모두 ‘공개’일 때만");
    expect(galleryRouter).toContain("createAlbum: adminProcedure");
    expect(galleryRouter).toContain("uploadPhoto: adminProcedure");
  });

  it("provides bulk draft publishing and a live Google Photos import progress indicator for administrators", () => {
    expect(galleryRouter).toContain("publishDraftPhotos: adminProcedure");
    expect(adminGalleryPanel).toContain('role="progressbar"');
    expect(adminGalleryPanel).toContain("Google Photos 가져오기 진행 상태");
    expect(adminGalleryPanel).toContain("초안 사진 {activeAlbum.photos.filter((photo) => photo.status === \"draft\").length}장 모두 공개");
  });

  it("allows multiple photo selection before confirming bulk hide or irreversible deletion", () => {
    expect(galleryRouter).toContain("hidePhotos: adminProcedure");
    expect(galleryRouter).toContain("deletePhotos: adminProcedure");
    expect(adminGalleryPanel).toContain("선택 사진 숨김");
    expect(adminGalleryPanel).toContain("선택 사진 삭제");
    expect(adminGalleryPanel).toContain("이 작업은 되돌릴 수 없습니다.");
    expect(adminGalleryPanel).toContain("selectedPhotoIds");
  });
});

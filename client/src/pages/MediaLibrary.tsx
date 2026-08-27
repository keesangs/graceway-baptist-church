/**
 * Media Library — Graceway Baptist Church
 * Admin page for uploading and managing church media files (images, sermons, documents).
 * Requires authentication. Delete is restricted to admin users.
 */
import { useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import {
  Upload,
  Trash2,
  FileText,
  Image,
  Music,
  File,
  Loader2,
  LogIn,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

type Category = "all" | "sermon" | "image" | "document" | "other";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All Files",
  sermon: "Sermons",
  image: "Images",
  document: "Documents",
  other: "Other",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  sermon: Music,
  image: Image,
  document: FileText,
  other: File,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MediaLibrary() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<"sermon" | "image" | "document" | "other">("image");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC queries & mutations
  const { data: files, isLoading, refetch } = trpc.media.list.useQuery(
    { category: activeCategory === "all" ? undefined : activeCategory },
    { enabled: isAuthenticated },
  );

  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: () => {
      setUploadStatus("success");
      setUploadFile(null);
      setUploadDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetch();
      setTimeout(() => setUploadStatus("idle"), 3000);
    },
    onError: (err) => {
      setUploadStatus("error");
      setUploadError(err.message);
    },
  });

  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
    setUploadStatus("idle");
    setUploadError("");

    // Auto-detect category from MIME type
    if (file) {
      if (file.type.startsWith("image/")) setUploadCategory("image");
      else if (file.type === "application/pdf" || file.type.includes("document")) setUploadCategory("document");
      else if (file.type.startsWith("audio/") || file.type.startsWith("video/")) setUploadCategory("sermon");
      else setUploadCategory("other");
    }
  };

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadStatus("uploading");
    setUploadError("");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        filename: uploadFile.name,
        mimeType: uploadFile.type || "application/octet-stream",
        fileSize: uploadFile.size,
        category: uploadCategory,
        description: uploadDescription || undefined,
        data: base64,
      });
    };
    reader.readAsDataURL(uploadFile);
  };

  // Auth gate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F7]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[#17324D]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F6F7]">
        <Navbar />
        <section className="py-32">
          <div className="container max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[#17324D]/10 flex items-center justify-center mx-auto mb-6">
              <LogIn size={28} className="text-[#17324D]" />
            </div>
            <h1
              className="text-[#17324D] text-2xl font-bold mb-3"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Sign In Required
            </h1>
            <p className="text-[#242A30]/60 mb-8">
              Please sign in to access the Media Library.
            </p>
            <button
              onClick={() => startLogin()}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200 active:scale-[0.97]"
            >
              <LogIn size={16} /> Sign In
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <Navbar />

      <BrandPageHero
        eyebrow="Church Resources"
        title="Media Library"
        description="A shared library for sermons, worship, images, and documents that serve our church family."
        visual="word"
      />

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Upload Panel ── */}
          <div className="lg:col-span-1">
            <div className="brand-surface sticky top-24 rounded-xl border border-[#DCE4E7] p-6 shadow-none">
              <h2
                className="text-[#17324D] text-lg font-bold mb-5"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                Upload File
              </h2>

              {/* Drop zone */}
              <div
                className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-[#AEBEC6] p-6 text-center transition-all duration-200 hover:border-[#B9955E]/70 hover:bg-[#B9955E]/5"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleDropzoneKeyDown}
                role="button"
                tabIndex={0}
                aria-label="Select a file to upload"
              >
                {uploadFile ? (
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7EEF1]">
                      <File size={18} className="text-[#163B59]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#17324D] text-sm font-medium truncate">{uploadFile.name}</p>
                      <p className="text-[#242A30]/50 text-xs">{formatBytes(uploadFile.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="ml-auto shrink-0 text-[#242A30]/40 hover:text-red-500 transition-colors"
                      aria-label="Clear selected file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-2 text-[#607A91]/55" />
                    <p className="text-sm font-medium text-[#607A91]">Click to select a file</p>
                    <p className="mt-1 text-xs text-[#607A91]/65">Images, PDFs, audio/video · Max 50 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                aria-label="Choose a media file"
              />

              {/* Category */}
              <div className="mb-4">
                <label className="block text-[#17324D] text-xs font-semibold tracking-wide uppercase mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["image", "sermon", "document", "other"] as const).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => setUploadCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium border transition-all duration-150 ${
                          uploadCategory === cat
                            ? "border-[#163B59] bg-[#163B59] text-white"
                            : "border-[#C8D4D9] bg-white text-[#607A91] hover:border-[#607A91]"
                        }`}
                      >
                        <Icon size={13} />
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-[#17324D] text-xs font-semibold tracking-wide uppercase mb-2">
                  Description <span className="text-[#242A30]/40 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="e.g. Sunday Sermon — July 27, 2026"
                  rows={2}
                  className="w-full resize-none rounded-md border border-[#C8D4D9] bg-white px-3 py-2 text-sm text-[#2E3A46] placeholder:text-[#607A91]/55 transition-colors focus:border-[#607A91] focus:outline-none"
                />
              </div>

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploadStatus === "uploading"}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#B9955E] px-5 py-3 text-sm font-semibold tracking-wide text-[#0B2C43] transition-all duration-200 hover:bg-[#C8A977] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadStatus === "uploading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={16} /> Upload File</>
                )}
              </button>

              {/* Status messages */}
              {uploadStatus === "success" && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 size={15} /> File uploaded successfully!
                </div>
              )}
              {uploadStatus === "error" && (
                <div className="mt-3 flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{uploadError || "Upload failed. Please try again."}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── File List ── */}
          <div className="lg:col-span-2">
            {/* Category filter tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-sm text-xs font-semibold tracking-wide border transition-all duration-150 ${
                    activeCategory === cat
                      ? "border-[#163B59] bg-[#163B59] text-white"
                      : "border-[#C8D4D9] bg-[#FFFEFB] text-[#607A91] hover:border-[#607A91]"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-[#17324D]/40" />
              </div>
            ) : !files || files.length === 0 ? (
              <div className="brand-surface rounded-xl border border-[#DCE4E7] p-12 text-center shadow-none">
                <Upload size={36} className="mx-auto mb-3 text-[#607A91]/35" />
                <p className="font-medium text-[#163B59]/70">No files yet</p>
                <p className="mt-1 text-sm text-[#607A91]">Upload your first file using the panel on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const Icon = CATEGORY_ICONS[file.category] ?? File;
                  const isImage = file.mimeType.startsWith("image/");
                  return (
                    <div
                      key={file.id}
                      className="group flex items-center gap-4 rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                    >
                      {/* Thumbnail or icon */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#EEF3F5]">
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon size={22} className="text-[#607A91]/60" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[#163B59]">{file.filename}</p>
                        {file.description && (
                          <p className="mt-0.5 truncate text-xs text-[#607A91]">{file.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="rounded-sm bg-[#E7EEF1] px-2 py-0.5 text-[10px] font-medium capitalize tracking-wide text-[#163B59]">
                            {file.category}
                          </span>
                          <span className="text-xs text-[#607A91]/70">{formatBytes(file.fileSize)}</span>
                          <span className="text-xs text-[#607A91]/70">{formatDate(file.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#607A91] hover:underline"
                        >
                          View
                        </a>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${file.filename}"?`)) {
                                deleteMutation.mutate({ id: file.id });
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-[#242A30]/30 hover:text-red-500 transition-colors rounded-sm hover:bg-red-50"
                            title="Delete file"
                            aria-label={`Delete ${file.filename}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

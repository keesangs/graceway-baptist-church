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
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* Page Header */}
      <section className="pt-28 pb-12 bg-[#17324D] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C9973E] to-transparent opacity-60" />
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#C9973E]" />
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Church Resources</p>
          </div>
          <h1
            className="text-white text-4xl font-bold mb-2"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Media Library
          </h1>
          <p className="text-white/60 text-sm">
            Upload and manage church media — sermons, images, and documents.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Upload Panel ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-sm shadow-sm p-6 sticky top-24">
              <h2
                className="text-[#17324D] text-lg font-bold mb-5"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                Upload File
              </h2>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-[#17324D]/20 rounded-sm p-6 text-center cursor-pointer hover:border-[#C9973E]/60 hover:bg-[#C9973E]/5 transition-all duration-200 mb-4"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-[#17324D]/10 flex items-center justify-center shrink-0">
                      <File size={18} className="text-[#17324D]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#17324D] text-sm font-medium truncate">{uploadFile.name}</p>
                      <p className="text-[#242A30]/50 text-xs">{formatBytes(uploadFile.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="ml-auto shrink-0 text-[#242A30]/40 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-[#17324D]/30 mx-auto mb-2" />
                    <p className="text-[#17324D]/60 text-sm font-medium">Click to select a file</p>
                    <p className="text-[#242A30]/40 text-xs mt-1">Images, PDFs, audio/video · Max 50 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
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
                            ? "bg-[#17324D] text-white border-[#17324D]"
                            : "bg-white text-[#17324D]/70 border-[#17324D]/20 hover:border-[#17324D]/50"
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
                  className="w-full px-3 py-2 border border-[#17324D]/20 rounded-sm text-sm text-[#242A30] placeholder:text-[#242A30]/30 focus:outline-none focus:border-[#C9973E] resize-none transition-colors"
                />
              </div>

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploadStatus === "uploading"}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#C9973E] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#b8862e] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
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
                      ? "bg-[#17324D] text-white border-[#17324D]"
                      : "bg-white text-[#17324D]/70 border-[#17324D]/20 hover:border-[#17324D]/50"
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
              <div className="bg-white rounded-sm shadow-sm p-12 text-center">
                <Upload size={36} className="text-[#17324D]/20 mx-auto mb-3" />
                <p className="text-[#17324D]/50 font-medium">No files yet</p>
                <p className="text-[#242A30]/40 text-sm mt-1">Upload your first file using the panel on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const Icon = CATEGORY_ICONS[file.category] ?? File;
                  const isImage = file.mimeType.startsWith("image/");
                  return (
                    <div
                      key={file.id}
                      className="bg-white rounded-sm shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 group"
                    >
                      {/* Thumbnail or icon */}
                      <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 bg-[#F4F6F7] flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon size={22} className="text-[#17324D]/40" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#17324D] font-semibold text-sm truncate">{file.filename}</p>
                        {file.description && (
                          <p className="text-[#242A30]/55 text-xs truncate mt-0.5">{file.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-[#17324D]/10 text-[#17324D] rounded-sm font-medium tracking-wide capitalize">
                            {file.category}
                          </span>
                          <span className="text-[#242A30]/40 text-xs">{formatBytes(file.fileSize)}</span>
                          <span className="text-[#242A30]/40 text-xs">{formatDate(file.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2F6F9F] text-xs font-medium hover:underline"
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

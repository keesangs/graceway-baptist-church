import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function AdminDailyBible() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    meditationDate: new Date().toISOString().split("T")[0],
    scriptureReference: "",
    scriptureText: "",
    title: "",
    content: "",
    scriptureReferenceEn: "",
    scriptureTextEn: "",
    titleEn: "",
    contentEn: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 접근 제어: 관리자만 접근 가능
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // tRPC 쿼리
  const { data: meditations, isLoading, refetch } = trpc.meditation.list.useQuery({
    limit: 50,
    offset: 0,
  });
  
  const createMutation = trpc.meditation.create.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: lang === "ko" ? "묵상이 추가되었습니다." : "Meditation added successfully." });
      setFormData({
        meditationDate: new Date().toISOString().split("T")[0],
        scriptureReference: "",
        scriptureText: "",
        title: "",
        content: "",
        scriptureReferenceEn: "",
        scriptureTextEn: "",
        titleEn: "",
        contentEn: "",
      });
      refetch();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const updateMutation = trpc.meditation.update.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: lang === "ko" ? "묵상이 수정되었습니다." : "Meditation updated successfully." });
      setEditingId(null);
      setFormData({
        meditationDate: new Date().toISOString().split("T")[0],
        scriptureReference: "",
        scriptureText: "",
        title: "",
        content: "",
        scriptureReferenceEn: "",
        scriptureTextEn: "",
        titleEn: "",
        contentEn: "",
      });
      refetch();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const deleteMutation = trpc.meditation.delete.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: lang === "ko" ? "묵상이 삭제되었습니다." : "Meditation deleted successfully." });
      refetch();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.meditationDate || !formData.scriptureReference || !formData.scriptureText || !formData.title || !formData.content) {
      setMessage({ type: "error", text: lang === "ko" ? "모든 필드를 입력해주세요." : "Please fill in all fields." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId !== null) {
        // 수정 모드
        await updateMutation.mutateAsync({
          id: editingId,
          meditationDate: formData.meditationDate,
          scriptureReference: formData.scriptureReference,
          scriptureText: formData.scriptureText,
          title: formData.title,
          content: formData.content,
          scriptureReferenceEn: formData.scriptureReferenceEn || null,
          scriptureTextEn: formData.scriptureTextEn || null,
          titleEn: formData.titleEn || null,
          contentEn: formData.contentEn || null,
        });
      } else {
        // 추가 모드
        await createMutation.mutateAsync({
          meditationDate: formData.meditationDate,
          scriptureReference: formData.scriptureReference,
          scriptureText: formData.scriptureText,
          title: formData.title,
          content: formData.content,
          scriptureReferenceEn: formData.scriptureReferenceEn || undefined,
          scriptureTextEn: formData.scriptureTextEn || undefined,
          titleEn: formData.titleEn || undefined,
          contentEn: formData.contentEn || undefined,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (meditation: any) => {
    setEditingId(meditation.id);
    setFormData({
      meditationDate: meditation.meditationDate,
      scriptureReference: meditation.scriptureReference,
      scriptureText: meditation.scriptureText,
      title: meditation.title,
      content: meditation.content,
      scriptureReferenceEn: meditation.scriptureReferenceEn ?? "",
      scriptureTextEn: meditation.scriptureTextEn ?? "",
      titleEn: meditation.titleEn ?? "",
      contentEn: meditation.contentEn ?? "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      meditationDate: new Date().toISOString().split("T")[0],
      scriptureReference: "",
      scriptureText: "",
      title: "",
      content: "",
      scriptureReferenceEn: "",
      scriptureTextEn: "",
      titleEn: "",
      contentEn: "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(lang === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure you want to delete?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (loading) {
    return <div className="text-center py-8">{lang === "ko" ? "로딩 중..." : "Loading..."}</div>;
  }

  if (!user || user.role !== "admin") {
    return <div className="text-center py-8 text-red-600">{lang === "ko" ? "접근 권한이 없습니다." : "Access denied."}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FCFAF6]">
      <Navbar />

      <div className="mx-auto mt-20 w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
        <div className="brand-surface mb-8 rounded-xl border border-[#DCE4E7] px-6 py-7 md:px-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-[#B9955E]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#607A91]">Church Staff</p>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[#163B59]">
            {lang === "ko" ? "Daily Bible 관리" : "Daily Bible Management"}
          </h1>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 폼 */}
        <Card className="brand-surface mb-8 rounded-xl border-[#DCE4E7] p-6 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4 [&_input]:border-[#C8D4D9] [&_input]:bg-white [&_input]:focus-visible:ring-[#607A91] [&_textarea]:border-[#C8D4D9] [&_textarea]:bg-white [&_textarea]:focus-visible:ring-[#607A91] [&_label]:text-[#44515C]">
            <div>
              <label htmlFor="admin-meditation-date" className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "날짜" : "Date"}
              </label>
              <Input
                id="admin-meditation-date"
                type="date"
                name="meditationDate"
                value={formData.meditationDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="admin-scripture-reference" className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "성경 구절" : "Scripture Reference"}
              </label>
              <Input
                id="admin-scripture-reference"
                type="text"
                name="scriptureReference"
                placeholder={lang === "ko" ? "예: 시편 119:105-112" : "e.g., John 3:16"}
                value={formData.scriptureReference}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="admin-scripture-text" className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "성경 본문" : "Scripture Text"}
              </label>
              <Textarea
                id="admin-scripture-text"
                name="scriptureText"
                placeholder={lang === "ko" ? "성경 본문을 입력하세요..." : "Enter scripture text..."}
                value={formData.scriptureText}
                onChange={handleInputChange}
                rows={6}
                required
              />
            </div>

            <div>
              <label htmlFor="admin-title" className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "제목" : "Title"}
              </label>
              <Input
                id="admin-title"
                type="text"
                name="title"
                placeholder={lang === "ko" ? "묵상 제목" : "Meditation title"}
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="admin-content" className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "묵상 내용" : "Meditation Content"}
              </label>
              <Textarea
                id="admin-content"
                name="content"
                placeholder={lang === "ko" ? "묵상 내용을 입력하세요..." : "Enter meditation content..."}
                value={formData.content}
                onChange={handleInputChange}
                rows={6}
                required
              />
            </div>

            <fieldset className="space-y-4 border-t border-[#B7C5CD] pt-6">
              <legend className="pr-2 text-sm font-semibold text-[#163B59]">
                English translation <span className="font-normal text-[#607A91]">(optional)</span>
              </legend>
              <p className="-mt-2 text-xs leading-relaxed text-[#607A91]">
                Provide all four fields to present a fully localized English Daily Bible entry. If left blank, English readers will see a clear Korean-content notice.
              </p>
              <div>
                <label htmlFor="admin-scripture-reference-en" className="block text-sm font-medium text-[#17324D] mb-2">Scripture reference</label>
                <Input id="admin-scripture-reference-en" name="scriptureReferenceEn" placeholder="e.g., Ezekiel 44:15–31" value={formData.scriptureReferenceEn} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="admin-scripture-text-en" className="block text-sm font-medium text-[#17324D] mb-2">Scripture text</label>
                <Textarea id="admin-scripture-text-en" name="scriptureTextEn" placeholder="Enter licensed English Scripture text..." value={formData.scriptureTextEn} onChange={handleInputChange} rows={6} />
              </div>
              <div>
                <label htmlFor="admin-title-en" className="block text-sm font-medium text-[#17324D] mb-2">Meditation title</label>
                <Input id="admin-title-en" name="titleEn" placeholder="Enter an English meditation title" value={formData.titleEn} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="admin-content-en" className="block text-sm font-medium text-[#17324D] mb-2">Meditation reflection</label>
                <Textarea id="admin-content-en" name="contentEn" placeholder="Enter the English meditation reflection..." value={formData.contentEn} onChange={handleInputChange} rows={6} />
              </div>
            </fieldset>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className="bg-[#163B59] text-white hover:bg-[#245170]"
              >
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {lang === "ko" ? "처리 중..." : "Processing..."}
                  </>
                ) : editingId !== null ? (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {lang === "ko" ? "수정" : "Update"}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {lang === "ko" ? "추가" : "Add"}
                  </>
                )}
              </Button>
              {editingId !== null && (
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-[#607A91] text-white hover:bg-[#4E687E]"
                >
                  <X className="w-4 h-4 mr-2" />
                  {lang === "ko" ? "취소" : "Cancel"}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* 묵상 목록 */}
        <div>
          <h2 className="mb-4 font-serif text-2xl font-semibold text-[#163B59]">
            {lang === "ko" ? "묵상 목록" : "Meditations"}
          </h2>

          {isLoading ? (
            <div className="text-center py-8">{lang === "ko" ? "로딩 중..." : "Loading..."}</div>
          ) : meditations && meditations.length > 0 ? (
            <div className="space-y-4">
              {meditations.map((meditation) => (
                <Card key={meditation.id} className="brand-surface rounded-xl border-[#DCE4E7] p-4 shadow-none">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-[#607A91]">{meditation.meditationDate}</p>
                      <h3 className="text-lg font-semibold text-[#163B59]">{lang === "en" && meditation.titleEn ? meditation.titleEn : meditation.title}</h3>
                      <p className="text-sm text-[#B07834]">{lang === "en" && meditation.scriptureReferenceEn ? meditation.scriptureReferenceEn : meditation.scriptureReference}</p>
                      <p className="mt-2 line-clamp-2 text-[#44515C]">{lang === "en" && meditation.contentEn ? meditation.contentEn : meditation.content}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(meditation)}
                        size="sm"
                        className="bg-[#607A91] text-white hover:bg-[#4E687E]"
                        aria-label={lang === "ko" ? `${meditation.title} 수정` : `Edit ${meditation.titleEn || meditation.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(meditation.id)}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        aria-label={lang === "ko" ? `${meditation.title} 삭제` : `Delete ${meditation.titleEn || meditation.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {lang === "ko" ? "묵상이 없습니다." : "No meditations yet."}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

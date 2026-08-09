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
    title: "",
    content: "",
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
        title: "",
        content: "",
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
        title: "",
        content: "",
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

    if (!formData.meditationDate || !formData.scriptureReference || !formData.title || !formData.content) {
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
          title: formData.title,
          content: formData.content,
        });
      } else {
        // 추가 모드
        await createMutation.mutateAsync({
          meditationDate: formData.meditationDate,
          scriptureReference: formData.scriptureReference,
          title: formData.title,
          content: formData.content,
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
      title: meditation.title,
      content: meditation.content,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      meditationDate: new Date().toISOString().split("T")[0],
      scriptureReference: "",
      title: "",
      content: "",
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-8 mt-20">
        <h1 className="text-3xl font-bold text-[#17324D] mb-8">
          {lang === "ko" ? "Daily Bible 관리" : "Daily Bible Management"}
        </h1>

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
        <Card className="p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "날짜" : "Date"}
              </label>
              <Input
                type="date"
                name="meditationDate"
                value={formData.meditationDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "성경 구절" : "Scripture Reference"}
              </label>
              <Input
                type="text"
                name="scriptureReference"
                placeholder={lang === "ko" ? "예: 시편 119:105-112" : "e.g., John 3:16"}
                value={formData.scriptureReference}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {lang === "ko"
                  ? "성경 구절을 입력하면 본문이 자동으로 조회됩니다."
                  : "Enter the scripture reference and the text will be fetched automatically."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "제목" : "Title"}
              </label>
              <Input
                type="text"
                name="title"
                placeholder={lang === "ko" ? "묵상 제목" : "Meditation title"}
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#17324D] mb-2">
                {lang === "ko" ? "묵상 내용" : "Meditation Content"}
              </label>
              <Textarea
                name="content"
                placeholder={lang === "ko" ? "묵상 내용을 입력하세요..." : "Enter meditation content..."}
                value={formData.content}
                onChange={handleInputChange}
                rows={6}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className="bg-[#17324D] hover:bg-[#0f1f33] text-white"
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
                  className="bg-gray-400 hover:bg-gray-500 text-white"
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
          <h2 className="text-2xl font-bold text-[#17324D] mb-4">
            {lang === "ko" ? "묵상 목록" : "Meditations"}
          </h2>

          {isLoading ? (
            <div className="text-center py-8">{lang === "ko" ? "로딩 중..." : "Loading..."}</div>
          ) : meditations && meditations.length > 0 ? (
            <div className="space-y-4">
              {meditations.map((meditation) => (
                <Card key={meditation.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{meditation.meditationDate}</p>
                      <h3 className="text-lg font-semibold text-[#17324D]">{meditation.title}</h3>
                      <p className="text-sm text-[#C9973E]">{meditation.scriptureReference}</p>
                      <p className="text-gray-700 mt-2 line-clamp-2">{meditation.content}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(meditation)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(meditation.id)}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
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

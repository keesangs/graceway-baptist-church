import { useState, useEffect } from "react";
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

interface DailyBibleEntry {
  id?: number;
  date: string;
  title: string;
  reference: string;
  passage: string;
  translation: string;
}

export default function AdminDailyBible() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const [, setLocation] = useLocation();
  
  const [entries, setEntries] = useState<DailyBibleEntry[]>([]);
  const [formData, setFormData] = useState<DailyBibleEntry>({
    date: new Date().toISOString().split("T")[0],
    title: "",
    reference: "",
    passage: "",
    translation: "개역개정",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 접근 제어: 관리자만 접근 가능
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // localStorage에서 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem("dailyBibleEntries");
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  // localStorage에 데이터 저장
  const saveToStorage = (data: DailyBibleEntry[]) => {
    localStorage.setItem("dailyBibleEntries", JSON.stringify(data));
    setEntries(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.title || !formData.reference || !formData.passage) {
      setMessage({ type: "error", text: "모든 필드를 입력해주세요." });
      return;
    }

    if (editingId !== null) {
      // 수정 모드
      const updated = entries.map((entry) =>
        entry.id === editingId ? { ...formData, id: editingId } : entry
      );
      saveToStorage(updated);
      setMessage({ type: "success", text: "데이터가 수정되었습니다." });
      setEditingId(null);
    } else {
      // 추가 모드
      const newEntry: DailyBibleEntry = {
        ...formData,
        id: Date.now(),
      };
      saveToStorage([...entries, newEntry]);
      setMessage({ type: "success", text: "데이터가 추가되었습니다." });
    }

    // 폼 초기화
    setFormData({
      date: new Date().toISOString().split("T")[0],
      title: "",
      reference: "",
      passage: "",
      translation: "개역개정",
    });

    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (entry: DailyBibleEntry) => {
    setFormData(entry);
    setEditingId(entry.id || null);
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    const filtered = entries.filter((entry) => entry.id !== id);
    saveToStorage(filtered);
    setMessage({ type: "success", text: "데이터가 삭제되었습니다." });
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      title: "",
      reference: "",
      passage: "",
      translation: "개역개정",
    });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>{lang === "ko" ? "로딩 중..." : "Loading..."}</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>{lang === "ko" ? "접근 권한이 없습니다." : "Access denied."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#17324D] mb-8">
          {lang === "ko" ? "Daily Bible 관리" : "Daily Bible Management"}
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 폼 섹션 */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[#17324D] mb-4">
                {editingId ? (lang === "ko" ? "수정" : "Edit") : lang === "ko" ? "새 항목 추가" : "Add New"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "날짜" : "Date"}
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "제목" : "Title"}
                  </label>
                  <Input
                    type="text"
                    name="title"
                    placeholder={lang === "ko" ? "예: 하나님의 말씀" : "e.g., God's Word"}
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "성경 구절" : "Scripture Reference"}
                  </label>
                  <Input
                    type="text"
                    name="reference"
                    placeholder={lang === "ko" ? "예: 시편 119:105-112" : "e.g., Psalm 119:105-112"}
                    value={formData.reference}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "번역본" : "Translation"}
                  </label>
                  <select
                    name="translation"
                    value={formData.translation}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, translation: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="개역개정">개역개정</option>
                    <option value="NIV">NIV</option>
                    <option value="ESV">ESV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "본문" : "Passage"}
                  </label>
                  <Textarea
                    name="passage"
                    placeholder={lang === "ko" ? "성경 본문을 입력하세요..." : "Enter the Bible passage..."}
                    value={formData.passage}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#17324D] hover:bg-[#0f1f35]">
                    {editingId ? (lang === "ko" ? "수정" : "Update") : lang === "ko" ? "추가" : "Add"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      {lang === "ko" ? "취소" : "Cancel"}
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          {/* 리스트 섹션 */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[#17324D] mb-4">
              {lang === "ko" ? "저장된 항목" : "Saved Entries"} ({entries.length})
            </h2>

            <div className="space-y-4">
              {entries.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  {lang === "ko" ? "저장된 항목이 없습니다." : "No entries saved yet."}
                </Card>
              ) : (
                entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <Card key={entry.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm text-[#C9973E] font-semibold">{entry.date}</p>
                          <h3 className="text-lg font-bold text-[#17324D]">{entry.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {entry.reference} · {entry.translation}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{entry.passage}</p>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function Meditation() {
  const { lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [qtAnswers, setQtAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  // tRPC 쿼리
  const { data: allMeditations = [] } = trpc.meditation.list.useQuery({
    limit: 365,
    offset: 0,
  });

  const currentMeditation = allMeditations.find((m) => m.meditationDate === currentDate);

  // localStorage에서 QT 답변 로드
  useEffect(() => {
    const saved = localStorage.getItem(`qt_${currentDate}`);
    if (saved) {
      setQtAnswers(JSON.parse(saved));
    } else {
      setQtAnswers({ q1: "", q2: "", q3: "" });
    }
  }, [currentDate]);

  // QT 답변 저장
  const handleQtChange = (key: string, value: string) => {
    const updated = { ...qtAnswers, [key]: value };
    setQtAnswers(updated);
    localStorage.setItem(`qt_${currentDate}`, JSON.stringify(updated));
  };

  // 날짜 네비게이션
  const handlePrevDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    const today = new Date().toISOString().split("T")[0];
    if (date.toISOString().split("T")[0] <= today) {
      setCurrentDate(date.toISOString().split("T")[0]);
    }
  };

  const prevEnabled = allMeditations.some((m) => m.meditationDate < currentDate);
  const nextEnabled = allMeditations.some((m) => m.meditationDate > currentDate);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (lang === "ko") {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getDayOfYear = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const parseScripture = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const match = line.match(/^(\d+):(\d+)\s+(.*)/);
      if (match) {
        const [, chapter, verse, content] = match;
        return (
          <div key={idx} className="mb-2 group">
            <span className="text-[#C9973E] font-semibold">{chapter}:{verse}</span>
            <span className="ml-2 text-gray-800">{content}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${chapter}:${verse} ${content}`);
                setCopiedVerse(`${chapter}:${verse}`);
                setTimeout(() => setCopiedVerse(null), 2000);
              }}
              className="ml-2 opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1 text-sm text-[#C9973E] hover:text-[#17324D]"
            >
              {copiedVerse === `${chapter}:${verse}` ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        );
      }
      return (
        <p key={idx} className="mb-2 text-gray-800">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 mt-20">
        {/* 날짜 네비게이션 */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              disabled={!prevEnabled}
              className="text-gray-600 hover:text-[#17324D] disabled:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#17324D]">{formatDate(currentDate)}</h1>
              <p className="text-gray-600">
                {lang === "ko" ? "연중" : "Day"} {getDayOfYear(currentDate)} of 365
              </p>
            </div>

            <button
              onClick={handleNextDay}
              disabled={!nextEnabled}
              className="text-gray-600 hover:text-[#17324D] disabled:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {currentMeditation ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 (2/3) */}
            <div className="lg:col-span-2">
              <Card className="p-6 mb-8">
                <div className="mb-4">
                  <p className="text-sm text-[#C9973E] font-semibold">
                    {lang === "ko" ? "개역개정" : "Korean Standard Version"}
                  </p>
                  <h2 className="text-2xl font-bold text-[#17324D] mb-2">
                    {currentMeditation.scriptureReference}
                  </h2>
                </div>
                <div className="prose prose-sm max-w-none">
                  {parseScripture(currentMeditation.scriptureText)}
                </div>
              </Card>

              {/* 묵상 나눔 */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#17324D] mb-4">
                  {lang === "ko" ? "묵상 나눔" : "Shared Reflections"}
                </h3>
                <p className="text-gray-500">
                  {lang === "ko" ? "아직 공유된 묵상이 없습니다." : "No shared reflections yet."}
                </p>
              </Card>

              {/* 캘린더 뷰 */}
              <Card className="p-6 mt-8">
                <h3 className="text-lg font-bold text-[#17324D] mb-4">
                  {lang === "ko" ? "지난 묵상 보기" : "Browse Past Meditations"}
                </h3>
                {allMeditations.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2">
                    {/* 요일 헤더 */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="text-center font-semibold text-gray-600 text-sm py-2"
                      >
                        {lang === "ko"
                          ? day === "Sun"
                            ? "일"
                            : day === "Mon"
                              ? "월"
                              : day === "Tue"
                                ? "화"
                                : day === "Wed"
                                  ? "수"
                                  : day === "Thu"
                                    ? "목"
                                    : day === "Fri"
                                      ? "금"
                                      : "토"
                          : day}
                      </div>
                    ))}
                    {/* 캘린더 날짜 */}
                    {allMeditations.map((meditation) => {
                      const date = new Date(meditation.meditationDate + "T00:00:00");
                      const isCurrentDate = meditation.meditationDate === currentDate;

                      return (
                        <button
                          key={meditation.id}
                          onClick={() => setCurrentDate(meditation.meditationDate)}
                          className={`p-2 rounded text-sm font-semibold transition ${
                            isCurrentDate
                              ? "bg-[#17324D] text-white"
                              : "bg-[#C9973E] text-white hover:bg-[#b8873a]"
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    {lang === "ko" ? "아직 묵상이 없습니다." : "No meditations yet."}
                  </p>
                )}
              </Card>
            </div>

            {/* 오른쪽: QT 질문 (1/3, sticky) */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 space-y-6">
                <h3 className="text-lg font-bold text-[#17324D]">
                  {lang === "ko" ? "묵상 질문" : "QT Questions"}
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "1. 하나님은 어떤 분?" : "1. Who is God?"}
                  </label>
                  <Textarea
                    value={qtAnswers.q1}
                    onChange={(e) => handleQtChange("q1", e.target.value)}
                    placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">{qtAnswers.q1.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "2. 나에게 주는 교훈은?" : "2. What is the lesson for me?"}
                  </label>
                  <Textarea
                    value={qtAnswers.q2}
                    onChange={(e) => handleQtChange("q2", e.target.value)}
                    placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">{qtAnswers.q2.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "3. 오늘 나에게 주시는 성경 구절" : "3. Today's verse for me"}
                  </label>
                  <Textarea
                    value={qtAnswers.q3}
                    onChange={(e) => handleQtChange("q3", e.target.value)}
                    placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">{qtAnswers.q3.length}/500</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {lang === "ko" ? "이 날짜의 묵상이 없습니다." : "No meditation for this date."}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

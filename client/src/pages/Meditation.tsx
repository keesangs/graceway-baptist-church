import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Meditation() {
  const { lang } = useLang();
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [qtAnswers, setQtAnswers] = useState<{ q1: string; q2: string; q3: string }>({
    q1: "",
    q2: "",
    q3: "",
  });

  // tRPC 쿼리
  const { data: currentEntry, isLoading } = trpc.meditation.today.useQuery({
    date: currentDate,
  });

  const { data: allMeditations } = trpc.meditation.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // QT 답변 로드 및 저장
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`qt_${currentDate}`);
    if (savedAnswers) {
      setQtAnswers(JSON.parse(savedAnswers));
    } else {
      setQtAnswers({ q1: "", q2: "", q3: "" });
    }
  }, [currentDate]);

  const handleQtChange = (key: "q1" | "q2" | "q3", value: string) => {
    const newAnswers = { ...qtAnswers, [key]: value };
    setQtAnswers(newAnswers);
    localStorage.setItem(`qt_${currentDate}`, JSON.stringify(newAnswers));
  };

  const copyVerse = (verse: string) => {
    navigator.clipboard.writeText(verse);
    setCopiedVerse(verse);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const handlePrevDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(prevDate.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate.toISOString().split("T")[0]);
  };

  // 이전/다음 버튼 활성화 여부
  const prevEnabled = allMeditations?.some((e) => new Date(e.meditationDate) < new Date(currentDate));
  const nextEnabled = allMeditations?.some((e) => new Date(e.meditationDate) > new Date(currentDate));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (lang === "ko") {
      return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    }
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  };

  const getDayOfYear = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
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
              <h1 className="text-3xl font-bold text-[#17324D]">
                {formatDate(currentDate)}
              </h1>
              <p className="text-gray-600">
                {lang === "ko" ? "Day" : "Day"} {getDayOfYear(currentDate)} of 365
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

        {/* 메인 콘텐츠 */}
        {isLoading ? (
          <div className="text-center py-12">
            {lang === "ko" ? "로딩 중..." : "Loading..."}
          </div>
        ) : !currentEntry ? (
          <div className="text-center py-12 text-gray-500">
            {lang === "ko"
              ? "이 날짜의 묵상 데이터가 없습니다."
              : "No meditation data for this date."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 (2/3) */}
            <div className="lg:col-span-2">
              {/* 성경 헤더 */}
              <div className="mb-6">
                <p className="text-[#C9973E] font-semibold mb-2">
                  {lang === "ko" ? "개역개정" : "Korean Bible"}
                </p>
                <h2 className="text-2xl font-bold text-[#17324D] mb-1">
                  {currentEntry.title}
                </h2>
                <p className="text-gray-600">{currentEntry.scriptureReference}</p>
              </div>

              {/* 성경 본문 */}
              <div className="space-y-4 bg-[#F9F7F4] p-6 rounded-lg mb-8">
                {currentEntry.scriptureText.split("\n").filter((v) => v.trim()).map((verse, idx) => {
                  const match = verse.trim().match(/^(\d+:\d+)\s+(.*)/);
                  if (!match) return <p key={idx} className="text-gray-800">{verse}</p>;

                  const [, verseNum, verseText] = match;
                  return (
                    <div key={idx} className="group flex gap-3 hover:bg-white p-2 rounded transition">
                      <span className="text-[#C9973E] font-bold min-w-fit">
                        {verseNum}
                      </span>
                      <p className="text-gray-800 flex-1">{verseText}</p>
                      <button
                        onClick={() => copyVerse(verse)}
                        className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-[#C9973E]"
                      >
                        {copiedVerse === verse ? (
                          <Check size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 묵상 나눔 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-[#17324D] mb-4">
                  {lang === "ko" ? "묵상 나눔" : "Shared Reflections"}
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                    {lang === "ko"
                      ? "아직 공유된 묵상이 없습니다."
                      : "No shared reflections yet."}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: QT 질문 (1/3, sticky) */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 space-y-6">
                <h3 className="text-lg font-bold text-[#17324D]">
                  {lang === "ko" ? "목상 질문" : "QT Questions"}
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko"
                      ? "1. 하나님은 어떤 분?"
                      : "1. Who is God?"}
                  </label>
                  <textarea
                    value={qtAnswers.q1}
                    onChange={(e) => handleQtChange("q1", e.target.value)}
                    placeholder={lang === "ko" ? "묵상을 입력하세요..." : "Enter your reflection..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9973E]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {qtAnswers.q1.length}/500
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko"
                      ? "2. 내게 주는 교훈은?"
                      : "2. What is the lesson?"}
                  </label>
                  <textarea
                    value={qtAnswers.q2}
                    onChange={(e) => handleQtChange("q2", e.target.value)}
                    placeholder={lang === "ko" ? "묵상을 입력하세요..." : "Enter your reflection..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9973E]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {qtAnswers.q2.length}/500
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko"
                      ? "3. 오늘 나에게 주시는 성경 구절"
                      : "3. Today's verse for me"}
                  </label>
                  <textarea
                    value={qtAnswers.q3}
                    onChange={(e) => handleQtChange("q3", e.target.value)}
                    placeholder={lang === "ko" ? "묵상을 입력하세요..." : "Enter your reflection..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9973E]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {qtAnswers.q3.length}/500
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

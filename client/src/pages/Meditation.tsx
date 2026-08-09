import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DailyBibleEntry {
  id?: number;
  date: string;
  title: string;
  reference: string;
  passage: string;
  translation: string;
}

export default function Meditation() {
  const { lang } = useLang();
  const [entries, setEntries] = useState<DailyBibleEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [currentEntry, setCurrentEntry] = useState<DailyBibleEntry | null>(null);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [qtAnswers, setQtAnswers] = useState<{ q1: string; q2: string; q3: string }>({
    q1: "",
    q2: "",
    q3: "",
  });

  // localStorage에서 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem("dailyBibleEntries");
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  // 현재 날짜의 데이터 로드
  useEffect(() => {
    const entry = entries.find((e) => e.date === currentDate);
    setCurrentEntry(entry || null);

    // QT 답변 로드
    const savedAnswers = localStorage.getItem(`qt_${currentDate}`);
    if (savedAnswers) {
      setQtAnswers(JSON.parse(savedAnswers));
    } else {
      setQtAnswers({ q1: "", q2: "", q3: "" });
    }
  }, [currentDate, entries]);

  // QT 답변 자동 저장
  useEffect(() => {
    localStorage.setItem(`qt_${currentDate}`, JSON.stringify(qtAnswers));
  }, [qtAnswers, currentDate]);

  // 한국 날짜 포맷팅
  const formatKoreanDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일`;
  };

  // 연중일수 계산
  const getDayOfYear = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  // 이전/다음 날짜 네비게이션
  const handlePrevDay = () => {
    const prev = new Date(currentDate + "T00:00:00");
    prev.setDate(prev.getDate() - 1);
    const prevDateStr = prev.toISOString().split("T")[0];
    if (entries.some((e) => e.date === prevDateStr)) {
      setCurrentDate(prevDateStr);
    }
  };

  const handleNextDay = () => {
    const next = new Date(currentDate + "T00:00:00");
    next.setDate(next.getDate() + 1);
    const nextDateStr = next.toISOString().split("T")[0];
    if (entries.some((e) => e.date === nextDateStr)) {
      setCurrentDate(nextDateStr);
    }
  };

  // 구절 복사
  const copyVerse = (verse: string) => {
    navigator.clipboard.writeText(verse);
    setCopiedVerse(verse);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // 이전/다음 버튼 활성화 여부
  const prevEnabled = entries.some((e) => new Date(e.date) < new Date(currentDate));
  const nextEnabled = entries.some((e) => new Date(e.date) > new Date(currentDate));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {/* 날짜 네비게이션 */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              disabled={!prevEnabled}
              className="flex items-center gap-2 text-[#17324D] hover:text-[#C9973E] disabled:text-gray-300"
            >
              <ChevronLeft size={20} />
              <span>{lang === "ko" ? "이전" : "Prev"}</span>
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#17324D] mb-1">
                {formatKoreanDate(currentDate)}
              </h1>
              <p className="text-gray-600">
                Day {getDayOfYear(currentDate)} of 365
              </p>
            </div>

            <button
              onClick={handleNextDay}
              disabled={!nextEnabled}
              className="flex items-center gap-2 text-[#17324D] hover:text-[#C9973E] disabled:text-gray-300"
            >
              <span>{lang === "ko" ? "다음" : "Next"}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {currentEntry ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 성경 본문 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                  <p className="text-[#C9973E] text-sm font-semibold mb-2">
                    {currentEntry.translation}
                  </p>
                  <h2 className="text-2xl font-bold text-[#17324D] mb-1">
                    {currentEntry.title}
                  </h2>
                  <p className="text-gray-600">{currentEntry.reference}</p>
                </div>

                <div className="space-y-4 bg-[#F9F7F4] p-6 rounded-lg">
                  {currentEntry.passage.split("\n").map((verse, idx) => {
                    const match = verse.match(/^(\d+:\d+)\s+(.*)/);
                    if (!match) return null;

                    const [, verseNum, verseText] = match;
                    return (
                      <div
                        key={idx}
                        className="group flex gap-3 hover:bg-white p-2 rounded transition"
                      >
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

            {/* 오른쪽: QT 질문 (sticky) */}
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
                    onChange={(e) =>
                      setQtAnswers((prev) => ({ ...prev, q1: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setQtAnswers((prev) => ({ ...prev, q2: e.target.value }))
                    }
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
                      ? "3. 오늘 나에게 주시는 구절"
                      : "3. Today's verse for me"}
                  </label>
                  <textarea
                    value={qtAnswers.q3}
                    onChange={(e) =>
                      setQtAnswers((prev) => ({ ...prev, q3: e.target.value }))
                    }
                    placeholder={lang === "ko" ? "묵상을 입력하세요..." : "Enter your reflection..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9973E]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {qtAnswers.q3.length}/500
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    {lang === "ko"
                      ? "자동으로 저장됩니다"
                      : "Auto-saved"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {lang === "ko"
                ? "이 날짜의 묵상 데이터가 없습니다."
                : "No meditation data for this date."}
            </p>
            <p className="text-sm text-gray-400">
              {lang === "ko"
                ? "관리자가 Daily Bible 데이터를 추가하면 여기에 표시됩니다."
                : "Admin can add Daily Bible data to display here."}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

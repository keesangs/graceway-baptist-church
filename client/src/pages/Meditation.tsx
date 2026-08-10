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
  const [showCalendar, setShowCalendar] = useState(false);

  // tRPC 쿼리 — 모든 묵상 데이터 로드
  const { data: allMeditations = [], isLoading } = trpc.meditation.list.useQuery(
    { limit: 100, offset: 0 },
    { staleTime: 1000 * 60 * 5 } // 5분 캐시
  );

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
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  // 구절 복사
  const handleCopyVerse = (verse: string) => {
    navigator.clipboard.writeText(verse);
    setCopiedVerse(verse);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // 성경 본문 파싱
  const parseScripture = (text: string) => {
    if (!text) return [];
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const match = line.match(/^(\d+:\d+)\s+(.+)$/);
      if (match) {
        return { verse: match[1], text: match[2] };
      }
      return { verse: "", text: line };
    });
  };

  // 캘린더 생성
  const generateCalendar = () => {
    const today = new Date(currentDate);
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendar();
  const today = new Date(currentDate);
  const year = today.getFullYear();
  const month = today.getMonth();

  const handleCalendarDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate.toISOString().split("T")[0]);
    setShowCalendar(false);
  };

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

  const scriptures = currentMeditation ? parseScripture(currentMeditation.scriptureText) : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 pt-20">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            {lang === "ko" ? "매일 말씀과 함께 묵상하는 시간" : "Meditate on God's Word daily"}
          </p>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {formatDate(currentDate)}
            </h2>
            <p className="text-sm text-gray-600">
              {lang === "ko" ? `연중 ${getDayOfYear(currentDate)}일` : `Day ${getDayOfYear(currentDate)} of 365`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
              className="mt-2"
            >
              {lang === "ko" ? "📅 캘린더" : "📅 Calendar"}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 캘린더 뷰 */}
        {showCalendar && (
          <Card className="mb-8 p-6">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => day && handleCalendarDateClick(day)}
                  disabled={!day}
                  className={`p-2 text-sm rounded ${
                    !day
                      ? "bg-transparent"
                      : currentDate === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      ? "bg-blue-500 text-white font-bold"
                      : allMeditations.some(
                          (m) =>
                            m.meditationDate ===
                            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        )
                      ? "bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200"
                      : "bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{lang === "ko" ? "로딩 중..." : "Loading..."}</p>
          </div>
        ) : !currentMeditation ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">
              {lang === "ko" ? "이 날짜의 묵상이 없습니다." : "No meditation for this date."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 (2/3) */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <div className="mb-3">
                  <p className="text-sm text-amber-600 font-semibold mb-1">개역개정</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {currentMeditation.scriptureReference}
                  </h3>
                  <p className="text-gray-600 mb-3">{currentMeditation.title}</p>
                </div>

                <div className="space-y-1 mb-8">
                  {scriptures.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition"
                      onMouseEnter={() => {}}
                    >
                      {item.verse && (
                        <span className="text-amber-600 font-semibold min-w-fit">{item.verse}</span>
                      )}
                      <span className="text-gray-800 flex-1">{item.text}</span>
                      {item.verse && (
                        <button
                          onClick={() => handleCopyVerse(`${item.verse} ${item.text}`)}
                          className="opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedVerse === `${item.verse} ${item.text}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 묵상 나눔 섹션 */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {lang === "ko" ? "묵상 나눔" : "Shared Meditations"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {lang === "ko"
                      ? "다른 성도들의 묵상을 나눌 수 있습니다. (준비 중)"
                      : "Share meditations with other members. (Coming soon)"}
                  </p>
                </div>
              </Card>
            </div>

            {/* 오른쪽: QT 질문 (1/3, sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6 bg-white">
                  <h4 className="font-semibold text-gray-900 mb-6">
                    {lang === "ko" ? "묵상 질문" : "QT Questions"}
                  </h4>

                  <div className="space-y-6">
                    {/* Q1 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "1. 하나님은 어떤 분?" : "1. Who is God?"}
                      </label>
                      <Textarea
                        value={qtAnswers.q1}
                        onChange={(e) => handleQtChange("q1", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>

                    {/* Q2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "2. 내게 주는 교훈은?" : "2. What is the lesson?"}
                      </label>
                      <Textarea
                        value={qtAnswers.q2}
                        onChange={(e) => handleQtChange("q2", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>

                    {/* Q3 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "3. 오늘 나에게 주시는 성경 구절" : "3. Today's verse for me"}
                      </label>
                      <Textarea
                        value={qtAnswers.q3}
                        onChange={(e) => handleQtChange("q3", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>
                  </div>

                  {/* 오디오 플레이스홀더 */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                      {lang === "ko" ? "🎙️ 음성 묵상 (준비 중)" : "🎙️ Voice Meditation (Coming soon)"}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

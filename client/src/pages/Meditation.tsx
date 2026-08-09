import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Verse {
  number: string;
  text: string;
}

interface DailyMeditation {
  date: string;
  koreanDate: string;
  dayOfYear: number;
  title: string;
  reference: string;
  verses: Verse[];
  sharedMeditations: Array<{
    id: string;
    author: string;
    text: string;
    likes: number;
  }>;
}

// Mock data for 5 days
const MOCK_DATA: Record<string, DailyMeditation> = {
  "2026-08-02": {
    date: "2026-08-02",
    koreanDate: "2026년 8월 2일",
    dayOfYear: 215,
    title: "빌립보서",
    reference: "Philippians 4:4-9",
    verses: [
      {
        number: "4:4",
        text: "주 안에서 항상 기뻐하라 내가 다시 말하노니 기뻐하라",
      },
      {
        number: "4:5",
        text: "너희 관용을 모든 사람에게 알게 하라 주가 가까우니라",
      },
      {
        number: "4:6",
        text: "아무것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라",
      },
      {
        number: "4:7",
        text: "그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키리라",
      },
      {
        number: "4:8",
        text: "끝으로 형제들아 무엇이든지 참되며 무엇이든지 경건하며 무엇이든지 옳으며 무엇이든지 정결하며 무엇이든지 사랑할 만하며 무엇이든지 칭찬할 만한 것이 있으면 이것들을 생각하라",
      },
      {
        number: "4:9",
        text: "너희는 내게 배우고 받고 들은 바 곧 나를 본 것을 행하라 그리하면 평강의 하나님이 너희와 함께 계시리라",
      },
    ],
    sharedMeditations: [
      {
        id: "1",
        author: "김성도",
        text: "기쁨과 감사의 삶이 얼마나 중요한지 깨닫습니다. 오늘 하루도 주님 안에서 기뻐하겠습니다.",
        likes: 5,
      },
      {
        id: "2",
        author: "이영미",
        text: "걱정 대신 기도로 모든 것을 주님께 맡기는 법을 배웁니다.",
        likes: 3,
      },
    ],
  },
  "2026-08-03": {
    date: "2026-08-03",
    koreanDate: "2026년 8월 3일",
    dayOfYear: 216,
    title: "요한복음",
    reference: "John 3:16-21",
    verses: [
      {
        number: "3:16",
        text: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이니라",
      },
      {
        number: "3:17",
        text: "하나님이 그 아들을 세상에 보내신 것은 세상을 심판하려 하심이 아니라 저로 말미암아 세상이 구원을 받게 하려 하심이니라",
      },
      {
        number: "3:18",
        text: "저를 믿는 자는 심판을 받지 아니하는 것이요 믿지 아니하는 자는 벌써 심판을 받았으니 이는 하나님의 독생자의 이름을 믿지 아니하였음이니라",
      },
    ],
    sharedMeditations: [
      {
        id: "3",
        author: "박준호",
        text: "하나님의 사랑이 얼마나 크신지 다시 한번 느낍니다.",
        likes: 8,
      },
    ],
  },
  "2026-08-04": {
    date: "2026-08-04",
    koreanDate: "2026년 8월 4일",
    dayOfYear: 217,
    title: "로마서",
    reference: "Romans 8:28-39",
    verses: [
      {
        number: "8:28",
        text: "우리가 알거니와 하나님을 사랑하는 자들 곧 그 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라",
      },
      {
        number: "8:31",
        text: "그러면 이 모든 것에 대하여 우리가 무엇이라 하겠는가 만일 하나님이 우리를 위하시면 누가 우리를 대적하겠는가",
      },
      {
        number: "8:37",
        text: "그러나 이 모든 것에서 우리를 사랑하시는 이로 말미암아 우리가 넉넉히 이기느니라",
      },
    ],
    sharedMeditations: [],
  },
  "2026-08-05": {
    date: "2026-08-05",
    koreanDate: "2026년 8월 5일",
    dayOfYear: 218,
    title: "시편",
    reference: "Psalm 23:1-6",
    verses: [
      {
        number: "23:1",
        text: "여호와는 나의 목자시니 내게 부족함이 없으리로다",
      },
      {
        number: "23:2",
        text: "그가 나를 푸른 풀밭에 누이시며 잔잔한 물 가로 인도하시는도다",
      },
      {
        number: "23:4",
        text: "내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 막대기와 지팡이가 나를 안위하시나이다",
      },
    ],
    sharedMeditations: [
      {
        id: "4",
        author: "최민지",
        text: "주님이 나의 목자이심을 깊이 깨닫습니다.",
        likes: 12,
      },
    ],
  },
  "2026-08-06": {
    date: "2026-08-06",
    koreanDate: "2026년 8월 6일",
    dayOfYear: 219,
    title: "이사야",
    reference: "Isaiah 14:24-27",
    verses: [
      {
        number: "14:24",
        text: "만군의 여호와가 맹세하여 이르되 내가 생각한 것이 반드시 되며 내가 계획한 것이 반드시 이루어지리니",
      },
      {
        number: "14:27",
        text: "만군의 여호와가 계획하셨으니 누가 그것을 깨뜨리겠으며 그의 손이 펴졌으니 누가 그것을 돌이키겠는가",
      },
    ],
    sharedMeditations: [],
  },
};

export default function Meditation() {
  const { lang } = useLang();
  const [currentDate, setCurrentDate] = useState("2026-08-06");
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [qtNotes, setQtNotes] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [shareForm, setShareForm] = useState({
    name: "",
    reflection: "",
  });
  const [shareSubmitted, setShareSubmitted] = useState(false);

  const currentData = MOCK_DATA[currentDate];
  const availableDates = Object.keys(MOCK_DATA).sort();
  const currentIndex = availableDates.indexOf(currentDate);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < availableDates.length - 1;

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`qt-notes-${currentDate}`);
    if (saved) {
      setQtNotes(JSON.parse(saved));
    } else {
      setQtNotes({ q1: "", q2: "", q3: "" });
    }
  }, [currentDate]);

  // Save notes to localStorage
  const saveNotes = (key: string, value: string) => {
    const updated = { ...qtNotes, [key]: value };
    setQtNotes(updated);
    localStorage.setItem(`qt-notes-${currentDate}`, JSON.stringify(updated));
  };

  const copyVerse = (verseNumber: string, text: string) => {
    navigator.clipboard.writeText(`${verseNumber} ${text}`);
    setCopiedVerse(verseNumber);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareForm.name.trim() || !shareForm.reflection.trim()) return;
    setShareSubmitted(true);
    setShareForm({ name: "", reflection: "" });
    setTimeout(() => setShareSubmitted(false), 3000);
  };

  if (!currentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#17324D]">
          {lang === "ko" ? "데이터를 찾을 수 없습니다." : "No data available."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {/* Header */}
      <div className="bg-[#17324D] text-white py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#C9973E]"></div>
            <span className="text-sm font-semibold">
              {lang === "ko" ? "오늘의 말씀 묵상" : "Daily Bible Meditation"}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {lang === "ko" ? "Daily Bible Meditation" : "Daily Bible Meditation"}
          </h1>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                if (canPrev) setCurrentDate(availableDates[currentIndex - 1]);
              }}
              disabled={!canPrev}
              variant="ghost"
              className="text-[#17324D]"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {lang === "ko" ? "이전" : "Prev"}
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-bold text-[#17324D]">
                {currentData.koreanDate}
              </h2>
              <p className="text-sm text-[#17324D]/60">
                {lang === "ko"
                  ? `Day ${currentData.dayOfYear} of 365`
                  : `Day ${currentData.dayOfYear} of 365`}
              </p>
            </div>

            <Button
              onClick={() => {
                if (canNext) setCurrentDate(availableDates[currentIndex + 1]);
              }}
              disabled={!canNext}
              variant="ghost"
              className="text-[#17324D]"
            >
              {lang === "ko" ? "다음" : "Next"}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bible Passage & Shared Meditations */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bible Passage */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
              <div className="mb-6">
                <p className="text-[#C9973E] text-sm font-semibold mb-2">
                  {lang === "ko" ? "경절정" : "Scripture"}
                </p>
                <h3 className="text-2xl font-bold text-[#17324D] mb-1">
                  {currentData.title}
                </h3>
                <p className="text-[#17324D]/60">{currentData.reference}</p>
              </div>

              <div className="space-y-4">
                {currentData.verses.map((verse) => (
                  <div
                    key={verse.number}
                    className="group flex gap-3 p-3 rounded hover:bg-[#F9F5F0] transition-colors"
                  >
                    <span className="text-[#C9973E] font-bold text-sm flex-shrink-0">
                      {verse.number}
                    </span>
                    <p className="text-[#17324D] text-sm leading-relaxed flex-1">
                      {verse.text}
                    </p>
                    <button
                      onClick={() => copyVerse(verse.number, verse.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title={
                        lang === "ko" ? "복사" : "Copy"
                      }
                    >
                      {copiedVerse === verse.number ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#C9973E]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Meditations */}
            {currentData.sharedMeditations.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-[#C9973E]" />
                  <h3 className="text-lg font-bold text-[#17324D]">
                    {lang === "ko" ? "묵상 나눔" : "Shared Meditations"}
                  </h3>
                </div>

                <div className="space-y-4">
                  {currentData.sharedMeditations.map((meditation) => (
                    <div
                      key={meditation.id}
                      className="p-4 bg-[#F9F5F0] rounded border border-[#E5E7EB]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-[#17324D]">
                          {meditation.author}
                        </p>
                        <div className="flex items-center gap-1 text-[#C9973E]">
                          <Heart className="w-4 h-4 fill-current" />
                          <span className="text-sm">{meditation.likes}</span>
                        </div>
                      </div>
                      <p className="text-[#17324D]/80 text-sm">
                        {meditation.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Meditation Form */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
              <h3 className="text-lg font-bold text-[#17324D] mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#C9973E]" />
                {lang === "ko" ? "오늘의 묵상 나눔" : "Share Your Reflection"}
              </h3>

              {shareSubmitted && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  {lang === "ko"
                    ? "감사합니다! 묵상이 공유되었습니다."
                    : "Thank you! Your reflection has been shared."}
                </div>
              )}

              <form onSubmit={handleShareSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "이름" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={shareForm.name}
                    onChange={(e) =>
                      setShareForm({ ...shareForm, name: e.target.value })
                    }
                    placeholder={lang === "ko" ? "이름을 입력하세요" : "Enter your name"}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-sm text-[#17324D] placeholder-[#17324D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9973E]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17324D] mb-2">
                    {lang === "ko" ? "묵상 나눔" : "Reflection"}
                  </label>
                  <textarea
                    value={shareForm.reflection}
                    onChange={(e) =>
                      setShareForm({ ...shareForm, reflection: e.target.value })
                    }
                    placeholder={
                      lang === "ko"
                        ? "오늘 말씀을 통해 받은 깨달음을 나누세요"
                        : "Share your reflection on today's passage"
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-sm text-[#17324D] placeholder-[#17324D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9973E] resize-none"
                  />
                  <p className="text-xs text-[#17324D]/60 mt-1">
                    {lang === "ko"
                      ? "최대 500자까지 입력 가능합니다"
                      : "Maximum 500 characters"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-[#17324D] hover:bg-[#17324D]/90 text-white"
                  >
                    {lang === "ko" ? "묵상 나눔" : "Share"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setShareForm({ name: "", reflection: "" })
                    }
                  >
                    {lang === "ko" ? "취소" : "Cancel"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - QT Panel (Sticky) */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#17324D] mb-4">
                  {lang === "ko" ? "목상 질문" : "QT Questions"}
                </h3>
              </div>

              {/* Q1 */}
              <div>
                <label className="block text-sm font-semibold text-[#17324D] mb-2">
                  {lang === "ko"
                    ? "1. 하나님은 어떤 분?"
                    : "1. Who is God?"}
                </label>
                <textarea
                  value={qtNotes.q1}
                  onChange={(e) => saveNotes("q1", e.target.value)}
                  placeholder={
                    lang === "ko"
                      ? "목상을 입력하세요..."
                      : "Enter your thoughts..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-sm text-[#17324D] placeholder-[#17324D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9973E] resize-none"
                />
                <p className="text-xs text-[#17324D]/60 mt-1">
                  {qtNotes.q1.length}/500
                </p>
              </div>

              {/* Q2 */}
              <div>
                <label className="block text-sm font-semibold text-[#17324D] mb-2">
                  {lang === "ko" ? "2. 내게 주는 교훈은?" : "2. What is the lesson?"}
                </label>
                <textarea
                  value={qtNotes.q2}
                  onChange={(e) => saveNotes("q2", e.target.value)}
                  placeholder={
                    lang === "ko"
                      ? "목상을 입력하세요..."
                      : "Enter your thoughts..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-sm text-[#17324D] placeholder-[#17324D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9973E] resize-none"
                />
                <p className="text-xs text-[#17324D]/60 mt-1">
                  {qtNotes.q2.length}/500
                </p>
              </div>

              {/* Q3 */}
              <div>
                <label className="block text-sm font-semibold text-[#17324D] mb-2">
                  {lang === "ko"
                    ? "3. 오늘 나에게 주시는 구절"
                    : "3. Today's verse for me"}
                </label>
                <textarea
                  value={qtNotes.q3}
                  onChange={(e) => saveNotes("q3", e.target.value)}
                  placeholder={
                    lang === "ko"
                      ? "목상을 입력하세요..."
                      : "Enter your thoughts..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-sm text-[#17324D] placeholder-[#17324D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9973E] resize-none"
                />
                <p className="text-xs text-[#17324D]/60 mt-1">
                  {qtNotes.q3.length}/500
                </p>
              </div>

              {/* Audio Placeholder */}
              <div className="p-4 bg-[#F9F5F0] rounded border border-[#E5E7EB] text-center">
                <p className="text-[#17324D]/60 text-sm">
                  {lang === "ko"
                    ? "🎙️ 묵상 녹음 (준비 중)"
                    : "🎙️ Meditation Recording (Coming soon)"}
                </p>
              </div>

              <p className="text-xs text-[#17324D]/60 text-center">
                {lang === "ko"
                  ? "자동으로 저장됩니다"
                  : "Auto-saved to your browser"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

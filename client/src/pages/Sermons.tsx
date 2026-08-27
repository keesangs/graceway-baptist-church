/**
 * Sermons Page — Graceway Baptist Church
 * Sections: Hero, Featured Sermon, Sermon Archive with filter
 * Features: YouTube thumbnail + inline modal player, KO/EN language toggle
 */
import { useState } from "react";
import { Play, Clock, BookOpen, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { useLang } from "@/contexts/LanguageContext";

const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";

// Real sermon videos from YouTube @keesangs channel — titles & scripture supplied by church
const sermons = [
  {
    titleEn: "Filled with the Holy Spirit",
    titleKo: "성령으로 채우시다",
    scripture: "사도행전 2:22–36",
    scriptureEn: "Acts 2:22–36",
    date: "August 16, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "New",
    series: "Sunday Sermon",
    videoId: "8NchEyAy3jE",
  },
  {
    titleEn: "The Holy Spirit Comes",
    titleKo: "성령이 임하시다",
    scripture: "사도행전 2:1–13",
    scriptureEn: "Acts 2:1–13",
    date: "August 9, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "42 min",
    series: "Sunday Sermon",
    videoId: "qlKRFWwcHQo",
  },
  {
    titleEn: "What It Means to Follow God",
    titleKo: "하나님을 따라간다는 것",
    scripture: "사도행전 1:12–26",
    scriptureEn: "Acts 1:12–26",
    date: "August 2, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "41 min",
    series: "Sunday Sermon",
    videoId: "jStg7ksuSdM",
  },
  {
    titleEn: "A New Era Begins with Small Obedience",
    titleKo: "작은 순종에서 시작되는 새로운 시대",
    scripture: "사도행전 1:1–8",
    scriptureEn: "Acts 1:1–8",
    date: "July 26, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "40 min",
    series: "Sunday Sermon",
    videoId: "AGzMGv7vuhQ",
  },
  {
    titleEn: "Do You Still Not Understand?",
    titleKo: "아직도 깨닫지 못하느냐",
    scripture: "마가복음 8:14–21",
    scriptureEn: "Mark 8:14–21",
    date: "July 19, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "35 min",
    series: "Sunday Sermon",
    videoId: "VaZcVqJo7DE",
  },
  {
    titleEn: "When Your Gaze Changes, the Wilderness Becomes Holy Ground",
    titleKo: "시선이 바뀌면 광야가 거룩한 땅이 됩니다",
    scripture: "출애굽기 3:1–5",
    scriptureEn: "Exodus 3:1–5",
    date: "July 12, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "38 min",
    series: "Sunday Sermon",
    videoId: "zEPMFqmhP_c",
  },
  {
    titleEn: "The Living Stone and the Cornerstone",
    titleKo: "산돌과 모퉁이돌",
    scripture: "베드로전서 2:4–8",
    scriptureEn: "1 Peter 2:4–8",
    date: "July 5, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "40 min",
    series: "Sunday Sermon",
    videoId: "sb_p272zAk8",
  },
  {
    titleEn: "A Small Hope Born from the Ruins",
    titleKo: "폐허 속에서 시작된 작은 소망",
    scripture: "사무엘상 3:1–10",
    scriptureEn: "1 Samuel 3:1–10",
    date: "June 28, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "37 min",
    series: "Sunday Sermon",
    videoId: "UWoh-D-wNg0",
  },
  {
    titleEn: "Same Space, Different Dreams",
    titleKo: "같은 공간 다른 꿈",
    scripture: "마태복음 20:17–28",
    scriptureEn: "Matthew 20:17–28",
    date: "June 21, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "40 min",
    series: "Sunday Sermon",
    videoId: "bsFubkDO1gA",
  },
  {
    titleEn: "Who Is God to Me?",
    titleKo: "나에게 하나님은 어떤 분인가",
    scripture: "잠언 16:9",
    scriptureEn: "Proverbs 16:9",
    date: "June 14, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "39 min",
    series: "Sunday Sermon",
    videoId: "ZYdu3a4pEz4",
  },
  {
    titleEn: "Standing on God's Side",
    titleKo: "하나님 편에 서는 것",
    scripture: "출애굽기 1:15–22",
    scriptureEn: "Exodus 1:15–22",
    date: "June 7, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "34 min",
    series: "Sunday Sermon",
    videoId: "fhCKIZjuXfs",
  },
];

const seriesFilters = ["All", "Sunday Sermon"];

// YouTube thumbnail URL helper
function ytThumb(videoId: string, quality: "maxresdefault" | "mqdefault" = "mqdefault") {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function Sermons() {
  const { lang, t } = useLang();
  const [activeSeries, setActiveSeries] = useState("All");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = sermons.filter((s) => {
    const matchSeries = activeSeries === "All" || s.series === activeSeries;
    const title = lang === "ko" ? s.titleKo : s.titleEn;
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      (lang === "ko" ? s.scripture : s.scriptureEn).toLowerCase().includes(search.toLowerCase()) ||
      s.speaker.toLowerCase().includes(search.toLowerCase());
    return matchSeries && matchSearch;
  });

  const featured = sermons[0];

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* YouTube Modal Player */}
      {playingId && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPlayingId(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlayingId(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <X size={18} /> {lang === "ko" ? "닫기" : "Close"}
            </button>
            <div className="aspect-video w-full rounded-sm overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0`}
                title="Sermon Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      <BrandPageHero
        eyebrow={t("sermons.messages")}
        title={lang === "ko" ? "주일예배 설교" : t("sermons.title")}
        description={t("sermons.subtitle")}
        visual="word"
      />

      {/* Featured Sermon */}
      <section className="bg-[#FFFEFB] py-16">
        <div className="container">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#B07834]">
            {t("sermons.latestMessage")}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Thumbnail — click to open modal */}
            <button
              className="relative aspect-video rounded-sm overflow-hidden shadow-xl group cursor-pointer w-full text-left"
              onClick={() => setPlayingId(featured.videoId)}
            >
              <img
                src={ytThumb(featured.videoId, "maxresdefault")}
                alt={lang === "ko" ? featured.titleKo : featured.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = SERMON_IMG; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#163B59]/52">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B9955E] shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play size={22} className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-[#17324D]/80 text-white text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                <Clock size={11} /> {featured.duration}
              </div>
              {/* YouTube badge */}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-sm font-bold tracking-wide flex items-center gap-1">
                <Play size={8} className="fill-white" /> YouTube
              </div>
            </button>

            <div>
              <span className="mb-4 inline-block rounded-sm bg-[#E7EEF1] px-3 py-1 text-xs font-medium tracking-wide text-[#163B59]">
                {featured.series}
              </span>
              <h2
                className="mb-3 text-[#163B59]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {lang === "ko" ? featured.titleKo : featured.titleEn}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={14} className="text-[#B07834]" />
                <span className="text-sm font-medium text-[#607A91]">{lang === "ko" ? featured.scripture : featured.scriptureEn}</span>
              </div>
              <p className="text-[#242A30]/60 text-sm mb-6">{featured.speaker} · {featured.date}</p>
              <button
                onClick={() => setPlayingId(featured.videoId)}
                className="inline-flex items-center gap-2 rounded-sm bg-[#163B59] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245170] active:scale-[0.97]"
              >
                <Play size={14} /> {t("sermons.watchNow")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sermon Archive */}
      <section className="bg-[#EEF3F5] py-16">
        <div className="container">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#242A30]/40" />
              <input
                type="text"
                placeholder={t("sermons.searchPlaceholder")}
                aria-label={t("sermons.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-[#C8D4D9] bg-[#FFFEFB] py-2.5 pl-9 pr-4 text-sm transition-colors focus:border-[#607A91] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {seriesFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeries(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                    activeSeries === s
                      ? "bg-[#163B59] text-white"
                      : "border border-[#C8D4D9] bg-[#FFFEFB] text-[#607A91] hover:text-[#163B59]"
                  }`}
                >
                  {s === "All" ? t("sermons.all") : s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s, i) => (
              <button
                key={i}
                onClick={() => setPlayingId(s.videoId)}
                className="group w-full cursor-pointer overflow-hidden rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
                aria-label={lang === "ko" ? `${s.titleKo} 설교 재생` : `Play sermon: ${s.titleEn}`}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={ytThumb(s.videoId, "mqdefault")}
                    alt={lang === "ko" ? s.titleKo : s.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = SERMON_IMG; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#163B59]/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B9955E]">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#17324D]/80 text-white text-[10px] px-2 py-0.5 rounded-sm">
                    {s.duration}
                  </div>
                  {/* YouTube badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-0.5">
                    <Play size={7} className="fill-white" /> YT
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-1 text-[10px] font-medium tracking-wide text-[#B07834]">{lang === "ko" ? s.scripture : s.scriptureEn}</p>
                  <h3
                    className="mb-1.5 text-sm font-semibold leading-snug text-[#163B59] transition-colors group-hover:text-[#607A91]"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {lang === "ko" ? s.titleKo : s.titleEn}
                  </h3>
                  <p className="text-[#242A30]/45 text-[11px]">{s.speaker}</p>
                  <p className="text-[#242A30]/40 text-[11px]">{s.date}</p>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#242A30]/40">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {lang === "ko" ? "검색 결과가 없습니다." : "No sermons found matching your search."}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

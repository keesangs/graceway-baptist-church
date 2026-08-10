/*
 * Worship Page — Graceway Baptist Church
 * Sections: Hero, Featured Worship, Worship Archive with filter
 * Features: YouTube thumbnail + inline modal player, KO/EN language toggle
 */
import { useState } from "react";
import { Play, Clock, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLang } from "@/contexts/LanguageContext";

const WORSHIP_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const HERO_BG = "/manus-storage/hero_bg_67c2aa9c.jpg";

// Sunday worship videos from YouTube @keesangs channel
const worships = [
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 08.09 주일예배 찭양",
    date: "August 9, 2026",
    duration: "16 min",
    series: "Sunday Worship",
    videoId: "8TMb1vhuFa8",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 08.02 주일예배 찭양",
    date: "August 2, 2026",
    duration: "15 min",
    series: "Sunday Worship",
    videoId: "Ms3CFq5-w4M",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 07.26 주일예배 찬양",
    date: "July 26, 2026",
    duration: "14 min",
    series: "Sunday Worship",
    videoId: "XRY1_Q_gWcI",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 07.19 주일예배 찬양",
    date: "July 19, 2026",
    duration: "13 min",
    series: "Sunday Worship",
    videoId: "9oHfjwL_My4",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 07.12 주일예배 찬양",
    date: "July 12, 2026",
    duration: "14 min",
    series: "Sunday Worship",
    videoId: "ucVYWoNQpKs",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 07.05 주일예배 찬양",
    date: "July 5, 2026",
    duration: "15 min",
    series: "Sunday Worship",
    videoId: "r3TXHMWLsrI",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 06.28 주일예배 찬양",
    date: "June 28, 2026",
    duration: "13 min",
    series: "Sunday Worship",
    videoId: "YpQivgdOBNg",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 06.21 주일예배 찬양",
    date: "June 21, 2026",
    duration: "14 min",
    series: "Sunday Worship",
    videoId: "KC7a0rvm0pA",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 06.14 주일예배 찬양",
    date: "June 14, 2026",
    duration: "15 min",
    series: "Sunday Worship",
    videoId: "3fzLUi-QuVY",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 06.07 주일예배 찬양",
    date: "June 7, 2026",
    duration: "14 min",
    series: "Sunday Worship",
    videoId: "kZ6kNX370CU",
  },
];

const seriesFilters = ["All", "Sunday Worship"];

// YouTube thumbnail URL helper
function ytThumb(videoId: string, quality: "maxresdefault" | "mqdefault" = "mqdefault") {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function Worship() {
  const { lang } = useLang();
  const [activeSeries, setActiveSeries] = useState("All");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = worships.filter((w) => {
    const matchSeries = activeSeries === "All" || w.series === activeSeries;
    const title = lang === "ko" ? w.titleKo : w.titleEn;
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());
    return matchSeries && matchSearch;
  });

  const featured = worships[0];

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
                title="Worship Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Page Hero */}
      <section className="relative pt-32 pb-20 bg-[#17324D] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[#17324D]/80" />
        <div className="relative container text-center">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">
            {lang === "ko" ? "찬양" : "Worship"}
          </p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            {lang === "ko" ? "주일예배 찬양" : "Sunday Worship"}
          </h1>
          <div className="w-16 h-0.5 bg-[#C9973E] mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            {lang === "ko"
              ? "주일 예배 시간에 함께 드린 찬양 영상입니다."
              : "Worship videos from our Sunday services."}
          </p>
        </div>
      </section>

      {/* Featured Worship */}
      <section className="py-16 bg-white">
        <div className="container">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-6">
            {lang === "ko" ? "최근 주일예배 찬양" : "Latest Worship"}
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = WORSHIP_IMG;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-[#C9973E] flex items-center justify-center shadow-lg">
                  <Play size={24} className="text-white ml-1" fill="white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white/80 text-xs">{featured.date}</p>
              </div>
            </button>

            {/* Info */}
            <div>
              <h2
                className="text-[#17324D] mb-3"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {lang === "ko" ? featured.titleKo : featured.titleEn}
              </h2>
              <div className="flex items-center gap-4 text-[#242A30]/60 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-[#C9973E]" />
                  {featured.duration}
                </div>
              </div>
              <p className="text-[#242A30]/70 leading-relaxed mb-6">
                {lang === "ko"
                  ? "주일 예배 시간에 함께 드린 찬양입니다. 영상을 클릭하여 재생하세요."
                  : "Worship from our Sunday service. Click to play."}
              </p>
              <button
                onClick={() => setPlayingId(featured.videoId)}
                className="inline-flex items-center gap-2 bg-[#C9973E] text-white px-6 py-2.5 rounded-sm font-semibold text-sm hover:bg-[#B8854F] transition-colors"
              >
                <Play size={16} className="ml-0.5" fill="white" />
                {lang === "ko" ? "재생" : "Play"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Worship Archive */}
      <section className="py-20 bg-[#F4F6F7]">
        <div className="container">
          {/* Filter + Search */}
          <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-4">
                {lang === "ko" ? "지난 주일예배 찬양" : "Worship Archive"}
              </p>
              <h2
                className="text-[#17324D]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
              >
                {lang === "ko" ? "" : "All Worship"}
              </h2>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-3 text-[#242A30]/40" />
              <input
                type="text"
                placeholder={lang === "ko" ? "검색..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E8ECF0] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#C9973E]/50"
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((w, i) => (
                <button
                  key={i}
                  onClick={() => setPlayingId(w.videoId)}
                  className="group text-left rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={ytThumb(w.videoId, "mqdefault")}
                      alt={lang === "ko" ? w.titleKo : w.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = WORSHIP_IMG;
                      }}
                    />
                    <div className="absolute inset-0 bg-[#17324D]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-[#C9973E] flex items-center justify-center">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#17324D]/80 text-white text-[10px] px-2 py-0.5 rounded-sm">
                      {w.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[#17324D] font-semibold text-sm group-hover:text-[#2F6F9F] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                      {lang === "ko" ? w.titleKo : w.titleEn}
                    </h3>
                    <p className="text-[#242A30]/45 text-[11px] mt-2">{w.date}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#242A30]/50">{lang === "ko" ? "검색 결과가 없습니다." : "No results found."}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

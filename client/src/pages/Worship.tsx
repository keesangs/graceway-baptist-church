/*
 * Worship Page — Graceway Baptist Church
 * Sections: Hero, Featured Worship, Worship Archive with filter
 * Features: YouTube thumbnail + inline modal player, KO/EN language toggle
 */
import { useMemo, useState } from "react";
import { Play, Clock, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { useLang } from "@/contexts/LanguageContext";
import { brandVisualAssets } from "@/lib/brandVisualAssets";
import { trpc } from "@/lib/trpc";

const WORSHIP_IMG = brandVisualAssets.worshipCover;

type WorshipCard = {
  titleEn: string;
  titleKo: string;
  date: string;
  duration: string;
  series: string;
  videoId: string;
  thumbnailUrl?: string;
};

// Sunday worship videos from YouTube @keesangs channel
const legacyWorships: WorshipCard[] = [
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 08.09 주일예배 찬양",
    date: "August 9, 2026",
    duration: "16 min",
    series: "Sunday Worship",
    videoId: "8TMb1vhuFa8",
  },
  {
    titleEn: "Sunday Worship",
    titleKo: "2026. 08.02 주일예배 찬양",
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
const WORSHIP_LIST_INPUT = { videoKind: "worship" } as const;

// YouTube thumbnail URL helper
function ytThumb(videoId: string, quality: "maxresdefault" | "mqdefault" = "mqdefault") {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function Worship() {
  const { lang } = useLang();
  const [activeSeries, setActiveSeries] = useState("All");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const syncedVideosQuery = trpc.youtube.list.useQuery(WORSHIP_LIST_INPUT);

  const worships = useMemo(() => {
    const legacyIds = new Set(legacyWorships.map((worship) => worship.videoId));
    const newSyncedWorships = (syncedVideosQuery.data ?? [])
      .filter((video) => !legacyIds.has(video.videoId))
      .map((video) => ({
        titleEn: video.title,
        titleKo: video.title,
        date: new Date(video.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        duration: "New",
        series: "Sunday Worship",
        videoId: video.videoId,
        thumbnailUrl: video.thumbnailUrl,
      }));
    return [...newSyncedWorships, ...legacyWorships];
  }, [syncedVideosQuery.data]);

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

      <BrandPageHero
        eyebrow={lang === "ko" ? "찬양" : "Worship"}
        title={lang === "ko" ? "주일예배 찬양" : "Sunday Worship"}
        description={lang === "ko" ? "매주일 올려드리는 주일예배 찬양영상 라이브러리" : "Worship videos from our Sunday services."}
        visual="community"
        imageSrc={brandVisualAssets.worshipCover}
      />

      {/* Featured Worship */}
      <section className="bg-[#FFFEFB] py-16">
        <div className="container">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#B07834]">
            {lang === "ko" ? "최근 주일예배 찬양" : "Latest Worship"}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Thumbnail — click to open modal */}
            <button
              className="relative aspect-video rounded-sm overflow-hidden shadow-xl group cursor-pointer w-full text-left"
              onClick={() => setPlayingId(featured.videoId)}
            >
              <img
                src={featured.thumbnailUrl ?? ytThumb(featured.videoId, "maxresdefault")}
                alt={lang === "ko" ? featured.titleKo : featured.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = WORSHIP_IMG;
                }}
              />
              <div className="pointer-events-none absolute inset-2 border border-[#D8C49E]/55" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,44,67,0.7),rgba(86,112,138,0.18))]" />
              <div className="absolute inset-0 flex items-center justify-center opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B9955E] shadow-lg">
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
                className="mb-3 text-[#163B59]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {lang === "ko" ? featured.titleKo : featured.titleEn}
              </h2>
              <div className="flex items-center gap-4 text-[#242A30]/60 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-[#B07834]" />
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
                className="inline-flex items-center gap-2 rounded-sm bg-[#B9955E] px-6 py-2.5 text-sm font-semibold text-[#0B2C43] transition-colors hover:bg-[#C8A977]"
              >
                <Play size={16} className="ml-0.5" fill="white" />
                {lang === "ko" ? "재생" : "Play"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Worship Archive */}
      <section className="bg-[#EEF3F5] py-20">
        <div className="container">
          {/* Filter + Search */}
          <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B07834]">
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
                aria-label={lang === "ko" ? "찬양 검색" : "Search worship"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-[#C8D4D9] bg-[#FFFEFB] py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#607A91]/50"
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
                  className="group cursor-pointer overflow-hidden rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
                  aria-label={lang === "ko" ? `${w.titleKo} 찬양 재생` : `Play worship: ${w.titleEn}`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={w.thumbnailUrl ?? ytThumb(w.videoId, "mqdefault")}
                      alt={lang === "ko" ? w.titleKo : w.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = WORSHIP_IMG;
                      }}
                    />
                    <div className="pointer-events-none absolute inset-2 border border-[#D8C49E]/35" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(11,44,67,0.4),rgba(86,112,138,0.16))] opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B9955E]">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#17324D]/80 text-white text-[10px] px-2 py-0.5 rounded-sm">
                      {w.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[#163B59] transition-colors group-hover:text-[#607A91]" style={{ fontFamily: "'Source Serif 4', serif" }}>
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

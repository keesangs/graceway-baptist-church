/**
 * Sermons Page — Graceway Baptist Church
 * Sections: Hero, Featured Sermon, Sermon Archive with filter
 */
import { useState } from "react";
import { Play, Clock, BookOpen, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const HERO_BG = "/manus-storage/hero_bg_67c2aa9c.jpg";

const sermons = [
  { title: "Walking in Grace", scripture: "Ephesians 2:1–10", date: "July 28, 2026", speaker: "Pastor David Kim", duration: "42 min", series: "Grace Series" },
  { title: "The Way of the Cross", scripture: "John 14:1–6", date: "July 21, 2026", speaker: "Pastor David Kim", duration: "38 min", series: "Grace Series" },
  { title: "Community of Grace", scripture: "Acts 2:42–47", date: "July 14, 2026", speaker: "Pastor Sarah Lee", duration: "35 min", series: "Acts" },
  { title: "Faith That Moves Mountains", scripture: "Matthew 17:14–20", date: "July 7, 2026", speaker: "Pastor David Kim", duration: "44 min", series: "Faith Series" },
  { title: "The Good Shepherd", scripture: "John 10:1–18", date: "June 30, 2026", speaker: "Pastor Sarah Lee", duration: "36 min", series: "John" },
  { title: "Renewed in the Spirit", scripture: "Romans 12:1–2", date: "June 23, 2026", speaker: "Pastor David Kim", duration: "40 min", series: "Romans" },
  { title: "Bearing One Another's Burdens", scripture: "Galatians 6:1–5", date: "June 16, 2026", speaker: "Elder James Park", duration: "33 min", series: "Galatians" },
  { title: "The Armor of God", scripture: "Ephesians 6:10–20", date: "June 9, 2026", speaker: "Pastor David Kim", duration: "45 min", series: "Grace Series" },
];

const series = ["All", "Grace Series", "Acts", "Faith Series", "John", "Romans", "Galatians"];

export default function Sermons() {
  const [activeSeries, setActiveSeries] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = sermons.filter((s) => {
    const matchSeries = activeSeries === "All" || s.series === activeSeries;
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.scripture.toLowerCase().includes(search.toLowerCase()) ||
      s.speaker.toLowerCase().includes(search.toLowerCase());
    return matchSeries && matchSearch;
  });

  const featured = sermons[0];

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-20 bg-[#17324D] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[#17324D]/80" />
        <div className="relative container text-center">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Messages</p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            Sermons
          </h1>
          <div className="gold-rule w-16 mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            Explore our library of messages rooted in Scripture and relevant to everyday life.
          </p>
        </div>
      </section>

      {/* Featured Sermon */}
      <section className="py-16 bg-white">
        <div className="container">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-6">Latest Message</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-video rounded-sm overflow-hidden shadow-xl group cursor-pointer">
              <img src={SERMON_IMG} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#17324D]/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#C9973E] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play size={22} className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-[#17324D]/80 text-white text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                <Clock size={11} /> {featured.duration}
              </div>
            </div>
            <div>
              <span className="inline-block text-xs px-3 py-1 bg-[#17324D]/10 text-[#17324D] rounded-sm font-medium tracking-wide mb-4">
                {featured.series}
              </span>
              <h2
                className="text-[#17324D] mb-3"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {featured.title}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={14} className="text-[#C9973E]" />
                <span className="text-[#2F6F9F] text-sm font-medium">{featured.scripture}</span>
              </div>
              <p className="text-[#242A30]/60 text-sm mb-6">{featured.speaker} · {featured.date}</p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#17324D] text-white text-sm font-semibold rounded-sm hover:bg-[#1e4060] transition-colors active:scale-[0.97]">
                <Play size={14} /> Watch Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sermon Archive */}
      <section className="py-16 bg-[#F4F6F7]">
        <div className="container">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#242A30]/40" />
              <input
                type="text"
                placeholder="Search sermons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {series.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeries(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                    activeSeries === s
                      ? "bg-[#17324D] text-white"
                      : "bg-white text-[#242A30]/60 hover:text-[#17324D] border border-[#242A30]/15"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={SERMON_IMG}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#17324D]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-[#C9973E] flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#17324D]/80 text-white text-[10px] px-2 py-0.5 rounded-sm">
                    {s.duration}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[#C9973E] text-[10px] font-medium mb-1 tracking-wide">{s.scripture}</p>
                  <h3
                    className="text-[#17324D] font-semibold mb-1.5 group-hover:text-[#2F6F9F] transition-colors text-sm leading-snug"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-[#242A30]/45 text-[11px]">{s.speaker}</p>
                  <p className="text-[#242A30]/40 text-[11px]">{s.date}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#242A30]/40">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sermons found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

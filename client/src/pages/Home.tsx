/**
 * Home Page — Graceway Baptist Church
 * Design: Modern Reverence — asymmetric editorial, diagonal section cuts,
 * gold rule motifs, scripture blockquotes, warm community photography
 * Features: fade-in hero animation, KO/EN language toggle via useLang
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Clock, MapPin, ArrowRight, Play, ChevronRight, Heart, BookOpen, Users, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLang } from "@/contexts/LanguageContext";

const HERO_BG = "/manus-storage/hero_bg_navy_a8d916a9.jpg";
const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";
const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const KIDS_IMG = "/manus-storage/kids_ministry_a46a1f45.jpg";

// Real sermon videos from YouTube @keesangs channel
const sermons = [
  {
    title: "Sunday Sermon — July 26, 2026",
    titleKo: "2026년 7월 26일 주일 말씀",
    scripture: "",
    date: "July 26, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "40 min",
    videoId: "AGzMGv7vuhQ",
  },
  {
    title: "Sunday Sermon — July 19, 2026",
    titleKo: "2026년 7월 19일 주일 말씀",
    scripture: "",
    date: "July 19, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "35 min",
    videoId: "VaZcVqJo7DE",
  },
  {
    title: "Sunday Sermon — July 12, 2026",
    titleKo: "2026년 7월 12일 주일 말씀",
    scripture: "",
    date: "July 12, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "38 min",
    videoId: "zEPMFqmhP_c",
  },
];

const events = [
  { date: "Aug 10", titleEn: "Sunday Worship Service", titleKo: "주일 예배", time: "1:30 PM", tag: "Weekly" },
  { date: "Aug 13", titleEn: "Wednesday Prayer Meeting", titleKo: "수요 기도회", time: "8:00 PM", tag: "Weekly" },
  { date: "Aug 17", titleEn: "Family Picnic & Fellowship", titleKo: "가족 소풍 & 교제", time: "1:00 PM", tag: "Special" },
  { date: "Aug 24", titleEn: "Youth Night", titleKo: "청년의 밤", time: "6:30 PM", tag: "Youth" },
];

// Fade-in hook using IntersectionObserver
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function Home() {
  const { lang, t } = useLang();
  const [heroVisible, setHeroVisible] = useState(false);

  // Hero fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const storyFade = useFadeIn();
  const sermonFade = useFadeIn();
  const ministriesFade = useFadeIn();
  const kidsFade = useFadeIn();
  const eventsFade = useFadeIn();
  const newsletterFade = useFadeIn();

  const ministries = [
    { icon: BookOpen, titleEn: "Bible Study", titleKo: "성경 공부", descEn: "Wednesday evenings — deep dive into Scripture together.", descKo: "수요일 저녁 — 함께 말씀을 깊이 탐구합니다." },
    { icon: Users, titleEn: "Small Groups", titleKo: "소그룹", descEn: "Connect in community through weekly life groups.", descKo: "주간 소그룹을 통해 공동체와 연결됩니다." },
    { icon: Heart, titleEn: "Outreach", titleKo: "지역 사역", descEn: "Serving our city with grace and compassion.", descKo: "은혜와 사랑으로 우리 도시를 섬깁니다." },
    { icon: Music, titleEn: "Worship Team", titleKo: "찬양팀", descEn: "Join us in leading the congregation in praise.", descKo: "회중을 찬양으로 인도하는 팀에 함께하세요." },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 0 100%)" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17324D]/92 via-[#17324D]/72 to-[#17324D]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#17324D]/70 via-transparent to-transparent" />

        {/* Vertical gold accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C9973E] to-transparent transition-opacity duration-1000"
          style={{ opacity: heroVisible ? 0.6 : 0 }}
        />

        {/* Watermark G — fades in with slight upward drift */}
        <div
          className="absolute right-8 top-1/2 -translate-y-1/2 select-none pointer-events-none transition-all duration-[1400ms] ease-out"
          style={{
            opacity: heroVisible ? 0.07 : 0,
            transform: heroVisible ? "translateY(-50%) scale(1)" : "translateY(-44%) scale(0.95)",
            fontFamily: "'Source Serif 4', serif",
            fontSize: "clamp(14rem, 30vw, 28rem)",
            fontWeight: 700,
            color: "#C9973E",
            lineHeight: 1,
            transitionDelay: "400ms",
          }}
        >
          G
        </div>

        <div className="relative container pt-24 pb-32">
          <div className="max-w-2xl">
            {/* Tag line */}
            <div
              className="flex items-center gap-3 mb-6 transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: "100ms",
              }}
            >
              <div className="h-px w-8 bg-[#C9973E]" />
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">
                {t("home.welcomeTo")}
              </p>
            </div>

            {/* Main title */}
            <h1
              className="text-white mb-6 transition-all duration-700 ease-out"
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: "clamp(2.8rem, 7vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.05,
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(24px)",
                transitionDelay: "220ms",
              }}
            >
              {lang === "ko" ? (
                <>
                  {t("home.heroTitle1")}<br />
                  <span className="text-[#C9973E]">{t("home.heroTitle2")}</span>
                </>
              ) : (
                <>
                  {t("home.heroTitle1")}<br />
                  <span className="text-[#C9973E]">Baptist</span> Church
                </>
              )}
            </h1>

            {/* Korean subtitle / English subtitle */}
            <p
              className="text-white/60 text-sm tracking-[0.15em] mb-3 transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: "340ms",
              }}
            >
              {lang === "en" ? "그레이스웨이 침례교회" : "Graceway Baptist Church"}
            </p>

            {/* Scripture */}
            <div
              className="flex items-center gap-3 mb-6 transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: "400ms",
              }}
            >
              <div className="h-px w-12 bg-[#C9973E]/60" />
              <p className="text-white/70 text-sm italic" style={{ fontFamily: "'Source Serif 4', serif" }}>
                {lang === "ko"
                  ? '"너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니" — 엡 2:8'
                  : '"For by grace you have been saved through faith." — Eph 2:8'}
              </p>
            </div>

            {/* Description */}
            <p
              className="text-white/70 text-base leading-relaxed mb-10 max-w-lg transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: "480ms",
              }}
            >
              {t("home.heroSubtitle")}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4 transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: "580ms",
              }}
            >
              <Link
                href="/connect"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#C9973E] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#b8862e] transition-all duration-200 active:scale-[0.97]"
              >
                {t("home.planVisit")} <ArrowRight size={16} />
              </Link>
              <Link
                href="/sermons"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/40 text-white font-medium text-sm tracking-wide rounded-sm hover:bg-white/10 transition-all duration-200"
              >
                <Play size={14} /> {t("home.watchSermons")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE INFO BAR ── */}
      <section className="bg-[#17324D] -mt-8 relative z-10 py-10">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Clock, labelEn: "Sunday Worship", labelKo: "주일 예배", value: "1:30 PM" },
              { icon: MapPin, labelEn: "Location", labelKo: "위치", value: "2791 Driscoll Rd, Fremont CA" },
              { icon: Clock, labelEn: "Wednesday Prayer", labelKo: "수요 기도회", value: "8:00 PM" },
            ].map(({ icon: Icon, labelEn, labelKo, value }) => (
              <div key={labelEn} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#C9973E]/20 flex items-center justify-center">
                  <Icon size={18} className="text-[#C9973E]" />
                </div>
                <p className="text-white/50 text-xs tracking-widest uppercase">{lang === "ko" ? labelKo : labelEn}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WELCOME / ABOUT — Asymmetric ── */}
      <section className="py-28 bg-white">
        <div
          ref={storyFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: storyFade.visible ? 1 : 0, transform: storyFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.ourStory")}</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, lineHeight: 1.15 }}
              >
                {t("home.storyHeadline")}
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-4">{t("home.storyBody1")}</p>
              <p className="text-[#242A30]/70 leading-relaxed mb-8">{t("home.storyBody2")}</p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
              >
                {t("home.learnMore")}
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="lg:col-span-7 relative">
              <div className="aspect-[16/10] rounded-sm overflow-hidden shadow-2xl">
                <img src={COMMUNITY_IMG} alt="Graceway Community Worship" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-8 -left-4 lg:-left-8 bg-[#17324D] text-white p-5 rounded-sm shadow-xl max-w-[200px]">
                <div className="w-6 h-px bg-[#C9973E] mb-3" />
                <p className="text-white/75 text-xs italic leading-relaxed">
                  {lang === "ko" ? '"너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니"' : '"For by grace you have been saved through faith."'}
                </p>
                <p className="text-[#C9973E] text-xs font-semibold mt-2">{lang === "ko" ? "— 에베소서 2:8" : "— Ephesians 2:8"}</p>
              </div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-[#C9973E]/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT SERMONS ── */}
      <section className="py-24 bg-[#F4F6F7]">
        <div
          ref={sermonFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: sermonFade.visible ? 1 : 0, transform: sermonFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.messages")}</p>
              </div>
              <h2
                className="text-[#17324D]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
              >
                {t("home.recentSermons")}
              </h2>
            </div>
            <Link
              href="/sermons"
              className="hidden sm:inline-flex items-center gap-1 text-[#2F6F9F] text-sm font-medium hover:text-[#17324D] transition-colors"
            >
              {t("home.viewAll")} <ChevronRight size={14} />
            </Link>
          </div>

          {/* Featured + 2 smaller — asymmetric */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Featured */}
            <a
              href={`https://www.youtube.com/watch?v=${sermons[0].videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lg:col-span-3 bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer block"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${sermons[0].videoId}/maxresdefault.jpg`}
                  alt={sermons[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = SERMON_IMG; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17324D]/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#C9973E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-[#C9973E] text-xs font-medium mb-1">{sermons[0].scripture}</p>
                  <h3 className="text-white font-bold text-xl" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {lang === "ko" ? sermons[0].titleKo : sermons[0].title}
                  </h3>
                  <p className="text-white/60 text-xs mt-1">{sermons[0].speaker} · {sermons[0].date}</p>
                </div>
                <div className="absolute top-3 right-3 bg-[#17324D]/80 text-white text-xs px-2 py-1 rounded-sm">
                  {sermons[0].duration}
                </div>
              </div>
            </a>

            {/* Two smaller */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {sermons.slice(1).map((s, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/watch?v=${s.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer flex flex-col flex-1 block"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${s.videoId}/mqdefault.jpg`}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = SERMON_IMG; }}
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
                  <div className="p-4 flex-1">
                    <p className="text-[#C9973E] text-[10px] font-medium mb-1">{s.scripture}</p>
                    <h3 className="text-[#17324D] font-semibold text-sm group-hover:text-[#2F6F9F] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                      {lang === "ko" ? s.titleKo : s.title}
                    </h3>
                    <p className="text-[#242A30]/45 text-[11px] mt-1">{s.speaker} · {s.date}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MINISTRIES — Navy section ── */}
      <section
        className="py-28 bg-[#17324D] relative overflow-hidden"
        style={{ clipPath: "polygon(0 4%, 100% 0, 100% 96%, 0 100%)", marginTop: "-3rem", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C9973E]/40 to-transparent" />
        <div
          ref={ministriesFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: ministriesFade.visible ? 1 : 0, transform: ministriesFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("ministries.getInvolved")}</p>
              </div>
              <h2
                className="text-white mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {lang === "ko" ? "사역 &\n공동체" : "Ministries &\nCommunity"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-white/60 text-sm leading-relaxed mb-8">{t("home.ministriesDesc")}</p>
              <Link
                href="/ministries"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#C9973E] text-[#C9973E] text-sm font-semibold tracking-wide rounded-sm hover:bg-[#C9973E] hover:text-white transition-all duration-200"
              >
                {t("home.exploreAll")} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ministries.map((m, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-sm p-6 hover:bg-white/10 hover:border-[#C9973E]/40 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#C9973E]/20 flex items-center justify-center mb-4">
                    <m.icon size={16} className="text-[#C9973E]" />
                  </div>
                  <h3 className="text-white font-semibold mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {lang === "ko" ? m.titleKo : m.titleEn}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">{lang === "ko" ? m.descKo : m.descEn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KIDS / FAMILIES ── */}
      <section className="py-28 bg-white" style={{ marginTop: "-2rem" }}>
        <div
          ref={kidsFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: kidsFade.visible ? 1 : 0, transform: kidsFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden shadow-xl">
                <img src={KIDS_IMG} alt="Children's Ministry" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-5 -right-5 bg-[#C9973E] text-white p-4 rounded-sm shadow-lg">
                <p className="text-2xl font-bold" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {lang === "ko" ? "어린이" : "Kids"}
                </p>
                <p className="text-xs tracking-wider uppercase">{lang === "ko" ? "사역" : "Ministry"}</p>
              </div>
              <div className="absolute -bottom-3 -left-3 w-16 h-16 border-b-2 border-l-2 border-[#17324D]/20" />
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.familiesWelcome")}</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {t("home.kidsTitle")}
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-8">{t("home.kidsBody")}</p>
              <Link
                href="/ministries"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
              >
                {t("home.learnKids")} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section className="py-24 bg-[#F4F6F7]">
        <div
          ref={eventsFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: eventsFade.visible ? 1 : 0, transform: eventsFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.calendar")}</p>
              </div>
              <h2
                className="text-[#17324D]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
              >
                {t("home.upcomingEvents")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((e, i) => (
              <div
                key={i}
                className="bg-white rounded-sm p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer border-l-2 border-transparent hover:border-[#C9973E]"
              >
                <div className="text-center min-w-[52px]">
                  <div className="text-[#C9973E] text-xs font-bold tracking-wide uppercase">
                    {e.date.split(" ")[0]}
                  </div>
                  <div
                    className="text-[#17324D] text-2xl font-bold leading-none"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {e.date.split(" ")[1]}
                  </div>
                </div>
                <div className="h-10 w-px bg-[#C9973E]/30" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 bg-[#17324D]/10 text-[#17324D] rounded-sm font-medium tracking-wide">
                      {e.tag}
                    </span>
                  </div>
                  <p
                    className="text-[#17324D] font-semibold group-hover:text-[#2F6F9F] transition-colors"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {lang === "ko" ? e.titleKo : e.titleEn}
                  </p>
                  <p className="text-[#242A30]/50 text-xs flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {e.time}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#242A30]/30 group-hover:text-[#C9973E] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-20 bg-[#17324D] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C9973E] blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#2F6F9F] blur-3xl" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9973E]/40 to-transparent" />
        <div
          ref={newsletterFade.ref}
          className="relative container transition-all duration-700 ease-out"
          style={{ opacity: newsletterFade.visible ? 1 : 0, transform: newsletterFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Stay Connected</p>
              </div>
              <h2
                className="text-white mb-4"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
              >
                {t("home.newsletter")}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">{t("home.newsletterDesc")}</p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={t("home.emailPlaceholder")}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm rounded-sm focus:outline-none focus:border-[#C9973E] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#C9973E] text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-[#b8862e] transition-colors active:scale-[0.97] whitespace-nowrap"
                >
                  {t("home.signUp")}
                </button>
              </form>
              <p className="text-white/30 text-xs mt-3">{t("home.privacyNote")}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

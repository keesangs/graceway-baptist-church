/**
 * Home Page — Graceway Baptist Church
 * Design: Modern Reverence — asymmetric editorial, diagonal section cuts,
 * gold rule motifs, scripture blockquotes, warm community photography
 * Features: fade-in hero animation, KO/EN language toggle via useLang
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Clock, MapPin, ArrowRight, Play, ChevronRight, Heart, BookOpen, Users, Music, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandAbstractVisual } from "@/components/BrandAbstractVisual";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { brandVisualAssets } from "@/lib/brandVisualAssets";

const HERO_BG = brandVisualAssets.homeHero;
const HERO_VIDEO = "/manus-storage/hero_river_web_95c0082f.mp4";
const HERO_VIDEO_POSTER = "/manus-storage/hero_river_poster_53c7cd5e.jpg";
const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";

const SECTION_HEADING_STYLE = {
  fontFamily: "'Source Serif 4', serif",
  fontSize: "clamp(1.65rem, 2.5vw, 2.1rem)",
  fontWeight: 700,
  lineHeight: 1.16,
};

const STORY_HEADING_STYLE = {
  ...SECTION_HEADING_STYLE,
  fontSize: "clamp(1.65rem, 2.5vw, 2.1rem)",
  lineHeight: 1.2,
};

// Real sermon videos from YouTube @keesangs channel — titles & scripture supplied by church
const sermons = [
  {
    title: "Filled with the Holy Spirit",
    titleKo: "성령으로 채우시다",
    scripture: "사도행전 2:22–36",
    scriptureEn: "Acts 2:22–36",
    date: "August 16, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "New",
    videoId: "8NchEyAy3jE",
  },
  {
    title: "What It Means to Follow God",
    titleKo: "하나님을 따라간다는 것",
    scripture: "사도행전 1:12–26",
    scriptureEn: "Acts 1:12–26",
    date: "August 2, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "41 min",
    videoId: "jStg7ksuSdM",
  },
  {
    title: "A New Era Begins with Small Obedience",
    titleKo: "작은 순종에서 시작되는 새로운 시대",
    scripture: "사도행전 1:1–8",
    scriptureEn: "Acts 1:1–8",
    date: "July 26, 2026",
    speaker: "Pastor Hunsuk Lee",
    duration: "40 min",
    videoId: "AGzMGv7vuhQ",
  },
];

const events = [
  { date: "Aug 10", titleEn: "Sunday Worship Service", titleKo: "주일 예배", time: "1:30 PM", tag: "Weekly" },
  { date: "Aug 13", titleEn: "Wednesday Prayer Meeting", titleKo: "수요 기도회", time: "8:00 PM", tag: "Weekly" },
  { date: "Aug 17", titleEn: "Sunday Worship", titleKo: "주일 예배", time: "1:30 PM", tag: "Weekly" },
  { date: "Aug 20", titleEn: "Wednesday Prayer Meeting", titleKo: "수요 기도회", time: "8:00 PM", tag: "Weekly" },
];

// Fade-in hook using IntersectionObserver
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
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
  const ko = lang === "ko";
  const [heroVisible, setHeroVisible] = useState(false);

  // Newsletter signup — persists to the newsletter_subscribers table.
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubscribed(true);
      setEmail("");
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    subscribeMutation.mutate({ email: trimmed, lang });
  };

  // Hero fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const storyFade = useFadeIn();
  const serviceFade = useFadeIn();
  const missionFade = useFadeIn();
  const sermonFade = useFadeIn();
  const ministriesFade = useFadeIn();
  const welcomeFade = useFadeIn();
  const eventsFade = useFadeIn();
  const newsletterFade = useFadeIn();

  const ministries = [
    { icon: BookOpen, titleEn: "Bible Study", titleKo: "성경 공부", descEn: "Sunday afternoon (TBA) — read and share the Word together.", descKo: "주일오후(추후 공지) — 함께 말씀을 읽고 나눕니다." },
    { icon: Users, titleEn: "Small Groups", titleKo: "소그룹", descEn: "Connect in community through weekly life groups.", descKo: "주간 소그룹을 통해 공동체와 연결됩니다." },
    { icon: Heart, titleEn: "Outreach", titleKo: "지역 사역", descEn: "Serving our city with grace and compassion.", descKo: "은혜와 사랑으로 우리 도시를 섬깁니다." },
    { icon: Music, titleEn: "Worship Team", titleKo: "찬양사역팀", descEn: "Join us in leading the congregation in praise.", descKo: "회중을 찬양으로 인도하는 팀에 함께하세요." },
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 0 100%)" }}
      >
        {/* Static poster image — instant load, shown while video loads */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />

        {/* 은혜의 강물 — slow, muted, looping river video. pointer-events-none so CTAs stay clickable */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={HERO_VIDEO_POSTER}
          aria-hidden="true"
          style={{ opacity: 0.5 }}
        />

        {/* Navy overlay stack — text side stays dark and crisp, right side lets the water breathe */}
        <div className="absolute inset-0 bg-[#163B59]/38" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#163B59]/96 via-[#163B59]/66 to-[#163B59]/14" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#163B59]/76 via-transparent to-transparent" />

        {/* Vertical gold accent line */}
        <div
          className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-transparent via-[#B9955E] to-transparent transition-opacity duration-1000"
          style={{ opacity: heroVisible ? 0.6 : 0 }}
        />

        {/* Official Graceway mark — a prominent, centered background motif that may cross the title zone while remaining behind readable content. */}
        <div
          className="pointer-events-none absolute z-0 right-[35%] top-1/2 hidden select-none transition-all duration-[1600ms] ease-out xl:right-[44%] lg:block"
          style={{
            opacity: heroVisible ? 0.13 : 0,
            transform: heroVisible ? "translateY(-50%) scale(1)" : "translateY(-45%) scale(0.96)",
            transitionDelay: "500ms",
            width: "clamp(16rem, 24vw, 28rem)",
            height: "clamp(18rem, 27vw, 31rem)",
          }}
        >
          <img
            src="/manus-storage/graceway-logo-icon_344928c5.png"
            alt=""
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
        </div>

        <div className="relative z-10 container pt-24 pb-32">
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
              <div className="h-px w-8 bg-[#B9955E]" />
              <p className="text-[#D9B87A] text-xs tracking-[0.3em] uppercase font-semibold">
                {t("home.welcomeTo")}
              </p>
            </div>

            {/* Main title */}
            <h1
              className="text-white mb-6 transition-all duration-700 ease-out"
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 'clamp(2rem, 10vw, 64px)',
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
                  <span className="text-[#D9B87A]">{t("home.heroTitle2")}</span>
                </>
              ) : (
                <>
                  {t("home.heroTitle1")}<br />
                  <span className="text-[#D9B87A]">Baptist</span> Church
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
              {lang === "ko" ? "그레이스웨이 침례교회" : "Graceway Baptist Church"}
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
              <div className="h-px w-12 bg-[#B9955E]/60" />
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
                className="inline-flex items-center gap-2 rounded-sm bg-[#B9955E] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#0B2C43] transition-all duration-200 hover:bg-[#C8A977] active:scale-[0.97]"
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
      <section className="relative z-10 -mt-8 bg-[#163B59] py-10">
        <div
          ref={serviceFade.ref}
          className="container transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ opacity: serviceFade.visible ? 1 : 0, transform: serviceFade.visible ? "translateY(0)" : "translateY(24px)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Clock, labelEn: "Sunday Worship", labelKo: "주일 예배", value: "1:30 PM" },
              { icon: MapPin, labelEn: "Location", labelKo: "교회 주소", value: "2791 Driscoll Rd, Fremont CA" },
              { icon: Clock, labelEn: "Wednesday Prayer Meeting", labelKo: "수요 기도회", value: "8:00 PM" },
            ].map(({ icon: Icon, labelEn, labelKo, value }) => (
              <div key={labelEn} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B9955E]/20">
                  <Icon size={18} className="text-[#D9B87A]" />
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
            <div className="lg:col-span-5 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.ourStory")}</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={STORY_HEADING_STYLE}
              >
                {lang === "ko" ? <><span className="lg:whitespace-nowrap">은혜는 목적지가 아닙니다 —</span><br />그것이 바로 길입니다.</> : t("home.storyHeadline")}
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
                <BrandAbstractVisual kind="path" imageSrc={brandVisualAssets.homeStory} />
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

      {/* ── MISSION, VISION & VALUES — Editorial ── */}
      <section className="relative overflow-hidden bg-[#F4F6F7] py-24 lg:py-32">
        <div className="pointer-events-none absolute -top-32 -right-28 h-[28rem] w-[28rem] rounded-full border border-[#C9973E]/15" />
        <div className="pointer-events-none absolute -top-16 -right-12 h-[19rem] w-[19rem] rounded-full border border-[#C9973E]/10" />

        <div
          ref={missionFade.ref}
          className="container relative transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ opacity: missionFade.visible ? 1 : 0, transform: missionFade.visible ? "translateY(0)" : "translateY(24px)" }}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#C9973E]" />
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9973E]">
                  {lang === "ko" ? "우리가 지향하는 길" : "What guides us"}
                </p>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[#242A30]/60">
                {lang === "ko"
                  ? "말씀과 예배, 그리고 세상을 향한 사랑으로 오늘을 살아갑니다."
                  : "We live today through the Word, worship, and love for the world."}
              </p>
            </div>

            <div className="lg:col-span-8 lg:border-l lg:border-[#17324D]/15 lg:pl-16">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#2F6F9F]">01 / {t("home.mission")}</p>
              <h2
                className="max-w-4xl text-[#17324D]"
                style={SECTION_HEADING_STYLE}
              >
                {lang === "ko" ? (
                  <>
                    말씀으로 세워지고,<br />
                    삶으로 예배하며,<br />
                    세상으로 보냄 받는 공동체
                  </>
                ) : (
                  <>
                    Built on the Word,<br />
                    Worshiping through our lives,<br />
                    Sent into the world
                  </>
                )}
              </h2>
              <div className="mt-8 max-w-4xl border-t border-[#17324D]/15 pt-7">
                <p className="text-base leading-8 text-[#242A30]/72 md:text-lg">
                  {t("home.missionDesc")}
                </p>
                <div className="mt-6 border-l-2 border-[#C9973E] pl-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#C9973E]">Romans 12:1</p>
                  <p className="mt-2 text-sm italic leading-relaxed text-[#17324D]/70">
                    {lang === "ko" ? "삶으로 드리는 영적 예배" : "A living, spiritual act of worship"}
                  </p>
                  <blockquote className="mt-3 max-w-3xl text-xs leading-5 text-[#17324D]/65">
                    {lang === "ko"
                      ? "“그러므로 형제들아 내가 하나님의 모든 자비하심으로 너희를 권하노니 너희 몸을 하나님이 기뻐하시는 거룩한 산 제물로 드리라 이는 너희가 드릴 영적 예배니라.”"
                      : "“Therefore, in view of God’s mercies, offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.”"}
                  </blockquote>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 overflow-hidden border border-[#17324D]/10 bg-white shadow-[0_22px_55px_rgba(23,50,77,0.08)] lg:grid-cols-12">
            <div className="relative overflow-hidden bg-[#17324D] px-8 py-10 text-white sm:px-10 lg:col-span-5 lg:px-12 lg:py-14">
              <div className="absolute -right-7 -top-14 select-none text-[14rem] leading-none text-[#C9973E]/10" style={{ fontFamily: "'Source Serif 4', serif" }}>G</div>
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9973E]">02 / {t("home.vision")}</p>
                <h3 className="mt-5 max-w-md whitespace-pre-line" style={SECTION_HEADING_STYLE}>
                  {t("home.visionStatement")}
                </h3>
                <span className="mt-8 block h-px w-12 bg-[#C9973E]" />
              </div>
            </div>

            <div className="px-8 py-10 sm:px-10 lg:col-span-7 lg:px-12 lg:py-14">
              <div className="flex items-end justify-between gap-5 border-b border-[#17324D]/10 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2F6F9F]">03 / {t("home.coreValues")}</p>
                  <p className="mt-2 text-sm text-[#242A30]/60">
                    {lang === "ko" ? "우리의 선택과 사역을 이끄는 일곱 가지 약속" : "Seven commitments that shape our life and ministry"}
                  </p>
                </div>
                <span className="hidden text-4xl leading-none text-[#C9973E]/50 sm:block" style={{ fontFamily: "'Source Serif 4', serif" }}>07</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2">
                {[
                  "home.value1",
                  "home.value2",
                  "home.value3",
                  "home.value4",
                  "home.value5",
                  "home.value6",
                  "home.value7",
                ].map((key, idx) => (
                  <div
                    key={key}
                    className="group flex items-center gap-4 border-b border-[#17324D]/10 py-4 transition-colors hover:bg-[#F4F6F7] sm:px-3"
                  >
                    <span className="w-6 text-xs font-semibold tracking-wider text-[#C9973E]">{String(idx + 1).padStart(2, "0")}</span>
                    <p className="text-sm font-semibold text-[#17324D] transition-colors group-hover:text-[#2F6F9F]">{t(key)}</p>
                  </div>
                ))}
              </div>
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
          {/* Two-column: left = featured video (unchanged), right = list + quote */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── LEFT: Featured video — unchanged from original ── */}
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
                  <p className="text-[#C9973E] text-xs font-medium mb-1">{lang === "ko" ? sermons[0].scripture : sermons[0].scriptureEn}</p>
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

            {/* ── RIGHT: header + list rows + scripture quote ── */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-[#17324D] font-bold"
                  style={SECTION_HEADING_STYLE}
                >
                  {lang === "ko" ? "최근 설교" : "Recent Sermons"}
                </h2>
                <Link
                  href="/sermons"
                  className="text-[#2F6F9F] text-xs font-medium hover:text-[#17324D] transition-colors flex items-center gap-0.5"
                >
                  {t("home.viewAll")} <ChevronRight size={12} />
                </Link>
              </div>

              {/* Sermon list rows — all 3 sermons */}
              <div className="flex flex-col divide-y divide-[#E8ECF0] mb-5">
                {sermons.map((s, i) => (
                  <a
                    key={i}
                    href={`https://www.youtube.com/watch?v=${s.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-4 group cursor-pointer hover:bg-[#F0F4F7] -mx-2 px-2 rounded-md transition-colors duration-150"
                  >
                    {/* Play icon circle */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#D1D9E0] group-hover:border-[#C9973E] flex items-center justify-center transition-colors duration-150">
                      <Play size={11} className="text-[#17324D] group-hover:text-[#C9973E] ml-0.5 transition-colors duration-150" fill="currentColor" />
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[#17324D] font-semibold text-sm leading-snug group-hover:text-[#2F6F9F] transition-colors duration-150"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {lang === "ko" ? s.titleKo : s.title}
                      </p>
                      <p className="text-[#C9973E] text-xs mt-0.5">{lang === "ko" ? s.scripture : s.scriptureEn}</p>
                      <p className="text-[#242A30]/50 text-[11px] mt-0.5">{s.date}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Scripture quote block */}
              <div className="border-l-4 border-[#C9973E] pl-4 py-3 bg-[#FBF8F3] rounded-r-lg">
                <p className="text-[#242A30]/75 text-sm italic leading-relaxed">
                  {lang === "ko"
                    ? "\"믿음은 들음에서 나며 들음은 그리스도의 말씀으로 말미암았느니라\""
                    : "\"So faith comes from hearing, and hearing through the word of Christ.\""}
                </p>
                <p className="text-[#C9973E] text-xs font-semibold mt-2">
                  {lang === "ko" ? "— 로마서 10:17" : "— Romans 10:17"}
                </p>
              </div>
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
                style={SECTION_HEADING_STYLE}
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

      {/* ── WELCOME HOME ── */}
      <section className="py-28 bg-white" style={{ marginTop: "-2rem" }}>
        <div
          ref={welcomeFade.ref}
          className="container transition-all duration-700 ease-out"
          style={{ opacity: welcomeFade.visible ? 1 : 0, transform: welcomeFade.visible ? "translateY(0)" : "translateY(32px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden shadow-xl">
                <BrandAbstractVisual kind="welcome" imageSrc={brandVisualAssets.homeStory} />
              </div>
              <div className="absolute -top-5 -right-5 bg-[#C9973E] text-white p-4 rounded-sm shadow-lg">
                <p className="text-2xl font-bold" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {lang === "ko" ? "함께" : "Welcome"}
                </p>
                <p className="text-xs tracking-wider uppercase">{lang === "ko" ? "예배" : "Home"}</p>
              </div>
              <div className="absolute -bottom-3 -left-3 w-16 h-16 border-b-2 border-l-2 border-[#17324D]/20" />
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 max-w-md text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{t("home.welcomeLabel")}</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={SECTION_HEADING_STYLE}
              >
                {t("home.welcomeTitle")}
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-8">{t("home.welcomeBody")}</p>
              <Link
                href="/ministries"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
              >
                {t("home.welcomeCta")} <ArrowRight size={15} />
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
                style={SECTION_HEADING_STYLE}
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
                style={SECTION_HEADING_STYLE}
              >
                {t("home.newsletter")}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">{t("home.newsletterDesc")}</p>
            </div>
            <div>
              {subscribed ? (
                <div className="flex items-start gap-3 px-4 py-4 bg-[#C9973E]/15 border border-[#C9973E]/40 rounded-sm">
                  <Check size={18} className="text-[#C9973E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {ko ? "구독 승인되었습니다" : "You're subscribed"}
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      {ko
                        ? "매주 새로운 소식을 이메일로 보내드립니다."
                        : "We'll send weekly reflections and announcements to your inbox."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleNewsletterSubmit}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={subscribeMutation.isPending}
                      placeholder={t("home.emailPlaceholder")}
                      aria-label={t("home.emailPlaceholder")}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm rounded-sm focus:outline-none focus:border-[#C9973E] transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={subscribeMutation.isPending}
                      className="px-6 py-3 bg-[#C9973E] text-[#0B2C43] text-sm font-semibold tracking-wide rounded-sm hover:bg-[#b8862e] transition-colors active:scale-[0.97] whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      {subscribeMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                      {t("home.signUp")}
                    </button>
                  </form>
                  {subscribeMutation.isError && (
                    <p className="text-red-300 text-xs mt-3">
                      {ko
                        ? "구독 실패. 이메일 주소를 확인하고 다시 시도해 주세요."
                        : "Signup failed. Please check the address and try again."}
                    </p>
                  )}
                  <p className="text-white/30 text-xs mt-3">{t("home.privacyNote")}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

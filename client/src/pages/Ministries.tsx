/**
 * Ministries Page — Graceway Baptist Church
 * Design: Modern Reverence — featured ministry hero + alternating asymmetric rows
 * No uniform card grid; editorial storytelling approach
 */
import { Link } from "wouter";
import { ArrowRight, BookOpen, Users, Heart, Music, GraduationCap, Zap, Globe, Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandAbstractVisual, type BrandAbstractVisualKind } from "@/components/BrandAbstractVisual";
import { BrandPageHero } from "@/components/BrandPageHero";
import { useLang } from "@/contexts/LanguageContext";
import { brandVisualAssets } from "@/lib/brandVisualAssets";

const featuredMinistry = {
  icon: BookOpen,
  visual: "word" as BrandAbstractVisualKind,
  en: {
    title: "Bible Study",
    subtitle: "Wednesday Evenings · 7:00 PM",
    quote: "Your word is a lamp to my feet and a light to my path.",
    quoteRef: "— Psalm 119:105",
    desc: "Join us every Wednesday evening for an in-depth exploration of Scripture. Our Bible study groups are designed for all levels — whether you're new to the Bible or have been studying for years, you'll find a place to grow in God's Word together.",
  },
  ko: {
    title: "말씀 나눔",
    subtitle: "매주 수요일 · 오후 7:00",
    quote: "주의 말씀은 내 발에 등이요 내 길에 빛이니이다.",
    quoteRef: "— 시편 119:105",
    desc: "매주 수요일 저녁, 성경 말씀을 깊이 나누며 함께 배우는 시간입니다. 성경이 처음이신 분부터 오랫동안 말씀을 묵상해 오신 분까지, 누구나 하나님의 말씀 안에서 함께 자라갈 수 있습니다.",
  },
};

const ministryRows = [
  {
    icon: Users,
    visual: "community" as BrandAbstractVisualKind,
    reverse: false,
    color: "#2F6F9F",
    en: { title: "Small Groups", subtitle: "Various Days & Locations", desc: "Life is better in community. Our small groups meet throughout the week in homes across the city, providing a space for deeper connection, prayer, and mutual encouragement in everyday life." },
    ko: { title: "소그룹", subtitle: "요일·장소별 모임", desc: "삶은 함께할 때 더욱 풍성해집니다. 도시 곳곳의 가정에서 주중에 모이는 소그룹은 더 깊이 연결되고, 함께 기도하며, 일상 속에서 서로를 격려하는 자리입니다." },
  },
  {
    icon: GraduationCap,
    visual: "campus" as BrandAbstractVisualKind,
    reverse: true,
    color: "#C9973E",
    en: { title: "College Campus Ministry", subtitle: "Weekdays · Nearby College Campuses", desc: "We are passionate about reaching the next generation on campus. Our college ministry connects with students at nearby universities and community colleges throughout the week — building friendships, studying Scripture, and living out the gospel together in the places where students spend their days." },
    ko: { title: "대학 캠퍼스 사역", subtitle: "평일 · 인근 대학 캠퍼스", desc: "다음 세대를 향한 마음으로 인근 대학과 커뮤니티 칼리지의 학생들을 찾아갑니다. 캠퍼스에서 우정을 나누고, 함께 말씀을 배우며, 학생들의 일상 속에서 복음을 살아 내도록 서로를 격려합니다." },
  },
  {
    icon: Zap,
    visual: "youth" as BrandAbstractVisualKind,
    reverse: false,
    color: "#17324D",
    en: { title: "Youth Ministry", subtitle: "Fridays · 6:30 PM", desc: "Our youth ministry is a place where middle and high school students can belong, grow, and be challenged to live out their faith. Friday nights are filled with worship, teaching, and authentic community." },
    ko: { title: "청소년 사역", subtitle: "금요일 · 오후 6:30", desc: "중·고등학생들이 환영받고, 믿음 안에서 자라며, 자신의 삶으로 신앙을 살아 내도록 격려받는 자리입니다. 금요일 저녁에는 찬양과 말씀, 진솔한 교제를 나눕니다." },
  },
];

const smallMinistries = [
  { icon: Heart, en: { title: "Outreach & Service", subtitle: "Monthly Events", desc: "We are called to serve our city. Through food drives, neighborhood clean-ups, and partnerships with local nonprofits, we put our faith into action." }, ko: { title: "이웃 섬김과 봉사", subtitle: "매월 진행", desc: "우리가 살아가는 도시를 섬기도록 부름받았습니다. 푸드 드라이브, 지역 환경 정비, 지역 비영리단체와의 협력을 통해 믿음을 삶으로 실천합니다." } },
  { icon: Music, en: { title: "Worship Team", subtitle: "Rehearsals: Saturdays", desc: "Our worship team leads the congregation in praise each Sunday. We're always looking for musicians, vocalists, and sound technicians." }, ko: { title: "찬양팀", subtitle: "토요일 리허설", desc: "찬양팀은 매 주일 성도들이 함께 하나님을 찬양하도록 섬깁니다. 악기 연주자, 보컬, 음향으로 함께 섬기실 분들을 기다립니다." } },
  { icon: Globe, en: { title: "Missions", subtitle: "Global & Local", desc: "We support missionaries locally and globally, and send short-term teams to serve communities around the world." }, ko: { title: "선교", subtitle: "국내외", desc: "지역과 세계 곳곳의 선교사님들을 후원하고, 필요한 곳을 섬기는 단기 선교팀을 보냅니다." } },
  { icon: Coffee, en: { title: "Welcome Team", subtitle: "Sundays · All Services", desc: "Our welcome team creates a warm, inviting atmosphere for every person who walks through our doors — from regulars to first-time visitors." }, ko: { title: "환영팀", subtitle: "주일 · 모든 예배", desc: "처음 오신 분부터 오래 함께한 성도님까지, 모든 분이 따뜻하게 환영받도록 섬기는 팀입니다." } },
];

export default function Ministries() {
  const { lang } = useLang();
  const copy = lang === "ko"
    ? {
        eyebrow: "함께하는 사역", heroTitle: "사역", heroDescription: "그레이스웨이에는 누구나 함께할 자리가 있습니다. 은사와 부르심에 맞는 사역을 찾아보세요.", featured: "주요 사역", featuredCta: "말씀 나눔 참여하기", rowCta: "함께 참여하기", moreWays: "더 함께할 수 있는 사역", ctaEyebrow: "사역에 함께하기", ctaTitle: "우리 공동체 안에서 당신의 자리를 찾아보세요", ctaDescription: "섬기고, 성장하고, 연결되기를 원하신다면 그레이스웨이에서 함께할 자리를 찾아보세요.", ctaButton: "함께하기",
      }
    : {
        eyebrow: "Get Involved", heroTitle: "Ministries", heroDescription: "There’s a place for everyone at Graceway. Find where you belong and how you can serve.", featured: "Featured Ministry", featuredCta: "Join Bible Study", rowCta: "Get Involved", moreWays: "More Ways to Serve", ctaEyebrow: "Ready to Serve?", ctaTitle: "Find Your Place in Our Community", ctaDescription: "Whether you're looking to serve, grow, or simply connect — we'd love to help you find your place at Graceway.", ctaButton: "Get Connected",
      };
  const featuredCopy = featuredMinistry[lang];

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      <BrandPageHero
        eyebrow={copy.eyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
        visual="sending"
        imageSrc={brandVisualAssets.ministry.sending}
      />

      {/* Featured Ministry — Full-width editorial */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative min-h-[400px] overflow-hidden">
            <BrandAbstractVisual kind={featuredMinistry.visual} imageSrc={brandVisualAssets.ministry[featuredMinistry.visual]} className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17324D]/80 to-[#17324D]/30" />
            <div className="relative p-12 flex flex-col justify-end h-full min-h-[400px]">
              <div className="w-8 h-0.5 bg-[#C9973E] mb-4" />
              <p className="text-white/60 text-xs tracking-widest uppercase mb-2">{copy.featured}</p>
              <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                {featuredCopy.title}
              </h2>
              <p className="text-[#C9973E] text-xs tracking-wide">{featuredCopy.subtitle}</p>
            </div>
          </div>
          <div className="bg-white p-12 lg:p-16 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#17324D]/10 flex items-center justify-center">
                <featuredMinistry.icon size={18} className="text-[#17324D]" />
              </div>
            </div>
            <blockquote className="border-l-2 border-[#C9973E] pl-5 mb-6">
              <p className="text-[#17324D] italic text-base leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif" }}>
                "{featuredCopy.quote}"
              </p>
              <p className="text-[#C9973E] text-xs font-semibold mt-2">{featuredCopy.quoteRef}</p>
            </blockquote>
            <p className="text-[#242A30]/65 text-sm leading-relaxed mb-8">{featuredCopy.desc}</p>
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
            >
              {copy.featuredCta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Alternating ministry rows */}
      {ministryRows.map((m, i) => (
        <section key={i} className={`py-20 ${i % 2 === 0 ? "bg-[#F4F6F7]" : "bg-white"}`}>
          <div className="container">
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${m.reverse ? "lg:flex-row-reverse" : ""}`}>
              <div className={`lg:col-span-6 ${m.reverse ? "lg:order-2" : "lg:order-1"}`}>
                <div className="relative aspect-[4/3] rounded-sm overflow-hidden shadow-xl group">
                  <BrandAbstractVisual kind={m.visual} imageSrc={brandVisualAssets.ministry[m.visual]} className="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17324D]/40 to-transparent" />
                </div>
              </div>
              <div className={`lg:col-span-6 ${m.reverse ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color + "20" }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                  <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: m.color }}>
                    {m[lang].subtitle}
                  </span>
                </div>
                <h2
                  className="text-[#17324D] mb-4"
                  style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
                >
                  {m[lang].title}
                </h2>
                <div className="w-10 h-0.5 mb-5" style={{ backgroundColor: m.color }} />
                <p className="text-[#242A30]/65 text-sm leading-relaxed mb-6">{m[lang].desc}</p>
                <Link
                  href="/connect"
                  className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
                >
                  {copy.rowCta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Smaller ministries — 2x2 grid with gold accent */}
      <section className="py-20 bg-[#17324D]">
        <div className="container">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px w-8 bg-[#C9973E]" />
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{copy.moreWays}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {smallMinistries.map((m, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-sm p-6 hover:bg-white/10 hover:border-[#C9973E]/40 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[#C9973E]/20 flex items-center justify-center mb-4">
                  <m.icon size={16} className="text-[#C9973E]" />
                </div>
                <h3 className="text-white font-semibold mb-1" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {m[lang].title}
                </h3>
                <p className="text-[#C9973E] text-[10px] tracking-wide uppercase mb-3">{m[lang].subtitle}</p>
                <div className="w-6 h-px bg-[#C9973E]/40 mb-3" />
                <p className="text-white/55 text-sm leading-relaxed">{m[lang].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <div className="container max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#C9973E]" />
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">{copy.ctaEyebrow}</p>
            <div className="h-px w-8 bg-[#C9973E]" />
          </div>
          <h2
            className="text-[#17324D] mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
          >
            {copy.ctaTitle}
          </h2>
          <p className="text-[#242A30]/60 mb-8 text-sm leading-relaxed">
            {copy.ctaDescription}
          </p>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
          >
            {copy.ctaButton} <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

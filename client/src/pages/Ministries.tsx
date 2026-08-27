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

const featuredMinistry = {
  icon: BookOpen,
  title: "Bible Study",
  subtitle: "Wednesday Evenings · 7:00 PM",
  quote: "Your word is a lamp to my feet and a light to my path.",
  quoteRef: "— Psalm 119:105",
  desc: "Join us every Wednesday evening for an in-depth exploration of Scripture. Our Bible study groups are designed for all levels — whether you're new to the Bible or have been studying for years, you'll find a place to grow in God's Word together.",
  visual: "word" as BrandAbstractVisualKind,
};

const ministryRows = [
  {
    icon: Users,
    title: "Small Groups",
    subtitle: "Various Days & Locations",
    desc: "Life is better in community. Our small groups meet throughout the week in homes across the city, providing a space for deeper connection, prayer, and mutual encouragement in everyday life.",
    visual: "community" as BrandAbstractVisualKind,
    reverse: false,
    color: "#2F6F9F",
  },
  {
    icon: GraduationCap,
    title: "College Campus Ministry",
    subtitle: "Weekdays · Nearby College Campuses",
    desc: "We are passionate about reaching the next generation on campus. Our college ministry connects with students at nearby universities and community colleges throughout the week — building friendships, studying Scripture, and living out the gospel together in the places where students spend their days.",
    visual: "sending" as BrandAbstractVisualKind,
    reverse: true,
    color: "#C9973E",
  },
  {
    icon: Zap,
    title: "Youth Ministry",
    subtitle: "Fridays · 6:30 PM",
    desc: "Our youth ministry is a place where middle and high school students can belong, grow, and be challenged to live out their faith. Friday nights are filled with worship, teaching, and authentic community.",
    visual: "youth" as BrandAbstractVisualKind,
    reverse: false,
    color: "#17324D",
  },
];

const smallMinistries = [
  { icon: Heart, title: "Outreach & Service", subtitle: "Monthly Events", desc: "We are called to serve our city. Through food drives, neighborhood clean-ups, and partnerships with local nonprofits, we put our faith into action." },
  { icon: Music, title: "Worship Team", subtitle: "Rehearsals: Saturdays", desc: "Our worship team leads the congregation in praise each Sunday. We're always looking for musicians, vocalists, and sound technicians." },
  { icon: Globe, title: "Missions", subtitle: "Global & Local", desc: "We support missionaries locally and globally, and send short-term teams to serve communities around the world." },
  { icon: Coffee, title: "Welcome Team", subtitle: "Sundays · All Services", desc: "Our welcome team creates a warm, inviting atmosphere for every person who walks through our doors — from regulars to first-time visitors." },
];

export default function Ministries() {
  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      <BrandPageHero
        eyebrow="Get Involved"
        title="Ministries"
        description="There’s a place for everyone at Graceway. Find where you belong and how you can serve."
        visual="sending"
      />

      {/* Featured Ministry — Full-width editorial */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative min-h-[400px] overflow-hidden">
            <BrandAbstractVisual kind={featuredMinistry.visual} className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17324D]/80 to-[#17324D]/30" />
            <div className="relative p-12 flex flex-col justify-end h-full min-h-[400px]">
              <div className="w-8 h-0.5 bg-[#C9973E] mb-4" />
              <p className="text-white/60 text-xs tracking-widest uppercase mb-2">Featured Ministry</p>
              <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                {featuredMinistry.title}
              </h2>
              <p className="text-[#C9973E] text-xs tracking-wide">{featuredMinistry.subtitle}</p>
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
                "{featuredMinistry.quote}"
              </p>
              <p className="text-[#C9973E] text-xs font-semibold mt-2">{featuredMinistry.quoteRef}</p>
            </blockquote>
            <p className="text-[#242A30]/65 text-sm leading-relaxed mb-8">{featuredMinistry.desc}</p>
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
            >
              Join Bible Study <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                  <BrandAbstractVisual kind={m.visual} className="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17324D]/40 to-transparent" />
                </div>
              </div>
              <div className={`lg:col-span-6 ${m.reverse ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color + "20" }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                  <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: m.color }}>
                    {m.subtitle}
                  </span>
                </div>
                <h2
                  className="text-[#17324D] mb-4"
                  style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
                >
                  {m.title}
                </h2>
                <div className="w-10 h-0.5 mb-5" style={{ backgroundColor: m.color }} />
                <p className="text-[#242A30]/65 text-sm leading-relaxed mb-6">{m.desc}</p>
                <Link
                  href="/connect"
                  className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
                >
                  Get Involved <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">More Ways to Serve</p>
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
                  {m.title}
                </h3>
                <p className="text-[#C9973E] text-[10px] tracking-wide uppercase mb-3">{m.subtitle}</p>
                <div className="w-6 h-px bg-[#C9973E]/40 mb-3" />
                <p className="text-white/55 text-sm leading-relaxed">{m.desc}</p>
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
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Ready to Serve?</p>
            <div className="h-px w-8 bg-[#C9973E]" />
          </div>
          <h2
            className="text-[#17324D] mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
          >
            Find Your Place in Our Community
          </h2>
          <p className="text-[#242A30]/60 mb-8 text-sm leading-relaxed">
            Whether you're looking to serve, grow, or simply connect — we'd love to help you find your place at Graceway.
          </p>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
          >
            Get Connected <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

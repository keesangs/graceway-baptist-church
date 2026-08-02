/**
 * Home Page — Graceway Baptist Church
 * Design: Modern Reverence — asymmetric editorial, diagonal section cuts,
 * gold rule motifs, scripture blockquotes, warm community photography
 */
import { Link } from "wouter";
import { Clock, MapPin, ArrowRight, Play, ChevronRight, Heart, BookOpen, Users, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HERO_BG = "/manus-storage/hero_bg_67c2aa9c.jpg";
const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";
const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const KIDS_IMG = "/manus-storage/kids_ministry_a46a1f45.jpg";

const sermons = [
  { title: "Walking in Grace", scripture: "Ephesians 2:1–10", date: "July 28, 2026", speaker: "Pastor David Kim", duration: "42 min" },
  { title: "The Way of the Cross", scripture: "John 14:1–6", date: "July 21, 2026", speaker: "Pastor David Kim", duration: "38 min" },
  { title: "Community of Grace", scripture: "Acts 2:42–47", date: "July 14, 2026", speaker: "Pastor Sarah Lee", duration: "35 min" },
];

const ministries = [
  { icon: BookOpen, title: "Bible Study", desc: "Wednesday evenings — deep dive into Scripture together." },
  { icon: Users, title: "Small Groups", desc: "Connect in community through weekly life groups." },
  { icon: Heart, title: "Outreach", desc: "Serving our city with grace and compassion." },
  { icon: Music, title: "Worship Team", desc: "Join us in leading the congregation in praise." },
];

const events = [
  { date: "Aug 10", title: "Sunday Worship Service", time: "11:00 AM", tag: "Weekly" },
  { date: "Aug 13", title: "Wednesday Bible Study", time: "7:00 PM", tag: "Weekly" },
  { date: "Aug 17", title: "Family Picnic & Fellowship", time: "1:00 PM", tag: "Special" },
  { date: "Aug 24", title: "Youth Night", time: "6:30 PM", tag: "Youth" },
];

export default function Home() {
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
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C9973E] to-transparent opacity-60" />

        <div className="relative container pt-24 pb-32">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6 animate-fade-up">
              <div className="h-px w-8 bg-[#C9973E]" />
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Welcome to</p>
            </div>
            <h1
              className="text-white mb-6 animate-fade-up animate-fade-up-delay-1"
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: "clamp(2.8rem, 7vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              Graceway<br />
              <span className="text-[#C9973E]">Baptist</span> Church
            </h1>
            <p className="text-white/60 text-sm tracking-[0.15em] mb-3 animate-fade-up animate-fade-up-delay-2">
              그레이스웨이 침례교회
            </p>
            <div className="flex items-center gap-3 mb-6 animate-fade-up animate-fade-up-delay-2">
              <div className="h-px w-12 bg-[#C9973E]/60" />
              <p className="text-white/70 text-sm italic" style={{ fontFamily: "'Source Serif 4', serif" }}>
                "For by grace you have been saved through faith." — Eph 2:8
              </p>
            </div>
            <p className="text-white/70 text-base leading-relaxed mb-10 max-w-lg animate-fade-up animate-fade-up-delay-3">
              A community where grace meets everyday life. We strive to encourage one another to follow Jesus Christ and invite others to him.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up animate-fade-up-delay-4">
              <Link
                href="/connect"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#C9973E] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#b8862e] transition-all duration-200 active:scale-[0.97]"
              >
                Plan a Visit <ArrowRight size={16} />
              </Link>
              <Link
                href="/sermons"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/40 text-white font-medium text-sm tracking-wide rounded-sm hover:bg-white/10 transition-all duration-200"
              >
                <Play size={14} /> Watch Sermons
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
              { icon: Clock, label: "Sunday Worship", value: "11:00 AM" },
              { icon: MapPin, label: "Location", value: "123 Grace Way, Your City" },
              { icon: Clock, label: "Wednesday Bible Study", value: "7:00 PM" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#C9973E]/20 flex items-center justify-center">
                  <Icon size={18} className="text-[#C9973E]" />
                </div>
                <p className="text-white/50 text-xs tracking-widest uppercase">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WELCOME / ABOUT — Asymmetric ── */}
      <section className="py-28 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text — wider column, left-aligned */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Our Story</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, lineHeight: 1.15 }}
              >
                Grace is not a destination —<br />
                <em className="text-[#2F6F9F] not-italic">it's the way.</em>
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                Graceway Baptist Church is a welcoming, multi-cultural congregation rooted in the Word of God. We believe that every person is created in the image of God and deserves to experience His grace, love, and community.
              </p>
              <p className="text-[#242A30]/70 leading-relaxed mb-8">
                Whether you're exploring faith for the first time or looking for a church home — every Sunday, a seat is waiting for you.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#17324D] font-semibold text-sm hover:text-[#C9973E] transition-colors group"
              >
                Learn More About Us
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Image — larger, offset */}
            <div className="lg:col-span-7 relative">
              <div className="aspect-[16/10] rounded-sm overflow-hidden shadow-2xl">
                <img src={COMMUNITY_IMG} alt="Graceway Community Worship" className="w-full h-full object-cover" />
              </div>
              {/* Floating scripture card — offset bottom-left */}
              <div className="absolute -bottom-8 -left-4 lg:-left-8 bg-[#17324D] text-white p-5 rounded-sm shadow-xl max-w-[200px]">
                <div className="w-6 h-px bg-[#C9973E] mb-3" />
                <p className="text-white/75 text-xs italic leading-relaxed">
                  "For by grace you have been saved through faith."
                </p>
                <p className="text-[#C9973E] text-xs font-semibold mt-2">— Ephesians 2:8</p>
              </div>
              {/* Accent corner */}
              <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-[#C9973E]/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT SERMONS ── */}
      <section className="py-24 bg-[#F4F6F7]">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Messages</p>
              </div>
              <h2
                className="text-[#17324D]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
              >
                Recent Sermons
              </h2>
            </div>
            <Link
              href="/sermons"
              className="hidden sm:inline-flex items-center gap-1 text-[#2F6F9F] text-sm font-medium hover:text-[#17324D] transition-colors"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {/* Featured + 2 smaller — asymmetric */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Featured */}
            <div className="lg:col-span-3 bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer">
              <div className="relative aspect-video overflow-hidden">
                <img src={SERMON_IMG} alt={sermons[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17324D]/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#C9973E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-[#C9973E] text-xs font-medium mb-1">{sermons[0].scripture}</p>
                  <h3 className="text-white font-bold text-xl" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {sermons[0].title}
                  </h3>
                  <p className="text-white/60 text-xs mt-1">{sermons[0].speaker} · {sermons[0].date}</p>
                </div>
                <div className="absolute top-3 right-3 bg-[#17324D]/80 text-white text-xs px-2 py-1 rounded-sm">
                  {sermons[0].duration}
                </div>
              </div>
            </div>

            {/* Two smaller */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {sermons.slice(1).map((s, i) => (
                <div key={i} className="bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer flex flex-col flex-1">
                  <div className="relative h-36 overflow-hidden">
                    <img src={SERMON_IMG} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                      {s.title}
                    </h3>
                    <p className="text-[#242A30]/45 text-[11px] mt-1">{s.speaker} · {s.date}</p>
                  </div>
                </div>
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
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Get Involved</p>
              </div>
              <h2
                className="text-white mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                Ministries &<br />Community
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                There's a place for everyone at Graceway. Find where you belong and how you can serve.
              </p>
              <Link
                href="/ministries"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#C9973E] text-[#C9973E] text-sm font-semibold tracking-wide rounded-sm hover:bg-[#C9973E] hover:text-white transition-all duration-200"
              >
                Explore All <ArrowRight size={14} />
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
                    {m.title}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KIDS / FAMILIES ── */}
      <section className="py-28 bg-white" style={{ marginTop: "-2rem" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden shadow-xl">
                <img src={KIDS_IMG} alt="Children's Ministry" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-5 -right-5 bg-[#C9973E] text-white p-4 rounded-sm shadow-lg">
                <p className="text-2xl font-bold" style={{ fontFamily: "'Source Serif 4', serif" }}>Kids</p>
                <p className="text-xs tracking-wider uppercase">Ministry</p>
              </div>
              <div className="absolute -bottom-3 -left-3 w-16 h-16 border-b-2 border-l-2 border-[#17324D]/20" />
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Families Welcome</p>
              </div>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                Coming With Kids?
              </h2>
              <div className="w-12 h-0.5 bg-[#C9973E] mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                We believe children are a gift from God and deserve a safe, nurturing environment to learn about His love. Our children's ministry provides age-appropriate teaching, worship, and community for kids of all ages.
              </p>
              <p className="text-[#242A30]/70 leading-relaxed mb-8">
                During Sunday worship, children's classes are available for nursery through 5th grade. We'd love to meet your family!
              </p>
              <Link
                href="/ministries"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
              >
                Learn About Kids Ministry <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section className="py-24 bg-[#F4F6F7]">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-8 bg-[#C9973E]" />
                <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">Calendar</p>
              </div>
              <h2
                className="text-[#17324D]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
              >
                Upcoming Events
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
                    {e.title}
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
        <div className="relative container">
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
                Subscribe to Our Newsletter
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Be in the know — sign up for our weekly newsletter. Read encouraging reflections, current announcements, and upcoming events.
              </p>
            </div>
            <div>
              <form
                className="flex flex-col sm:flex-row gap-3"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm rounded-sm focus:outline-none focus:border-[#C9973E] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#C9973E] text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-[#b8862e] transition-colors active:scale-[0.97] whitespace-nowrap"
                >
                  Sign Up
                </button>
              </form>
              <p className="text-white/30 text-xs mt-3">We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

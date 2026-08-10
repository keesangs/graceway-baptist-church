/**
 * About Page — Graceway Baptist Church
 * Sections: Hero, Our Story, Beliefs, Leadership, Vision
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";
const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const PASTOR_IMG = "/manus-storage/pastor_hunsuk_lee_a8925cb9.webp";

const beliefs = [
  { title: "Scripture", desc: "We believe the Bible is the inspired, authoritative Word of God — our ultimate guide for faith and life." },
  { title: "Salvation by Grace", desc: "We believe salvation is a gift of God's grace through faith in Jesus Christ alone, not by our own works." },
  { title: "Baptism", desc: "We practice believer's baptism by immersion as a public declaration of faith in Jesus Christ." },
  { title: "Community", desc: "We believe the local church is God's primary vehicle for discipleship, worship, and mission in the world." },
  { title: "Prayer", desc: "We believe prayer is the foundation of all we do — connecting us to God and one another." },
  { title: "Mission", desc: "We are called to make disciples of all nations, sharing the good news of Jesus with our city and the world." },
];

const MYEONGJE_IMG = "https://media.licdn.com/dms/image/v2/C5603AQGC40_2yaKGdg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1632380620884?e=2147483647&v=beta&t=znvTv-YbEaN2UHNqMDqW8Y0N5PYsy0UoDMxJ6ctj6rw";

const staff = [
  { 
    name: "Pastor Hunsuk Lee", 
    role: "Lead Pastor", 
    img: PASTOR_IMG, 
    bio: "I believe the true pastor of our church is Jesus Christ. I prioritize Jesus in every decision and direction. I hope to be a sheep following the Good Shepherd with other sheep in our congregation.",
    education: "Master of Architecture (UC Berkeley) | Master of Divinity (Gateway Seminary)",
    ministry: "Bridgeway Baptist Church, Palo Alto (Associate Pastor) | Graceway Baptist Church, Fremont (Lead Pastor)"
  },
  { name: "Pastor MyeongJe Cho", role: "Pastoral Staff", img: MYEONGJE_IMG },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-20 bg-[#17324D] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={COMMUNITY_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[#17324D]/80" />
        <div className="relative container text-center">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Who We Are</p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            About Graceway
          </h1>
          <div className="gold-rule w-16 mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            A community rooted in grace, growing in faith, and reaching out in love.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Our Story</p>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                Founded on Grace,<br />Built on Community
              </h2>
              <div className="gold-rule-solid w-12 mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                Graceway Baptist Church was founded with a simple yet profound vision: to be a place where people from all walks of life could encounter the grace of God and find genuine community. From our earliest days, we have been committed to the authority of Scripture, the centrality of the Gospel, and the power of authentic relationships.
              </p>
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                As a multi-cultural congregation, we celebrate the diversity of our community and believe that the body of Christ is most beautiful when it reflects the full breadth of God's family. We worship in English and Korean, and we welcome all who are seeking truth, grace, and belonging.
              </p>
              <p className="text-[#242A30]/70 leading-relaxed">
                Today, Graceway continues to grow as a congregation committed to discipleship, worship, and service — in our neighborhood, our city, and beyond.
              </p>
            </div>
            <div className="aspect-[4/3] rounded-sm overflow-hidden shadow-xl">
              <img src={COMMUNITY_IMG} alt="Graceway Community" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-24 bg-[#F4F6F7]">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Doctrine</p>
            <h2
              className="text-[#17324D]"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
            >
              What We Believe
            </h2>
            <div className="gold-rule w-16 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefs.map((b, i) => (
              <div key={i} className="bg-white rounded-sm p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-8 h-0.5 bg-[#C9973E] mb-4" />
                <h3
                  className="text-[#17324D] font-semibold mb-3"
                  style={{ fontFamily: "'Source Serif 4', serif", fontSize: "1.1rem" }}
                >
                  {b.title}
                </h3>
                <p className="text-[#242A30]/65 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-[#17324D]">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Our Team</p>
            <h2
              className="text-white"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
            >
              Leadership
            </h2>
            <div className="gold-rule w-16 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {staff.map((s, i) => (
              <div key={i} className="group">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#C9973E]/30 group-hover:border-[#C9973E] transition-colors duration-300">
                    <img src={s.img} alt={s.name} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                  </div>
                  <h3
                    className="text-white font-semibold text-lg"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {s.name}
                  </h3>
                  <p className="text-[#C9973E] text-xs tracking-wide mt-1">{s.role}</p>
                </div>
                {s.bio && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                    <p className="text-white/80 text-sm leading-relaxed italic">\"{s.bio}\"</p>
                    {s.education && (
                      <div>
                        <p className="text-[#C9973E] text-xs tracking-wide uppercase font-semibold mb-2">Education</p>
                        <p className="text-white/70 text-sm">{s.education}</p>
                      </div>
                    )}
                    {s.ministry && (
                      <div>
                        <p className="text-[#C9973E] text-xs tracking-wide uppercase font-semibold mb-2">Ministry Experience</p>
                        <p className="text-white/70 text-sm">{s.ministry}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <div className="container max-w-xl mx-auto">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Join Us</p>
          <h2
            className="text-[#17324D] mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
          >
            Every Sunday, a seat is waiting for you.
          </h2>
          <p className="text-[#242A30]/60 mb-8 text-sm leading-relaxed">
            We'd love to meet you. Come as you are — no perfect faith required.
          </p>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
          >
            Plan a Visit <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

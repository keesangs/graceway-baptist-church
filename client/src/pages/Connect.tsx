/**
 * Connect Page — Graceway Baptist Church
 * Sections: Hero, Plan a Visit, Service Times, Contact Form, Map, Newsletter
 */
import { useState } from "react";
import { Clock, MapPin, Mail, Phone, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";

const faqs = [
  { q: "What should I wear?", a: "Come as you are! We have no dress code — jeans and a t-shirt are just as welcome as a suit." },
  { q: "Is there parking available?", a: "Yes, free parking is available in our lot adjacent to the building. Look for the Graceway signs." },
  { q: "What happens during the service?", a: "Our Sunday service includes worship music, prayer, a Scripture-based sermon, and time for community. Services last approximately 75–90 minutes." },
  { q: "Is there childcare available?", a: "Yes! We offer children's classes for nursery through 5th grade during the Sunday morning service." },
  { q: "Do I need to be a Christian to attend?", a: "Absolutely not. We welcome everyone — whether you're exploring faith for the first time or returning after years away." },
];

export default function Connect() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSent, setFormSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
  };

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
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">We'd Love to Meet You</p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            Connect With Us
          </h1>
          <div className="gold-rule w-16 mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            Whether you're visiting for the first time or looking to get more involved, we're here for you.
          </p>
        </div>
      </section>

      {/* Plan a Visit */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Service Info */}
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Plan a Visit</p>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                Every Sunday, a seat<br />is waiting for you.
              </h2>
              <div className="gold-rule-solid w-12 mb-8" />

              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: "Sunday Worship",
                    lines: ["11:00 AM — English Service", "Children's classes available"],
                  },
                  {
                    icon: Clock,
                    title: "Wednesday Bible Study",
                    lines: ["7:00 PM — All are welcome", "Childcare available upon request"],
                  },
                  {
                    icon: MapPin,
                    title: "Location",
                    lines: ["123 Grace Way", "Your City, ST 00000"],
                    link: "https://maps.google.com",
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    lines: ["(555) 123-4567"],
                  },
                  {
                    icon: Mail,
                    title: "Email",
                    lines: ["info@gracewaybaptist.org"],
                  },
                ].map(({ icon: Icon, title, lines, link }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#17324D]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className="text-[#17324D]" />
                    </div>
                    <div>
                      <p className="text-[#242A30] font-semibold text-sm mb-0.5">{title}</p>
                      {lines.map((l) => (
                        <p key={l} className="text-[#242A30]/60 text-sm">{l}</p>
                      ))}
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2F6F9F] text-xs font-medium hover:text-[#17324D] transition-colors mt-1 inline-flex items-center gap-1"
                        >
                          Get Directions <ChevronRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[#F4F6F7] rounded-sm p-8">
              <h3
                className="text-[#17324D] font-semibold mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "1.3rem" }}
              >
                Send Us a Message
              </h3>
              {formSent ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-[#C9973E]/20 flex items-center justify-center mx-auto mb-4">
                    <Mail size={20} className="text-[#C9973E]" />
                  </div>
                  <p className="text-[#17324D] font-semibold mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    Message Sent!
                  </p>
                  <p className="text-[#242A30]/60 text-sm">We'll be in touch soon. Thank you for reaching out.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">Phone (optional)</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">How can we help?</label>
                    <select className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors text-[#242A30]">
                      <option value="visit">I'd like to plan a visit</option>
                      <option value="prayer">Prayer request</option>
                      <option value="ministry">Ministry involvement</option>
                      <option value="general">General question</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#17324D] text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-[#1e4060] transition-colors active:scale-[0.98]"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#F4F6F7]">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">First Time?</p>
            <h2
              className="text-[#17324D]"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
            >
              What to Expect
            </h2>
            <div className="gold-rule w-16 mx-auto mt-4" />
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-sm overflow-hidden shadow-sm">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span
                    className="text-[#17324D] font-medium text-sm"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {faq.q}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`text-[#C9973E] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <div className="h-px bg-[#C9973E]/20 mb-3" />
                    <p className="text-[#242A30]/65 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-72 bg-[#17324D]/10 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={32} className="text-[#17324D]/30 mx-auto mb-2" />
            <p className="text-[#17324D]/40 text-sm">123 Grace Way, Your City, ST 00000</p>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[#2F6F9F] text-xs font-medium hover:text-[#17324D] transition-colors"
            >
              Open in Google Maps <ChevronRight size={12} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

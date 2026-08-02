/**
 * Footer — Graceway Baptist Church
 * Design: Grace Navy background, gold accents, bilingual (EN/KR)
 */
import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#17324D] text-white">
      {/* Gold top rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9973E] to-transparent" />

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/manus-storage/graceway_updated_youtube_icon_0a4ecf05.png"
                alt="Graceway Baptist Church"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-bold text-white tracking-wide" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  GRACEWAY
                </div>
                <div className="text-[#C9973E] text-[0.6rem] tracking-[0.18em] uppercase">
                  Baptist Church
                </div>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-2">
              그레이스웨이 침례교회
            </p>
            <p className="text-white/60 text-sm leading-relaxed italic">
              "For by grace you have been saved through faith."
            </p>
            <p className="text-[#C9973E] text-xs mt-1">— Ephesians 2:8</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#C9973E] text-xs tracking-[0.2em] uppercase font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/sermons", label: "Sermons" },
                { href: "/ministries", label: "Ministries" },
                { href: "/connect", label: "Connect" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-[#C9973E] text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Info */}
          <div>
            <h4 className="text-[#C9973E] text-xs tracking-[0.2em] uppercase font-semibold mb-4">
              Service Times
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-[#C9973E] mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Sunday Worship</p>
                  <p className="text-white/60 text-xs">11:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-[#C9973E] mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Wednesday Bible Study</p>
                  <p className="text-white/60 text-xs">7:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#C9973E] mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Location</p>
                  <p className="text-white/60 text-xs">123 Grace Way, Your City, ST 00000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-[#C9973E] text-xs tracking-[0.2em] uppercase font-semibold mb-4">
              Connect With Us
            </h4>
            <div className="flex items-center gap-2 mb-4">
              <Mail size={14} className="text-[#C9973E]" />
              <a
                href="mailto:info@gracewaybaptist.org"
                className="text-white/70 hover:text-white text-sm transition-colors"
              >
                info@gracewaybaptist.org
              </a>
            </div>
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-[#C9973E] hover:border-[#C9973E] transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/connect"
                className="inline-block px-5 py-2.5 bg-[#C9973E] text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#b8862e] transition-colors duration-200"
              >
                Plan a Visit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} Graceway Baptist Church · 그레이스웨이 침례교회
          </p>
          <p className="text-white/40 text-xs">
            Grace · Faith · Community
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Navbar — Graceway Baptist Church
 * Design: Modern Reverence — transparent on hero, opaque Grace Navy on scroll
 * Sticky top nav with smooth transition, gold accent on active link
 * Language toggle: KO / EN
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Inbox } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { lang, toggleLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location === "/";
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/sermons", label: t("nav.sermons") },
    { href: "/worship", label: lang === "ko" ? "찬양" : "Worship" },
    { href: "/ministries", label: t("nav.ministries") },
    { href: "/connect", label: t("nav.connect") },
    { href: "/media", label: lang === "ko" ? "미디어" : "Media" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-[#17324D]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <img
              src="/manus-storage/graceway_navbar_icon_v2_6a6e5e3f.png"
              alt="Graceway Baptist Church"
              className="w-12 h-12 rounded-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              style={{
                filter: "brightness(1.15) contrast(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
                boxShadow: "0 0 0 2px rgba(201,151,62,0.5), 0 2px 8px rgba(0,0,0,0.5)",
              }}
            />
          </div>
          <div className="hidden sm:block">
            <div
              className="font-bold text-white leading-tight tracking-wide"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "1rem" }}
            >
              GRACEWAY
            </div>
            <div className="text-[#C9973E] text-[0.6rem] tracking-[0.2em] uppercase font-medium">
              Baptist Church
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-200 relative group ${
                location === link.href
                  ? "text-[#C9973E]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-[#C9973E] transition-all duration-200 ${
                  location === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}

          {/* Admin Inbox link — visible only to admin users */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`text-sm font-medium tracking-wide transition-colors duration-200 relative group flex items-center gap-1.5 ${
                location === "/admin"
                  ? "text-[#C9973E]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              <Inbox size={14} />
              {lang === "ko" ? "수신함" : "Inbox"}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-[#C9973E] transition-all duration-200 ${
                  location === "/admin" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold tracking-widest text-white/80 hover:text-white hover:border-white/60 transition-all duration-200 active:scale-[0.97]"
            aria-label="Toggle language"
          >
            <span className={lang === "ko" ? "text-[#C9973E]" : "text-white/50"}>KO</span>
            <span className="text-white/30 mx-0.5">|</span>
            <span className={lang === "en" ? "text-[#C9973E]" : "text-white/50"}>EN</span>
          </button>

          <Link
            href="/connect"
            className="ml-1 px-5 py-2 bg-[#C9973E] text-white text-sm font-semibold rounded-sm tracking-wide hover:bg-[#b8862e] transition-colors duration-200 active:scale-[0.97]"
          >
            {t("nav.planVisit")}
          </Link>
        </nav>

        {/* Mobile: lang toggle + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/30 text-[0.65rem] font-bold tracking-widest text-white/80 hover:text-white transition-all duration-200"
            aria-label="Toggle language"
          >
            <span className={lang === "ko" ? "text-[#C9973E]" : "text-white/50"}>KO</span>
            <span className="text-white/30">|</span>
            <span className={lang === "en" ? "text-[#C9973E]" : "text-white/50"}>EN</span>
          </button>
          <button
            className="text-white p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#17324D] border-t border-white/10">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm font-medium rounded transition-colors ${
                  location === link.href
                    ? "text-[#C9973E] bg-white/5"
                    : "text-white/90 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-4 py-3 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                  location === "/admin"
                    ? "text-[#C9973E] bg-white/5"
                    : "text-white/90 hover:text-white hover:bg-white/5"
                }`}
              >
                <Inbox size={14} />
                {lang === "ko" ? "수신함" : "Inbox"}
              </Link>
            )}
            <Link
              href="/connect"
              className="mt-2 mx-4 px-5 py-3 bg-[#C9973E] text-white text-sm font-semibold rounded-sm text-center tracking-wide"
            >
              {t("nav.planVisit")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/**
 * Navbar — Graceway Baptist Church
 * A compact, bilingual brand header using the official Graceway lockup.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Inbox, Menu, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { lang, toggleLang, t } = useLang();
  const { user } = useAuth();
  const isHome = location === "/";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/sermons", label: t("nav.sermons") },
    { href: "/worship", label: lang === "ko" ? "찬양" : "Worship" },
    { href: "/events", label: t("nav.events") },
    { href: "/gallery", label: lang === "ko" ? "갤러리" : "Gallery" },
    { href: "/meditation", label: lang === "ko" ? "묵상" : "Daily Bible" },
    { href: "/ministries", label: t("nav.ministries") },
    { href: "/connect", label: t("nav.connect") },
    { href: "/media", label: lang === "ko" ? "미디어" : "Media" },
  ];

  const navLinkClass = (active: boolean) =>
    `group relative rounded-sm text-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B87A] ${
      active ? "text-[#D9B87A]" : "text-white/82 hover:text-white"
    }`;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? "border-b border-[#D8E0E3]/12 bg-[#163B59]/96 shadow-[0_12px_30px_rgba(11,35,53,0.2)] backdrop-blur-md"
          : "bg-[#163B59]/38 backdrop-blur-[2px]"
      }`}
    >
      <div
        className={`container mx-auto flex items-center justify-between transition-[height] duration-300 ease-out ${
          scrolled ? "h-[3.75rem] md:h-[4.25rem]" : "h-[4.5rem] md:h-[5.25rem]"
        }`}
      >
        <Link
          href="/"
          className={`group block transform-gpu will-change-transform transition-[width,transform] duration-300 ease-out hover:scale-[1.012] ${
            scrolled ? "w-[8.8rem] sm:w-[11rem]" : "w-[10.6rem] sm:w-[13.5rem]"
          }`}
        >
          <BrandLogo variant="on-dark" priority />
        </Link>

        <nav className={`hidden items-center transition-[gap] duration-300 md:flex ${scrolled ? "gap-4 lg:gap-5" : "gap-5 lg:gap-6"}`} aria-label="Primary navigation">
          {navLinks.map((link) => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-px bg-[#B9955E] transition-all duration-200 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin" className={`${navLinkClass(location === "/admin")} flex items-center gap-1.5`}>
              <Inbox size={14} />
              {lang === "ko" ? "수신함" : "Inbox"}
              <span className={`absolute -bottom-1 left-0 h-px bg-[#B9955E] transition-all duration-200 ${location === "/admin" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>
          )}

          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold tracking-widest text-white/80 transition-all duration-200 hover:border-white/60 hover:text-white active:scale-[0.97]"
            aria-label="Toggle language"
          >
            <span className={lang === "ko" ? "text-[#D9B87A]" : "text-white/50"}>KO</span>
            <span className="mx-0.5 text-white/30">|</span>
            <span className={lang === "en" ? "text-[#D9B87A]" : "text-white/50"}>EN</span>
          </button>

          <Link href="/connect" className="ml-1 rounded-sm bg-[#B9955E] px-5 py-2 text-sm font-semibold tracking-wide text-[#0B2C43] transition-colors duration-200 hover:bg-[#C8A977] active:scale-[0.97]">
            {t("nav.planVisit")}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border border-white/25 px-2.5 py-1 text-[0.65rem] font-bold tracking-widest text-white/80 transition-all duration-200 hover:text-white"
            aria-label="Toggle language"
          >
            <span className={lang === "ko" ? "text-[#D9B87A]" : "text-white/50"}>KO</span>
            <span className="text-white/30">|</span>
            <span className={lang === "en" ? "text-[#D9B87A]" : "text-white/50"}>EN</span>
          </button>
          <button className="p-2 text-white" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#163B59] md:hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-4 py-3 text-sm font-medium transition-colors ${
                  location === link.href ? "bg-white/5 text-[#D9B87A]" : "text-white/90 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 rounded px-4 py-3 text-sm font-medium transition-colors ${
                  location === "/admin" ? "bg-white/5 text-[#D9B87A]" : "text-white/90 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Inbox size={14} />
                {lang === "ko" ? "수신함" : "Inbox"}
              </Link>
            )}
            <Link href="/connect" className="mx-4 mt-2 rounded-sm bg-[#B9955E] px-5 py-3 text-center text-sm font-semibold tracking-wide text-[#0B2C43]">
              {t("nav.planVisit")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

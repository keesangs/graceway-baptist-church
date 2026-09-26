/** Footer — shared bilingual church information and official brand lockup. */
import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail, MapPin, Clock } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Some mobile/in-app browsers silently suppress a target=_blank social link.
 * Keep the desktop new-tab behavior, while following a direct user gesture in
 * the current tab on touch-first devices so visitors always reach the profile.
 */
function followSocialLinkOnTouch(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || typeof window === "undefined"
    || !window.matchMedia("(pointer: coarse)").matches
  ) return;

  event.preventDefault();
  window.location.assign(href);
}

const officialSocialLinks = [
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://www.facebook.com/people/Graceway-Baptist-Church/61594452553986/",
    brandClassName: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/gracewaybaptistchurchfremont",
    brandClassName: "hover:border-[#E4405F] hover:bg-[#E4405F] hover:text-white",
  },
  {
    icon: Youtube,
    label: "YouTube",
    href: "https://www.youtube.com/@Graceway-Baptist",
    brandClassName: "hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white",
  },
] as const;

const socialIconBaseClass =
  "flex h-11 w-11 touch-manipulation origin-center items-center justify-center rounded-full border border-white/20 text-white/60 transition-[transform,color,background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:hover:scale-110 active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#163B59]";

export default function Footer() {
  const { lang, t } = useLang();
  const quickLinks = [
    { href: "/", en: "Home", ko: "홈" },
    { href: "/about", en: "About Us", ko: "교회 소개" },
    { href: "/sermons", en: "Sermons", ko: "설교" },
    { href: "/ministries", en: "Ministries", ko: "사역" },
    { href: "/connect", en: "Connect", ko: "문의" },
  ];

  return (
    <footer className="bg-[#163B59] text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-[#B9955E] to-transparent" />

      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[380px_200px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <div>
            <div className="mb-5 w-[13.5rem]">
              <BrandLogo variant="on-dark" />
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/60">
              {lang === "ko" ? "그레이스웨이 침례교회" : "Graceway Baptist Church"}
            </p>
            <p className="text-sm italic leading-relaxed text-white/60">{t("footer.tagline")}</p>
            <p className="mt-1 text-xs text-[#D9B87A]">{t("footer.verse")}</p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B87A]">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition-colors duration-200 hover:text-[#D9B87A]">
                    {lang === "ko" ? link.ko : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B87A]">{t("footer.serviceTimes")}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 shrink-0 text-[#D9B87A]" />
                <div>
                  <p className="text-sm font-medium text-white">{t("footer.sundayWorship")}</p>
                  <p className="text-xs text-white/60">1:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 shrink-0 text-[#D9B87A]" />
                <div>
                  <p className="text-sm font-medium text-white">{t("footer.wednesdayBible")}</p>
                  <p className="text-xs text-white/60">8:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#D9B87A]" />
                <div>
                  <p className="text-sm font-medium text-white">{t("footer.location")}</p>
                  <p className="text-xs text-white/60">2791 Driscoll Rd, Fremont, CA 94539</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B87A]">{t("footer.connectWithUs")}</h4>
            <div className="mb-4 flex items-center gap-2">
              <Mail size={14} className="text-[#D9B87A]" />
              <a href="mailto:info@graceway-baptist.org" className="text-sm text-white/70 transition-colors hover:text-white">
                info@graceway-baptist.org
              </a>
            </div>
            <div className="flex gap-3">
              {officialSocialLinks.map(({ icon: Icon, label, href, brandClassName }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  onClick={event => followSocialLinkOnTouch(event, href)}
                  className={`${socialIconBaseClass} ${brandClassName}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/connect" className="inline-block rounded-sm bg-[#B9955E] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#0B2C43] transition-colors duration-200 hover:bg-[#C8A977]">
                {t("nav.planVisit")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
          <p className="text-xs text-white/40">{t("footer.copyright").replace("2026", String(new Date().getFullYear()))}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/40"><p>{t("footer.brandValues")}</p><span aria-hidden="true" className="text-white/20">|</span><Link href="/privacy" className="transition-colors hover:text-[#D9B87A]">{lang === "ko" ? "개인정보 처리방침" : "Privacy"}</Link><Link href="/terms" className="transition-colors hover:text-[#D9B87A]">{lang === "ko" ? "이용약관" : "Terms"}</Link></div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Connect Page — Graceway Baptist Church
 * Sections: Hero, Plan a Visit, Service Times, Contact Form, Map, Newsletter
 */
import { useState, useRef } from "react";
import { Clock, MapPin, Mail, Phone, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { MapView } from "@/components/Map";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

type ContactTopic = "visit" | "prayer" | "ministry" | "general";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  topic: "visit" as ContactTopic,
  message: "",
};

// 2791 Driscoll Rd, Fremont, CA 94539
const CHURCH_COORDS = { lat: 37.5223, lng: -121.9188 };
const CHURCH_ADDRESS = "2791 Driscoll Rd, Fremont, CA 94539";

const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";

const faqs = [
  { qEn: "What should I wear?", qKo: "어떤 옷을 입고 가면 되나요?", aEn: "Come as you are! We have no dress code — jeans and a T-shirt are just as welcome as a suit.", aKo: "있는 그대로 오세요! 별도의 복장 규정은 없으며, 청바지와 티셔츠도 정장만큼이나 환영합니다." },
  { qEn: "Is there parking available?", qKo: "주차할 곳이 있나요?", aEn: "Yes, free parking is available in the lot next to the building. Look for the Graceway signs.", aKo: "네, 건물 옆 주차장을 무료로 이용하실 수 있습니다. 그레이스웨이 표지판을 찾아 주세요." },
  { qEn: "How long does the service usually last?", qKo: "예배시간은 보통 얼마나 걸리나요?", aEn: "Sunday worship usually lasts about one hour. We also share a meal afterward, so please join us for fellowship.", aKo: "주일 예배는 보통 한 시간 정도 진행됩니다. 예배 후에는 맛있는 음식을 나누며 식사 교제도 있으니, 꼭 함께해 주세요." },
  { qEn: "What happens during the service?", qKo: "예배는 어떻게 진행되나요?", aEn: "Our Sunday service includes worship music, prayer, a Scripture-based sermon, and time for community. Services last approximately 75–90 minutes.", aKo: "주일 예배에는 찬양과 기도, 성경 말씀을 중심으로 한 설교, 그리고 교제의 시간이 포함됩니다. 예배는 약 한시간 가량 진행됩니다." },
  { qEn: "Is there childcare available?", qKo: "어린이 돌봄이 있나요?", aEn: "Yes! We offer children’s classes from nursery through fifth grade during Sunday worship.", aKo: "네! 주일 예배 중 영아부부터 초등학교 5학년까지 어린이 예배 및 교실이 운영됩니다." },
  { qEn: "Do I need to be a Christian to attend?", qKo: "그리스도인이 아니어도 참석할 수 있나요?", aEn: "Absolutely not. We welcome everyone — whether you’re exploring faith for the first time or returning after years away.", aKo: "물론입니다. 처음 신앙을 알아가는 분도, 오랜 시간이 지난 뒤 다시 교회를 찾는 분도 모두 환영합니다." },
];

export default function Connect() {
  const { lang } = useLang();
  const ko = lang === "ko";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Contact form — persists to the contact_messages table.
  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setFormSent(true);
      setForm(EMPTY_FORM);
    },
  });

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      topic: form.topic,
      message: form.message.trim() || undefined,
    });
  };

  const mapRef = useRef<google.maps.Map | null>(null);

  // Geocode the church address so the marker lands on the real building, then
  // drop an AdvancedMarkerElement with a small info window.
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;

    const placeMarker = (position: google.maps.LatLngLiteral | google.maps.LatLng) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title: "Graceway Baptist Church",
      });

      const info = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui,sans-serif;padding:2px 4px;max-width:220px">
            <strong style="color:#17324D;font-size:13px">Graceway Baptist Church</strong>
            <div style="color:#5b6b7c;font-size:12px;margin-top:3px">${CHURCH_ADDRESS}</div>
          </div>`,
      });

      marker.addListener("click", () => info.open({ anchor: marker, map }));
      info.open({ anchor: marker, map });
    };

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: CHURCH_ADDRESS }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        map.setCenter(loc);
        placeMarker(loc);
      } else {
        // Fall back to the hardcoded coordinates if geocoding is unavailable.
        placeMarker(CHURCH_COORDS);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <Navbar />

      <BrandPageHero
        eyebrow={ko ? "만나고 싶습니다" : "We’d Love to Meet You"}
        title={ko ? "문의하기" : "Connect With Us"}
        description={ko ? "처음 방문하시든, 더 깊이 참여하고 싶으시든, 언제든지 편하게 문의해 주세요." : "Whether you’re visiting for the first time or looking to get more involved, we’re here for you."}
        visual="welcome"
      />

      {/* Plan a Visit */}
      <section className="bg-[#FFFEFB] py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Service Info */}
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{ko ? "방문 안내" : "Plan a Visit"}</p>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {ko ? <>매 주일, 여러분을 위한<br />자리가 준비되어 있습니다.</> : <>There’s a place for you<br />every Sunday.</>}
              </h2>
              <div className="gold-rule-solid w-12 mb-8" />

              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: ko ? "주일 예배" : "Sunday Worship Service",
                    lines: [ko ? "매주 일요일 오후 1:30" : "Every Sunday, 1:30 PM"],
                  },
                  {
                    icon: Clock,
                    title: ko ? "수요 기도회" : "Wednesday Prayer Meeting",
                    lines: [ko ? "매주 수요일 오후 8:00" : "Every Wednesday, 8:00 PM"],
                  },
                  {
                    icon: MapPin,
                    title: ko ? "교회 주소" : "Location",
                    lines: ["2791 Driscoll Rd", "Fremont, CA 94539"],
                    link: "https://maps.google.com/?q=2791+Driscoll+Rd,+Fremont,+CA+94539",
                  },
                  {
                    icon: Phone,
                    title: ko ? "전화" : "Phone",
                    lines: ["+1 510-529-5636"],
                  },
                  {
                    icon: Mail,
                    title: ko ? "이메일" : "Email",
                    lines: ["info@graceway-baptist.org"],
                  },
                ].map(({ icon: Icon, title, lines, link }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7EEF1]">
                      <Icon size={15} className="text-[#163B59]" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-[#2E3A46]">{title}</p>
                      {lines.map((l) => (
                        <p key={l} className="text-sm text-[#607A91]">{l}</p>
                      ))}
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#607A91] transition-colors hover:text-[#163B59]"
                        >
                          {ko ? "길찾기" : "Get Directions"} <ChevronRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="brand-surface rounded-xl border border-[#DCE4E7] p-6 md:p-8">
              <h3
                className="mb-6 font-semibold text-[#163B59]"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "1.3rem" }}
              >
                {ko ? "메시지 보내기" : "Send Us a Message"}
              </h3>
              {formSent ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B9955E]/20">
                    <Mail size={20} className="text-[#B07834]" />
                  </div>
                  <p className="mb-2 font-semibold text-[#163B59]" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {ko ? "메시지를 보냈습니다!" : "Message Sent!"}
                  </p>
                  <p className="text-sm text-[#607A91]">{ko ? "곧 연락드리겠습니다. 문의해 주셔서 감사합니다." : "We’ll be in touch soon. Thank you for reaching out."}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 [&_input]:rounded-md [&_input]:border-[#C8D4D9] [&_input]:focus:border-[#607A91] [&_select]:rounded-md [&_select]:border-[#C8D4D9] [&_select]:focus:border-[#607A91] [&_textarea]:rounded-md [&_textarea]:border-[#C8D4D9] [&_textarea]:focus:border-[#607A91] [&_label]:text-[#607A91]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-first-name" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "이름" : "First Name"}</label>
                      <input
                        id="contact-first-name"
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        disabled={submitMutation.isPending}
                        className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-last-name" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "성" : "Last Name"}</label>
                      <input
                        id="contact-last-name"
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        disabled={submitMutation.isPending}
                        className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "이메일" : "Email"}</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "전화번호 (선택)" : "Phone (optional)"}</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-topic" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "어떻게 도와드릴까요?" : "How can we help?"}</label>
                    <select
                      id="contact-topic"
                      value={form.topic}
                      onChange={(e) => setField("topic", e.target.value as ContactTopic)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors text-[#242A30] disabled:opacity-50"
                    >
                      <option value="visit">{ko ? "방문을 계획하고 싶습니다" : "I’d like to plan a visit"}</option>
                      <option value="prayer">{ko ? "기도를 요청합니다" : "Prayer request"}</option>
                      <option value="ministry">{ko ? "사역 참여에 관심이 있습니다" : "Ministry involvement"}</option>
                      <option value="general">{ko ? "일반 문의" : "General question"}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block mb-1.5 text-xs font-medium text-[#242A30]/60">{ko ? "메시지" : "Message"}</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={form.message}
                      onChange={(e) => setField("message", e.target.value)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors resize-none disabled:opacity-50"
                    />
                  </div>
                  {submitMutation.isError && (
                    <p className="text-red-600 text-xs">
                      {ko
                        ? "전송에 실패했습니다. 입력한 정보를 확인하고 다시 시도해 주세요."
                        : "Could not send your message. Please check the fields and try again."}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#163B59] py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#245170] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                    {submitMutation.isPending ? (ko ? "전송 중..." : "Sending...") : (ko ? "메시지 보내기" : "Send Message")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#EEF3F5] py-20">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{ko ? "처음 방문하시나요?" : "First Time?"}</p>
            <h2
              className="text-[#17324D]"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
            >
              {ko ? "처음 오시는 분들을 위한 안내입니다" : "What to Expect"}
            </h2>
            <div className="gold-rule w-16 mx-auto mt-4" />
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] shadow-sm">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#607A91]"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span
                    className="text-sm font-medium text-[#163B59]"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {ko ? faq.qKo : faq.qEn}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`shrink-0 text-[#B07834] transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <div className="mb-3 h-px bg-[#B9955E]/25" />
                    <p className="text-sm leading-relaxed text-[#607A91]">{ko ? faq.aKo : faq.aEn}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Google Map */}
      <section className="relative">
        <MapView
          className="w-full h-[420px]"
          initialCenter={CHURCH_COORDS}
          initialZoom={16}
          onMapReady={handleMapReady}
        />

        {/* Address card overlaid on the map */}
        <div className="pointer-events-auto absolute bottom-6 left-6 right-6 border-l-4 border-[#B9955E] bg-[#FFFEFB] p-5 shadow-xl sm:right-auto sm:max-w-sm">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-[#B07834]" />
            <div className="min-w-0">
              <p
                className="mb-1 text-sm font-semibold text-[#163B59]"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {ko ? "그레이스웨이 침례교회" : "Graceway Baptist Church"}
              </p>
              <p className="text-sm leading-relaxed text-[#607A91]">
                2791 Driscoll Rd
                <br />
                Fremont, CA 94539
              </p>
              <a
                href="https://maps.google.com/?q=2791+Driscoll+Rd,+Fremont,+CA+94539"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#607A91] transition-colors hover:text-[#163B59]"
              >
                {ko ? "길찾기" : "Get Directions"} <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

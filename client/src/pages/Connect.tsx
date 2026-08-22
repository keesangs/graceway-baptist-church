/**
 * Connect Page — Graceway Baptist Church
 * Sections: Hero, Plan a Visit, Service Times, Contact Form, Map, Newsletter
 */
import { useState, useRef } from "react";
import { Clock, MapPin, Mail, Phone, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  { qEn: "What happens during the service?", qKo: "예배는 어떻게 진행되나요?", aEn: "Our Sunday service includes worship music, prayer, a Scripture-based sermon, and time for community. Services last approximately 75–90 minutes.", aKo: "주일 예배에는 찬양과 기도, 성경 말씀을 중심으로 한 설교, 그리고 교제의 시간이 포함됩니다. 예배는 약 75~90분 동안 진행됩니다." },
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
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-20 bg-[#17324D] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={COMMUNITY_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[#17324D]/80" />
        <div className="relative container text-center">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{ko ? "만나고 싶습니다" : "We’d Love to Meet You"}</p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            {ko ? "문의하기" : "Connect With Us"}
          </h1>
          <div className="gold-rule w-16 mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            {ko ? "처음 방문하시든, 더 깊이 참여하고 싶으시든, 언제든지 편하게 문의해 주세요." : "Whether you’re visiting for the first time or looking to get more involved, we’re here for you."}
          </p>
        </div>
      </section>

      {/* Plan a Visit */}
      <section className="py-20 bg-white">
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
                          {ko ? "길찾기" : "Get Directions"} <ChevronRight size={12} />
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
                {ko ? "메시지 보내기" : "Send Us a Message"}
              </h3>
              {formSent ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-[#C9973E]/20 flex items-center justify-center mx-auto mb-4">
                    <Mail size={20} className="text-[#C9973E]" />
                  </div>
                  <p className="text-[#17324D] font-semibold mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {ko ? "메시지를 보냈습니다!" : "Message Sent!"}
                  </p>
                  <p className="text-[#242A30]/60 text-sm">{ko ? "곧 연락드리겠습니다. 문의해 주셔서 감사합니다." : "We’ll be in touch soon. Thank you for reaching out."}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "이름" : "First Name"}</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        disabled={submitMutation.isPending}
                        className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "성" : "Last Name"}</label>
                      <input
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
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "이메일" : "Email"}</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "전화번호 (선택)" : "Phone (optional)"}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      disabled={submitMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-[#242A30]/15 text-sm rounded-sm focus:outline-none focus:border-[#2F6F9F] transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "어떻게 도와드릴까요?" : "How can we help?"}</label>
                    <select
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
                    <label className="text-xs font-medium text-[#242A30]/60 block mb-1.5">{ko ? "메시지" : "Message"}</label>
                    <textarea
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
                    className="w-full py-3 bg-[#17324D] text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-[#1e4060] transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
      <section className="py-20 bg-[#F4F6F7]">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{ko ? "처음 방문하시나요?" : "First Time?"}</p>
            <h2
              className="text-[#17324D]"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
            >
              {ko ? "방문하시면 이런 시간을 보냅니다" : "What to Expect"}
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
                    {ko ? faq.qKo : faq.qEn}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`text-[#C9973E] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <div className="h-px bg-[#C9973E]/20 mb-3" />
                    <p className="text-[#242A30]/65 text-sm leading-relaxed">{ko ? faq.aKo : faq.aEn}</p>
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
        <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-sm bg-white shadow-xl border-l-4 border-[#C9973E] p-5 pointer-events-auto">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-[#C9973E] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p
                className="text-[#17324D] font-semibold text-sm mb-1"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {ko ? "그레이스웨이 침례교회" : "Graceway Baptist Church"}
              </p>
              <p className="text-[#17324D]/60 text-sm leading-relaxed">
                2791 Driscoll Rd
                <br />
                Fremont, CA 94539
              </p>
              <a
                href="https://maps.google.com/?q=2791+Driscoll+Rd,+Fremont,+CA+94539"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[#2F6F9F] text-xs font-semibold hover:text-[#17324D] transition-colors"
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

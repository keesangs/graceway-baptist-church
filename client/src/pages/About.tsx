/**
 * About Page — Graceway Baptist Church
 * Sections: Hero, Our Story, Beliefs, Leadership, Vision
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLang } from "@/contexts/LanguageContext";

const COMMUNITY_IMG = "/manus-storage/community_worship_a9637ac3.jpg";
const SERMON_IMG = "/manus-storage/sermon_stage_0620f4b7.jpg";
const PASTOR_IMG = "/manus-storage/pastor_hunsuk_lee_a8925cb9.webp";

const beliefs = [
  { titleEn: "Scripture", titleKo: "성경", descEn: "We believe the Bible is the inspired, authoritative Word of God — our ultimate guide for faith and life.", descKo: "성경은 하나님의 영감으로 기록된 권위 있는 말씀으로서, 믿음과 삶의 가장 궁극적인 기준임을 믿습니다." },
  { titleEn: "Salvation by Grace", titleKo: "은혜로 얻는 구원", descEn: "We believe salvation is a gift of God's grace through faith in Jesus Christ alone, not by our own works.", descKo: "구원은 우리의 행위가 아니라 오직 예수 그리스도를 믿는 믿음을 통해 주시는 하나님의 은혜의 선물임을 믿습니다." },
  { titleEn: "Baptism", titleKo: "침례", descEn: "We practice believer's baptism by immersion as a public declaration of faith in Jesus Christ.", descKo: "예수 그리스도를 믿는 믿음을 공개적으로 고백하는 표시로서 침례를 행합니다." },
  { titleEn: "Community", titleKo: "공동체", descEn: "We believe the local church is God's primary vehicle for discipleship, worship, and mission in the world.", descKo: "지역 교회는 제자훈련과 예배, 그리고 세상을 향한 선교를 위해 하나님께서 세우신 공동체임을 믿습니다." },
  { titleEn: "Prayer", titleKo: "기도", descEn: "We believe prayer is the foundation of all we do — connecting us to God and one another.", descKo: "기도는 우리가 하는 모든 일의 기초이며, 우리를 하나님과 서로에게 연결해 준다고 믿습니다." },
  { titleEn: "Mission", titleKo: "선교", descEn: "We are called to make disciples of all nations, sharing the good news of Jesus with our city and the world.", descKo: "우리의 도시와 세상에 예수님의 복음을 전하며 모든 민족을 제자로 삼도록 부름받았음을 믿습니다." },
];

const MYEONGJE_IMG = "https://media.licdn.com/dms/image/v2/C5603AQGC40_2yaKGdg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1632380620884?e=2147483647&v=beta&t=znvTv-YbEaN2UHNqMDqW8Y0N5PYsy0UoDMxJ6ctj6rw";

const staff = [
  { 
    nameEn: "Pastor Hunsuk Lee", 
    nameKo: "이헌석 목사",
    roleEn: "Lead Pastor", 
    roleKo: "담임목사",
    img: PASTOR_IMG, 
    bioEn: "I believe the true pastor of our church is Jesus Christ. In every decision and direction, I seek to place Jesus first. I hope to follow the Good Shepherd faithfully alongside the other sheep in our congregation.",
    bioKo: "저는 우리 교회의 참된 담임목사는 예수 그리스도라고 믿습니다. 사역의 방향을 정하고 중요한 사안을 결정할 때마다 언제나 예수님을 가장 우선에 두고자 합니다. 교회의 머리 되시는 예수님을 따라 다른 양들과 함께 온전한 마음으로 걸어가기를 소망합니다.",
    educationEn: "Master of Architecture, UC Berkeley | Master of Divinity, Gateway Seminary",
    educationKo: "건축학 석사, UC Berkeley | 목회학 석사, Gateway Seminary",
    ministryEn: "Bridgeway Baptist Church, Palo Alto (Associate Pastor) | Graceway Baptist Church, Fremont (Lead Pastor)",
    ministryKo: "Bridgeway Baptist Church, Palo Alto 전도사 | Graceway Baptist Church, Fremont 담임목사",
  },
  { nameEn: "Pastor MyeongJe Cho", nameKo: "조명제 목사", roleEn: "Pastoral Staff", roleKo: "목회 스태프", img: MYEONGJE_IMG },
];

export default function About() {
  const { lang, t } = useLang();
  const isKo = lang === "ko";
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
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{t("about.whoWeAre")}</p>
          <h1
            className="text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            {t("about.title")}
          </h1>
          <div className="gold-rule w-16 mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{t("about.ourStory")}</p>
              <h2
                className="text-[#17324D] mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {isKo ? <>은혜 위에 세워지고,<br />공동체로 이루어진 교회</> : <>Founded on Grace,<br />Built on Community</>}
              </h2>
              <div className="gold-rule-solid w-12 mb-6" />
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                {isKo
                  ? "그레이스웨이 침례교회는 삶의 다양한 자리에서 온 이들이 하나님의 은혜를 만나고 진실한 공동체를 경험할 수 있는 곳이 되기를 바라는 단순하지만 깊은 비전에서 시작되었습니다. 처음부터 우리는 성경의 권위, 복음의 중심성, 그리고 진정한 관계의 힘을 소중히 여겨 왔습니다."
                  : "Graceway Baptist Church was founded with a simple yet profound vision: to be a place where people from all walks of life could encounter the grace of God and find genuine community. From our earliest days, we have been committed to the authority of Scripture, the centrality of the gospel, and the power of authentic relationships."}
              </p>
              <p className="text-[#242A30]/70 leading-relaxed mb-4">
                {isKo
                  ? "다문화 공동체로서 우리는 서로의 다양성을 기뻐하며, 그리스도의 몸이 하나님의 가족의 풍성함을 드러낼 때 가장 아름답다고 믿습니다. 우리는 한국어와 영어로 예배드리며, 진리와 은혜, 그리고 소속감을 찾는 모든 분을 환영합니다."
                  : "As a multicultural congregation, we celebrate the diversity of our community and believe that the body of Christ is most beautiful when it reflects the full breadth of God's family. We worship in English and Korean, and we welcome all who are seeking truth, grace, and belonging."}
              </p>
              <p className="text-[#242A30]/70 leading-relaxed">
                {isKo
                  ? "오늘도 그레이스웨이는 이웃과 도시, 그리고 세상을 향해 제자훈련과 예배와 섬김에 헌신하는 공동체로 자라가고 있습니다."
                  : "Today, Graceway continues to grow as a congregation committed to discipleship, worship, and service — in our neighborhood, our city, and beyond."}
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
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{t("about.doctrine")}</p>
            <h2
              className="text-[#17324D]"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
            >
              {t("about.whatWeBelieve")}
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
                  {isKo ? b.titleKo : b.titleEn}
                </h3>
                <p className="text-[#242A30]/65 text-sm leading-relaxed">{isKo ? b.descKo : b.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-[#17324D]">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{t("about.leadership")}</p>
            <h2
              className="text-white"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}
            >
              {t("about.leadershipTitle")}
            </h2>
            <div className="gold-rule w-16 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {staff.map((s, i) => (
              <div key={i} className="group">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#C9973E]/30 group-hover:border-[#C9973E] transition-colors duration-300">
                    <img src={s.img} alt={isKo ? s.nameKo : s.nameEn} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                  </div>
                  <h3
                    className="text-white font-semibold text-lg"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {isKo ? s.nameKo : s.nameEn}
                  </h3>
                  <p className="text-[#C9973E] text-xs tracking-wide mt-1">{isKo ? s.roleKo : s.roleEn}</p>
                </div>
                {s.bioEn && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                    <p className="text-white/80 text-sm leading-relaxed italic">“{isKo ? s.bioKo : s.bioEn}”</p>
                    {s.educationEn && (
                      <div>
                        <p className="text-[#C9973E] text-xs tracking-wide uppercase font-semibold mb-2">{isKo ? "학력" : "Education"}</p>
                        <p className="text-white/70 text-sm">{isKo ? s.educationKo : s.educationEn}</p>
                      </div>
                    )}
                    {s.ministryEn && (
                      <div>
                        <p className="text-[#C9973E] text-xs tracking-wide uppercase font-semibold mb-2">{isKo ? "사역 이력" : "Ministry Experience"}</p>
                        <p className="text-white/70 text-sm">{isKo ? s.ministryKo : s.ministryEn}</p>
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
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">{t("about.joinUs")}</p>
          <h2
            className="text-[#17324D] mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700 }}
          >
            {t("about.joinCTA")}
          </h2>
          <p className="text-[#242A30]/60 mb-8 text-sm leading-relaxed">
            {t("about.joinDesc")}
          </p>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200"
          >
            {t("nav.planVisit")} <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

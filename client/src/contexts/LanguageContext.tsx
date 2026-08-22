/*
 * LanguageContext — Graceway Baptist Church
 * Provides KO/EN language toggle across all pages
 */
import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "ko";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.about": { en: "About", ko: "소개" },
  "nav.sermons": { en: "Sermons", ko: "설교" },
  "nav.ministries": { en: "Ministries", ko: "사역" },
  "nav.connect": { en: "Connect", ko: "문의" },
  "nav.planVisit": { en: "Plan a Visit", ko: "방문 안내" },

  // Home — Hero
  "home.welcomeTo": { en: "Welcome to", ko: "오신 것을 환영합니다" },
  "home.heroTitle1": { en: "Graceway", ko: "그레이스웨이" },
  "home.heroTitle2": { en: "Baptist Church", ko: "침례교회" },
  "home.heroSubtitle": {
    en: "A community where grace meets everyday life. We encourage one another to follow Jesus Christ and invite others to follow him.",
    ko: "은혜가 일상과 만나는 공동체입니다. 우리는 서로 예수 그리스도를 따르도록 격려하며, 더 많은 이들을 그분께로 초대합니다.",
  },
  "home.planVisit": { en: "Plan a Visit", ko: "방문 안내" },
  "home.watchSermons": { en: "Watch Sermons", ko: "설교 보기" },

  // Home — Service times
  "home.sundayWorship": { en: "Sunday Worship", ko: "주일 예배" },
  "home.wednesdayBible": { en: "Wednesday Prayer Meeting", ko: "수요 기도회" },
  "home.midweekStudy": { en: "Midweek Study", ko: "주중 성경 공부" },

  // Home — Story section
  "home.ourStory": { en: "Our Story", ko: "우리 이야기" },
  "home.storyHeadline": {
    en: "Grace is not a destination — it's the way.",
    ko: "은혜는 목적지가 아닙니다 — 그것이 바로 길입니다.",
  },
  "home.storyBody1": {
    en: "Graceway Baptist Church is a welcoming, multi-cultural congregation rooted in the Word of God. We believe that every person is created in the image of God and deserves to experience his grace, love, and community.",
    ko: "그레이스웨이 침례교회는 하나님의 말씀에 뿌리를 둔 다문화 공동체입니다. 모든 사람은 하나님의 형상대로 지음 받았으며, 그분의 은혜와 사랑과 공동체를 경험할 자격이 있다고 믿습니다.",
  },
  "home.storyBody2": {
    en: "Whether you're exploring faith for the first time or looking for a church home — we dream of being a united community that proclaims the Word, loves one another, and serves the next generation and the nations.",
    ko: "처음으로 신앙을 탐구하시든, 예배드릴 교회를 찾고 계시든지 — 주님의 은혜가 가득한 예배 가운데 주님의 말씀이 선포되고 주님의 사랑으로 서로를 사랑하는 하나된 공동체를 이루어 다음세대와 열방을 섬기는 교회를 꿈꾸고 있습니다.",
  },
  "home.learnMore": { en: "Learn More About Us", ko: "더 알아보기" },

  // Home — Sermons
  "home.recentSermons": { en: "Recent Sermons", ko: "최근 설교" },
  "home.messages": { en: "Messages", ko: "말씀" },
  "home.viewAll": { en: "View All", ko: "전체 보기" },

  // Home — Ministries
  "home.ministriesTitle": { en: "Ministries & Community", ko: "사역 & 공동체" },
  "home.ministriesDesc": {
    en: "There's a place for everyone at Graceway. Find where you belong and how you can serve.",
    ko: "그레이스웨이에는 모두를 위한 자리가 있습니다. 당신이 속할 곳과 섬길 방법을 찾아보세요.",
  },
  "home.exploreAll": { en: "Explore All →", ko: "전체 보기 →" },
  "home.bibleStudy": { en: "Bible Study", ko: "성경 공부" },
  "home.bibleStudyDesc": { en: "Wednesday evenings — deep dive into Scripture together.", ko: "수요일 저녁 — 함께 말씀을 깊이 탐구합니다." },
  "home.smallGroups": { en: "Small Groups", ko: "소그룹" },
  "home.smallGroupsDesc": { en: "Connect in community through weekly life groups.", ko: "주간 소그룹을 통해 공동체와 연결됩니다." },
  "home.outreach": { en: "Outreach", ko: "지역 사역" },
  "home.outreachDesc": { en: "Serving our city with grace and compassion.", ko: "은혜와 사랑으로 우리 도시를 섬깁니다." },
  "home.worshipTeam": { en: "Worship Ministry Team", ko: "찬양사역팀" },
  "home.worshipTeamDesc": { en: "Join us in leading the congregation in praise.", ko: "회중을 찬양으로 인도하는 팀에 함께하세요." },

  // Home — Kids
  "home.familiesWelcome": { en: "Welcome Home", ko: "환영합니다" },
  "home.kidsTitle": { en: "Looking for a place to worship together?", ko: "함께 예배할 자리를 찾고 계신가요?" },
  "home.kidsBody": {
    en: "Whether you come on your own, with family, or with friends, you are welcome here. Join us as we worship, grow in the Word, and find meaningful community together.",
    ko: "혼자 오시든, 가족이나 친구와 함께 오시든, 그레이스웨이는 여러분을 기쁘게 맞이합니다. 함께 예배하고 말씀 안에서 자라며, 따뜻한 공동체를 만나 보세요.",
  },
  "home.learnKids": { en: "Explore Our Ministries", ko: "사역 살펴보기" },

  // Home — Events
  "home.upcomingEvents": { en: "Upcoming Events", ko: "다가오는 행사" },
  "home.calendar": { en: "Calendar", ko: "일정" },

  // Home — Newsletter
  "home.newsletter": { en: "Subscribe to Our Newsletter", ko: "뉴스레터 구독하기" },
  "home.newsletterDesc": {
    en: "Be in the know — sign up for our weekly newsletter. Read encouraging reflections, current announcements, and upcoming events.",
    ko: "최신 소식을 받아보세요 — 주간 뉴스레터를 구독하시면 격려의 말씀, 공지사항, 다가오는 행사 소식을 받아보실 수 있습니다.",
  },
  "home.emailPlaceholder": { en: "Your email address", ko: "이메일 주소" },
  "home.signUp": { en: "Sign Up", ko: "구독" },
  "home.privacyNote": {
    en: "We respect your privacy. Unsubscribe at any time.",
    ko: "개인정보를 소중히 여깁니다. 언제든지 구독 취소 가능합니다.",
  },

  // Home — Mission, Vision, Core Values
  "home.mission": { en: "Mission Statement", ko: "교회의 사명" },
  "home.missionStatement": {
    en: "Built on the Word, Worshiping through Our Lives, Sent into the World",
    ko: "말씀으로 세워지고, 삶으로 예배하며, 세상으로 보냄 받는 공동체",
  },
  "home.missionDesc": {
    en: "Grounded firmly in God's Word, we offer every part of our lives as worship. With the heart of Jesus Christ, we are joyfully sent into the world to serve.",
    ko: "우리는 하나님의 말씀으로 든든히 세워져, 일상의 모든 삶을 온전한 예배로 드리고, 예수 그리스도의 마음을 품어 다시 세상 속으로 기쁘게 보내심을 받는 공동체입니다.",
  },
  "home.vision": { en: "Vision", ko: "비전" },
  "home.visionStatement": {
    en: "Back to the Word, Back to the World",
    ko: "다시 말씀으로, 다시 세상으로",
  },
  "home.coreValues": { en: "Core Values", ko: "핵심 가치" },
  "home.value1": { en: "The Word of God", ko: "하나님의 말씀" },
  "home.value2": { en: "Worship", ko: "예배" },
  "home.value3": { en: "Christ-Centered", ko: "예수님 중심" },
  "home.value4": { en: "Church Community", ko: "교회 공동체" },
  "home.value5": { en: "Evangelism & Mission", ko: "전도/미션" },
  "home.value6": { en: "Discipleship", ko: "제자도" },
  "home.value7": { en: "Love", ko: "사랑" },

  // Footer
  "footer.tagline": { en: '"For by grace you have been saved through faith."', ko: '"너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니"' },
  "footer.verse": { en: "— Ephesians 2:8", ko: "— 에베소서 2:8" },
  "footer.quickLinks": { en: "Quick Links", ko: "바로가기" },
  "footer.serviceTimes": { en: "Service Times", ko: "예배 시간" },
  "footer.connectWithUs": { en: "Connect With Us", ko: "연락하기" },
  "footer.sundayWorship": { en: "Sunday Worship Service", ko: "주일 예배" },
  "footer.wednesdayBible": { en: "Wednesday Prayer Meeting", ko: "수요 기도회" },
  "footer.location": { en: "Location", ko: "위치" },
  "footer.copyright": { en: "© 2026 Graceway Baptist Church", ko: "© 2026 그레이스웨이 침례교회" },
  "footer.grace": { en: "Grace", ko: "은혜" },
  "footer.faith": { en: "Faith", ko: "믿음" },
  "footer.community": { en: "Community", ko: "공동체" },

  // About page
  "about.whoWeAre": { en: "Who We Are", ko: "우리는 누구인가" },
  "about.title": { en: "About Graceway", ko: "그레이스웨이 소개" },
  "about.subtitle": { en: "A community rooted in grace, growing in faith, and reaching out in love.", ko: "은혜에 뿌리를 두고, 믿음 안에서 성장하며, 사랑으로 손을 내미는 공동체." },
  "about.ourStory": { en: "Our Story", ko: "우리 이야기" },
  "about.storyHeadline": { en: "Founded on Grace, Built on Community", ko: "은혜 위에 세워지고, 공동체로 이루어진 교회" },
  "about.doctrine": { en: "Doctrine", ko: "교리" },
  "about.whatWeBelieve": { en: "What We Believe", ko: "우리가 믿는 것" },
  "about.leadership": { en: "Our Team", ko: "우리 팀" },
  "about.leadershipTitle": { en: "Leadership", ko: "리더십" },
  "about.joinUs": { en: "Join Us", ko: "함께하세요" },
  "about.joinCTA": { en: "There’s a place for you every Sunday.", ko: "매 주일, 여러분을 위한 자리가 준비되어 있습니다." },
  "about.joinDesc": { en: "We'd love to meet you. Come as you are — no perfect faith required.", ko: "있는 그대로 오세요 — 완벽한 믿음은 필요하지 않습니다." },

  // Sermons page
  "sermons.messages": { en: "Messages", ko: "말씀" },
  "sermons.title": { en: "Sermons", ko: "설교" },
  "sermons.subtitle": { en: "Explore our library of messages rooted in Scripture and relevant to everyday life.", ko: "성경에 뿌리를 두고 일상과 연결된 말씀 라이브러리를 탐색해 보세요." },
  "sermons.latestMessage": { en: "Featured Sermon", ko: "최근 설교 말씀" },
  "sermons.watchNow": { en: "Watch Now", ko: "지금 보기" },
  "sermons.searchPlaceholder": { en: "Search sermons...", ko: "설교 검색..." },
  "sermons.all": { en: "All", ko: "전체" },

  // Ministries page
  "ministries.getInvolved": { en: "Get Involved", ko: "함께하기" },
  "ministries.title": { en: "Ministries", ko: "사역" },
  "ministries.subtitle": { en: "There's a place for everyone at Graceway. Find where you belong and how you can serve.", ko: "그레이스웨이에는 모두를 위한 자리가 있습니다. 당신이 속할 곳과 섬길 방법을 찾아보세요." },
  "ministries.getInvolvedBtn": { en: "Get Involved →", ko: "함께하기 →" },
  "ministries.moreWaysToServe": { en: "More Ways to Serve", ko: "더 많은 섬김의 방법" },
  "ministries.findYourPlace": { en: "Find Your Place in Our Community", ko: "우리 공동체에서 당신의 자리를 찾으세요" },
  "ministries.findDesc": { en: "Whether you're looking to serve, grow, or simply connect — we'd love to help you find your place at Graceway.", ko: "섬기고 싶으시든, 성장하고 싶으시든, 연결되고 싶으시든 — 그레이스웨이에서 당신의 자리를 찾도록 돕겠습니다." },
  "ministries.getConnected": { en: "Get Connected →", ko: "연결되기 →" },

  // Connect page
  "connect.wedLoveToMeetYou": { en: "We'd Love to Meet You", ko: "만나고 싶습니다" },
  "connect.title": { en: "Connect With Us", ko: "연락하기" },
  "connect.subtitle": { en: "Whether you're visiting for the first time or looking to get more involved, we're here for you.", ko: "처음 방문하시든, 더 깊이 참여하고 싶으시든, 우리는 여러분을 위해 여기 있습니다." },
  "connect.planAVisit": { en: "Plan a Visit", ko: "방문 안내" },
  "connect.everySunday": { en: "There’s a place for you every Sunday.", ko: "매 주일, 여러분을 위한 자리가 준비되어 있습니다." },
  "connect.sendMessage": { en: "Send Us a Message", ko: "메시지 보내기" },
  "connect.firstTime": { en: "First Time?", ko: "처음 방문하시나요?" },
  "connect.whatToExpect": { en: "What to Expect", ko: "무엇을 기대할 수 있나요" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ko");

  const toggleLang = () => setLang((prev) => (prev === "en" ? "ko" : "en"));

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

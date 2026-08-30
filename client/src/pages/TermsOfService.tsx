import { BrandPageHero } from "@/components/BrandPageHero";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useLang } from "@/contexts/LanguageContext";

type Copy = { ko: string; en: string };

function LegalSection({ title, children }: { title: Copy; children: React.ReactNode }) {
  const { lang } = useLang();
  return <section className="border-t border-[#DCE4E7] py-7 first:border-t-0 first:pt-0"><h2 className="font-serif text-2xl font-semibold text-[#163B59]">{title[lang]}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-[#456276]">{children}</div></section>;
}

export default function TermsOfService() {
  const { lang } = useLang();
  const isKo = lang === "ko";
  return <div className="flex min-h-screen flex-col bg-[#F4F6F7]"><Navbar /><BrandPageHero eyebrow="Graceway Baptist Church" title={isKo ? "이용약관" : "Terms of service"} description={isKo ? "그레이스웨이 침례교회 웹사이트와 사진 갤러리의 책임 있는 이용을 위한 안내입니다." : "Guidance for the responsible use of the Graceway Baptist Church website and photo gallery."} visual="community" />
    <main className="container flex-1 py-12 md:py-16"><article className="mx-auto max-w-3xl rounded-lg border border-[#DCE4E7] bg-white p-6 shadow-[0_12px_30px_rgba(22,59,89,0.06)] sm:p-9"><p className="mb-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">{isKo ? "최종 업데이트 · 2026년 8월" : "Last updated · August 2026"}</p>
      <LegalSection title={{ ko: "웹사이트 이용", en: "Using this website" }}><p>{isKo ? "이 웹사이트는 그레이스웨이 침례교회의 예배, 행사, 사역 소식을 나누기 위해 제공됩니다. 방문자는 법령과 타인의 권리를 존중하며 웹사이트를 이용해야 합니다." : "This website shares worship, event, and ministry information from Graceway Baptist Church. Visitors must use it lawfully and with respect for the rights of others."}</p></LegalSection>
      <LegalSection title={{ ko: "관리자 사진 업로드", en: "Administrator photo uploads" }}><p>{isKo ? "갤러리에 사진을 올리는 관리자는 사진을 사용할 권한과 필요한 동의를 확인할 책임이 있습니다. 특히 아동, 청소년 또는 민감한 상황이 포함된 사진은 공개 전 보호자 동의와 교회 보호 정책을 확인해야 합니다." : "Administrators who upload photos are responsible for confirming their right to use the images and all required consent. Before publishing images of children, youth, or sensitive situations, they must confirm guardian consent and applicable church safeguarding practices."}</p></LegalSection>
      <LegalSection title={{ ko: "Google Photos 선택 가져오기", en: "Google Photos selected imports" }}><p>{isKo ? "Google Photos 연결은 관리자가 선택한 사진을 교회 갤러리 초안으로 가져오는 데에만 사용됩니다. 관리자는 가져오기 전 사진을 검토하고, 사이트에 공개할 사진과 앨범을 별도로 승인해야 합니다." : "Google Photos is used only to bring administrator-selected images into church-gallery drafts. Administrators must review imported photos and separately approve the images and albums that will be made public."}</p></LegalSection>
      <LegalSection title={{ ko: "콘텐츠 관리", en: "Content management" }}><p>{isKo ? "교회는 공개 콘텐츠를 수정·비공개 전환·삭제할 수 있으며, 타인의 권리 또는 교회 보호 원칙을 침해할 가능성이 있는 자료는 게시하지 않거나 제거할 수 있습니다." : "The church may edit, unpublish, or remove public content. Materials that may infringe others' rights or conflict with church safeguarding practices may be withheld or removed."}</p></LegalSection>
      <LegalSection title={{ ko: "문의", en: "Contact" }}><p>{isKo ? "이용약관이나 사진 공개에 관해 질문이 있으면 아래 이메일로 연락해 주세요." : "For questions about these terms or photo publication, please contact us."}</p><a className="font-semibold text-[#B07834] underline-offset-4 hover:underline" href="mailto:info@graceway-baptist.org">info@graceway-baptist.org</a></LegalSection>
    </article></main><Footer />
  </div>;
}

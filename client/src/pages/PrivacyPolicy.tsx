import { BrandPageHero } from "@/components/BrandPageHero";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useLang } from "@/contexts/LanguageContext";

type Copy = { ko: string; en: string };

function LegalSection({ title, children }: { title: Copy; children: React.ReactNode }) {
  const { lang } = useLang();
  return <section className="border-t border-[#DCE4E7] py-7 first:border-t-0 first:pt-0"><h2 className="font-serif text-2xl font-semibold text-[#163B59]">{title[lang]}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-[#456276]">{children}</div></section>;
}

export default function PrivacyPolicy() {
  const { lang } = useLang();
  const isKo = lang === "ko";
  return <div className="flex min-h-screen flex-col bg-[#F4F6F7]"><Navbar /><BrandPageHero eyebrow="Graceway Baptist Church" title={isKo ? "개인정보 처리방침" : "Privacy policy"} description={isKo ? "그레이스웨이 침례교회 웹사이트와 사진 갤러리 이용에 관한 개인정보 처리 원칙입니다." : "How Graceway Baptist Church handles information used through this website and photo gallery."} visual="path" />
    <main className="container flex-1 py-12 md:py-16"><article className="mx-auto max-w-3xl rounded-lg border border-[#DCE4E7] bg-white p-6 shadow-[0_12px_30px_rgba(22,59,89,0.06)] sm:p-9"><p className="mb-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#B07834]">{isKo ? "최종 업데이트 · 2026년 8월" : "Last updated · August 2026"}</p>
      <LegalSection title={{ ko: "처리하는 정보", en: "Information we handle" }}><p>{isKo ? "문의, 뉴스레터 신청, 계정 로그인 등 웹사이트 기능을 이용할 때 제공되는 이름, 이메일 주소와 메시지 내용을 처리할 수 있습니다. Google Photos 가져오기 기능을 사용할 경우, 관리자가 명시적으로 선택한 사진과 그 파일명·형식 같은 필요한 메타데이터만 처리합니다." : "When you use website features such as contact, newsletter, or account sign-in, we may handle the name, email address, and message you provide. For Google Photos imports, we handle only the photos an administrator explicitly selects and the necessary metadata, such as file name and type."}</p></LegalSection>
      <LegalSection title={{ ko: "이용 목적", en: "How information is used" }}><p>{isKo ? "제공된 정보는 문의 응답, 교회 소식 전달, 관리자 로그인, 그리고 승인된 교회 행사 사진의 갤러리 게시·관리 목적으로만 사용합니다. Google Photos 사진은 앨범 전체를 자동 수집하지 않으며, 관리자가 선택해 가져오고 공개를 승인한 사진만 사이트 갤러리에 표시됩니다." : "We use this information only to respond to enquiries, share church updates, administer sign-in, and manage approved church-event photos. Google Photos albums are not automatically collected; only images selected, imported, and approved by an administrator appear in the public gallery."}</p></LegalSection>
      <LegalSection title={{ ko: "공개 사진과 보관", en: "Published photos and retention" }}><p>{isKo ? "공개 갤러리에 게시되는 사진은 교회 예배·행사 기록을 위한 것입니다. 사진은 관리자가 삭제하거나 앨범을 비공개로 전환할 때까지 보관될 수 있습니다. 미성년자나 민감한 장면이 포함된 사진은 필요한 동의를 확인한 뒤에만 공개합니다." : "Photos displayed in the public gallery document church worship and events. They may remain available until an administrator deletes them or makes their album private. Photos of minors or sensitive situations are published only after required consent is confirmed."}</p></LegalSection>
      <LegalSection title={{ ko: "공유 및 보호", en: "Sharing and safeguards" }}><p>{isKo ? "교회는 개인정보나 선택한 사진을 판매하지 않습니다. 웹사이트 운영에 필요한 보안 저장소와 인증 서비스를 사용할 수 있으며, 접근 권한은 업무상 필요한 관리자에게 제한합니다." : "We do not sell personal information or selected photos. We may use secure storage and authentication services required to operate the website, and restrict access to administrators who need it for church operations."}</p></LegalSection>
      <LegalSection title={{ ko: "문의·삭제 요청", en: "Questions and deletion requests" }}><p>{isKo ? "개인정보 또는 공개 사진의 수정·삭제 요청은 아래 이메일로 보내 주세요. 요청 내용을 확인한 뒤 합리적인 기간 내에 답변하겠습니다." : "For a request to update or remove personal information or a public photo, please email us. We will review the request and respond within a reasonable period."}</p><a className="font-semibold text-[#B07834] underline-offset-4 hover:underline" href="mailto:info@graceway-baptist.org">info@graceway-baptist.org</a></LegalSection>
    </article></main><Footer />
  </div>;
}

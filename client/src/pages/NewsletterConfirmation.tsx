import { useState } from "react";
import { useParams } from "wouter";
import { CheckCircle2, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";

export default function NewsletterConfirmation() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLang();
  const [confirmed, setConfirmed] = useState(false);
  const mutation = trpc.newsletter.confirm.useMutation({ onSuccess: () => setConfirmed(true) });
  const ko = lang === "ko";

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />
      <main className="container flex min-h-[66vh] items-center justify-center py-16">
        <section className="w-full max-w-xl rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-7 text-center shadow-sm sm:p-10">
          {confirmed ? <CheckCircle2 className="mx-auto size-11 text-[#315C3A]" /> : <MailCheck className="mx-auto size-11 text-[#B07834]" />}
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Graceway Weekly Newsletter</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#163B59]">
            {confirmed ? (ko ? "구독이 완료되었습니다" : "Your subscription is confirmed") : (ko ? "뉴스레터 구독을 확인해 주세요" : "Confirm your newsletter subscription")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#607A91]">
            {confirmed
              ? (ko ? "앞으로 주간 주보와 주요 교회 소식을 이메일로 보내드립니다. 언제든지 수신을 취소할 수 있습니다." : "You will receive weekly bulletins and important church updates. You may unsubscribe at any time.")
              : (ko ? "이 버튼을 선택하면 이 이메일 주소로 그레이스웨이 주간 주보와 소식을 받아보실 수 있습니다." : "Select the button to receive Graceway weekly bulletins and updates at this email address.")}
          </p>
          {mutation.isError && <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{mutation.error.message}</p>}
          {!confirmed && <Button className="mt-7 bg-[#163B59] text-white hover:bg-[#245170]" disabled={!token || mutation.isPending} onClick={() => token && mutation.mutate({ token })}>
            {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
            {ko ? "구독 확인하기" : "Confirm subscription"}
          </Button>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

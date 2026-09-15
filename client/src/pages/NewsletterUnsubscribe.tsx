import { useState } from "react";
import { useParams } from "wouter";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";

export default function NewsletterUnsubscribe() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLang();
  const [unsubscribed, setUnsubscribed] = useState(false);
  const mutation = trpc.newsletter.unsubscribe.useMutation({ onSuccess: () => setUnsubscribed(true) });
  const ko = lang === "ko";

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />
      <main className="container flex min-h-[66vh] items-center justify-center py-16">
        <section className="w-full max-w-xl rounded-xl border border-[#DCE4E7] bg-[#FFFEFB] p-7 text-center shadow-sm sm:p-10">
          {unsubscribed ? <CheckCircle2 className="mx-auto size-11 text-[#315C3A]" /> : <MailX className="mx-auto size-11 text-[#B07834]" />}
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#B07834]">Graceway Weekly Newsletter</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#163B59]">
            {unsubscribed ? (ko ? "구독이 취소되었습니다" : "You have been unsubscribed") : (ko ? "뉴스레터 구독을 취소할까요?" : "Unsubscribe from the newsletter?")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#607A91]">
            {unsubscribed
              ? (ko ? "더 이상 주간 주보 이메일을 보내드리지 않습니다. 다시 구독하려면 홈페이지에서 이메일을 입력해 새 확인 절차를 진행해 주세요." : "You will no longer receive weekly bulletin emails. To rejoin, submit your email from the Home page and complete a new confirmation.")
              : (ko ? "계속하려면 아래 버튼을 선택해 주세요. 이 작업은 즉시 적용되며, 이후 주간 주보 발송 대상에서 제외됩니다." : "Select the button below to stop future weekly bulletin emails. This change takes effect immediately.")}
          </p>
          {mutation.isError && <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{mutation.error.message}</p>}
          {!unsubscribed && <Button variant="outline" className="mt-7 border-[#B07834]/50 text-[#8A6420] hover:bg-[#F6F0E5]" disabled={!token || mutation.isPending} onClick={() => token && mutation.mutate({ token })}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {ko ? "구독 취소하기" : "Unsubscribe"}
          </Button>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DailyBibleAccessPanelProps = {
  lang: "ko" | "en";
  state: "signed-out" | "non-admin";
  onLogin?: () => void;
};

export function DailyBibleAccessPanel({ lang, state, onLogin }: DailyBibleAccessPanelProps) {
  const isSignedOut = state === "signed-out";

  return (
    <Card className="brand-surface w-full rounded-xl border border-[#DCE4E7] p-7 text-center shadow-none md:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B07834]">Church Staff</p>
      {isSignedOut ? (
        <>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#163B59]">
            {lang === "ko" ? "Daily Bible 관리자 로그인" : "Daily Bible Staff Sign In"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#607A91]">
            {lang === "ko"
              ? "묵상 본문을 추가하거나 수정하려면 관리자 계정으로 로그인해 주세요."
              : "Sign in with an administrator account to add or update Daily Bible entries."}
          </p>
          <Button type="button" onClick={onLogin} className="mt-6 bg-[#163B59] hover:bg-[#245170]">
            {lang === "ko" ? "관리자 로그인" : "Sign in"}
          </Button>
        </>
      ) : (
        <p role="alert" className="mt-3 text-sm font-medium text-[#9B382F]">
          {lang === "ko" ? "이 페이지는 관리자만 이용할 수 있습니다." : "This page is available to administrators only."}
        </p>
      )}
    </Card>
  );
}

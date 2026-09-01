import React from "react";
import { Button } from "@/components/ui/button";

export function PersonalNoteRetryButton({
  lang,
  onRetry,
}: {
  lang: "ko" | "en";
  onRetry: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onRetry}
      className="h-auto px-1.5 py-1 text-xs font-semibold text-[#163B59] hover:bg-[#E8EFF2]"
    >
      {lang === "ko" ? "다시 저장" : "Retry save"}
    </Button>
  );
}

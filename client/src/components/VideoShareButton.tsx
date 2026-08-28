import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

type VideoShareButtonProps = {
  videoId: string;
  title: string;
  lang: "ko" | "en";
  contentType?: "sermon" | "worship";
  compact?: boolean;
  className?: string;
};

function videoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

/**
 * Uses the operating system's share sheet when available. On desktop and older
 * browsers it copies the canonical YouTube link, which users can paste into
 * KakaoTalk or any social platform.
 */
export function VideoShareButton({ videoId, title, lang, contentType = "sermon", compact = false, className = "" }: VideoShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!copied && !error) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [copied, error]);

  const copyLink = async () => {
    try {
      await copyToClipboard(videoUrl(videoId));
      setCopied(true);
    } catch {
      setError(true);
    }
  };

  const share = async () => {
    const url = videoUrl(videoId);
    const text = lang === "ko" ? `${title} | 그레이스웨이 침례교회` : `${title} | Graceway Baptist Church`;

    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, text, url });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      await copyLink();
    }
  };

  const videoTypeLabel = contentType === "worship"
    ? (lang === "ko" ? "찬양 영상" : "worship video")
    : (lang === "ko" ? "설교 영상" : "sermon video");
  const label = copied
    ? (lang === "ko" ? "링크가 복사되었습니다" : "Link copied")
    : (lang === "ko" ? `${videoTypeLabel} 공유하기` : `Share ${videoTypeLabel}`);
  const compactClasses = compact
    ? "px-2.5 py-1.5 text-xs"
    : "px-4 py-2.5 text-sm";

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-2 rounded-sm border border-[#163B59]/20 bg-white text-[#163B59] transition-all duration-200 hover:border-[#B9955E] hover:text-[#8B672F] active:scale-[0.97] ${compactClasses} ${className}`}
      aria-label={label}
    >
      {copied ? <Check size={compact ? 13 : 15} aria-hidden="true" /> : (typeof navigator !== "undefined" && typeof navigator.share === "function" ? <Share2 size={compact ? 13 : 15} aria-hidden="true" /> : <Link2 size={compact ? 13 : 15} aria-hidden="true" />)}
      <span>{copied ? (lang === "ko" ? "링크 복사됨" : "Link copied") : (lang === "ko" ? "공유하기" : "Share")}</span>
      <span className="sr-only" aria-live="polite">{error ? (lang === "ko" ? "링크를 복사하지 못했습니다" : "Could not copy link") : ""}</span>
    </button>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Copy, Check, Heart, Loader2, LogIn, MessageCircle, Reply, Send, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandAbstractVisual } from "@/components/BrandAbstractVisual";
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";

export default function Meditation() {
  const { lang } = useLang();
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [qtAnswers, setQtAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentOffset, setCommentOffset] = useState(0);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [hasResolvedInitialDate, setHasResolvedInitialDate] = useState(false);
  const utils = trpc.useUtils();

  // tRPC 쿼리 — 모든 묵상 데이터 로드
  const { data: allMeditations = [], isLoading } = trpc.meditation.list.useQuery(
    { limit: 100, offset: 0 },
    { staleTime: 1000 * 60 * 5 } // 5분 캐시
  );

  const currentMeditation = allMeditations.find((m) => m.meditationDate === currentDate);
  const meditationLikeInput = useMemo(
    () => ({ meditationId: currentMeditation?.id ?? 0 }),
    [currentMeditation?.id],
  );
  const meditationLikeStatus = trpc.meditation.likeStatus.useQuery(meditationLikeInput, {
    enabled: Boolean(currentMeditation?.id),
    staleTime: 1000 * 30,
  });
  const { data: commentPage, isLoading: commentsLoading, isFetching: commentsFetching } = trpc.meditation.comments.list.useQuery(
    { meditationId: currentMeditation?.id ?? 0, limit: 10, offset: commentOffset },
    { enabled: Boolean(currentMeditation?.id), staleTime: 1000 * 30 },
  );
  const comments = commentPage?.items ?? [];
  const totalComments = commentPage?.total ?? 0;
  const hasNextCommentPage = commentPage?.nextOffset !== null && commentPage?.nextOffset !== undefined;

  const createComment = trpc.meditation.comments.create.useMutation({
    onSuccess: async () => {
      setCommentDraft("");
      setReplyDraft("");
      setReplyingToId(null);
      if (currentMeditation?.id) {
        await utils.meditation.comments.list.invalidate();
      }
    },
  });

  const deleteComment = trpc.meditation.comments.delete.useMutation({
    onSuccess: async () => {
      if (currentMeditation?.id) {
        await utils.meditation.comments.list.invalidate();
      }
    },
  });

  const toggleCommentLike = trpc.meditation.comments.toggleLike.useMutation({
    onSuccess: async () => {
      await utils.meditation.comments.list.invalidate();
    },
  });

  const toggleMeditationLike = trpc.meditation.toggleLike.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.meditation.likeStatus.invalidate(),
        utils.meditation.list.invalidate(),
      ]);
    },
  });

  // If a devotion has not yet been published for the current day, start the
  // visitor at the newest available meditation instead of an empty page.
  useEffect(() => {
    if (isLoading || hasResolvedInitialDate || allMeditations.length === 0) return;
    if (!allMeditations.some((meditation) => meditation.meditationDate === currentDate)) {
      setCurrentDate(allMeditations[0].meditationDate);
    }
    setHasResolvedInitialDate(true);
  }, [allMeditations, currentDate, hasResolvedInitialDate, isLoading]);

  useEffect(() => {
    setCommentOffset(0);
    setReplyingToId(null);
    setReplyDraft("");
  }, [currentMeditation?.id]);

  // localStorage에서 QT 답변 로드
  useEffect(() => {
    const saved = localStorage.getItem(`qt_${currentDate}`);
    if (saved) {
      setQtAnswers(JSON.parse(saved));
    } else {
      setQtAnswers({ q1: "", q2: "", q3: "" });
    }
  }, [currentDate]);

  // QT 답변 저장
  const handleQtChange = (key: string, value: string) => {
    const updated = { ...qtAnswers, [key]: value };
    setQtAnswers(updated);
    localStorage.setItem(`qt_${currentDate}`, JSON.stringify(updated));
  };

  // 날짜 네비게이션
  const handlePrevDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  // 구절 복사
  const handleCopyVerse = (verse: string) => {
    navigator.clipboard.writeText(verse);
    setCopiedVerse(verse);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentMeditation || !commentDraft.trim() || createComment.isPending) return;
    createComment.mutate({
      meditationId: currentMeditation.id,
      content: commentDraft,
    });
  };

  const handleReplySubmit = (event: React.FormEvent<HTMLFormElement>, parentCommentId: number) => {
    event.preventDefault();
    if (!currentMeditation || !replyDraft.trim() || createComment.isPending) return;
    createComment.mutate({
      meditationId: currentMeditation.id,
      parentCommentId,
      content: replyDraft,
    });
  };

  const handleToggleCommentLike = (commentId: number) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    toggleCommentLike.mutate({ id: commentId });
  };

  const handleToggleMeditationLike = () => {
    if (!currentMeditation) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    toggleMeditationLike.mutate({ meditationId: currentMeditation.id });
  };

  const formatCommentDate = (value: Date | string) =>
    new Date(value).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // 성경 본문 파싱
  const parseScripture = (text: string) => {
    if (!text) return [];
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const match = line.match(/^(\d+:\d+)\s+(.+)$/);
      if (match) {
        return { verse: match[1], text: match[2] };
      }
      return { verse: "", text: line };
    });
  };

  // 캘린더 생성
  const generateCalendar = () => {
    const today = new Date(currentDate);
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendar();
  const today = new Date(currentDate);
  const year = today.getFullYear();
  const month = today.getMonth();
  const calendarWeekdays =
    lang === "ko"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleCalendarDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate.toISOString().split("T")[0]);
    setShowCalendar(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (lang === "ko") {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getDayOfYear = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const hasEnglishContent = Boolean(
    currentMeditation?.scriptureReferenceEn &&
      currentMeditation?.scriptureTextEn &&
      currentMeditation?.titleEn &&
      currentMeditation?.contentEn
  );
  const displayMeditation =
    currentMeditation && lang === "en" && hasEnglishContent
      ? {
          ...currentMeditation,
          scriptureReference: currentMeditation.scriptureReferenceEn!,
          scriptureText: currentMeditation.scriptureTextEn!,
          title: currentMeditation.titleEn!,
          content: currentMeditation.contentEn!,
        }
      : currentMeditation;
  const scriptures = displayMeditation ? parseScripture(displayMeditation.scriptureText) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[#FCFAF6]">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 pt-24 md:pt-28">
        {/* 헤더 */}
        <div className="mb-7 mt-7 flex items-center gap-3 md:mt-10">
          <span className="h-px w-9 bg-[#B9955E]" />
          <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#607A91]">
            {lang === "ko" ? "매일 말씀과 함께 묵상하는 시간" : "Meditate on God's Word daily"}
          </p>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="brand-surface relative mb-8 flex items-center justify-between overflow-hidden rounded-xl border border-[#DCE4E7] p-5 md:p-6">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-44 opacity-[0.11]">
            <BrandAbstractVisual kind="word" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={isLoading}
            className="relative border-[#B7C5CD] bg-white/75 text-[#163B59] hover:bg-[#EEF3F5]"
            aria-label={lang === "ko" ? "이전 묵상" : "Previous meditation"}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="relative flex-1 text-center">
            <h2 className="mb-1 text-xl font-bold text-[#163B59]">
              {formatDate(currentDate)}
            </h2>
            <p className="text-xs text-[#607A91]">
              {lang === "ko" ? `연중 ${getDayOfYear(currentDate)}일` : `Day ${getDayOfYear(currentDate)} of 365`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
              className="mt-2 text-[#607A91] hover:bg-[#E8EFF2] hover:text-[#163B59]"
              aria-expanded={showCalendar}
            >
              {lang === "ko" ? "📅 캘린더" : "📅 Calendar"}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={isLoading}
            className="relative border-[#B7C5CD] bg-white/75 text-[#163B59] hover:bg-[#EEF3F5]"
            aria-label={lang === "ko" ? "다음 묵상" : "Next meditation"}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 캘린더 뷰 */}
        {showCalendar && (
          <Card className="brand-surface mb-8 rounded-xl border-[#DCE4E7] p-6 shadow-none">
            <div className="grid grid-cols-7 gap-2">
              {calendarWeekdays.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-semibold text-[#607A91]">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => day && handleCalendarDateClick(day)}
                  disabled={!day}
                  className={`p-2 text-sm rounded ${
                    !day
                      ? "bg-transparent"
                      : currentDate === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      ? "bg-[#163B59] text-white font-bold"
                      : allMeditations.some(
                          (m) =>
                            m.meditationDate ===
                            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        )
                      ? "cursor-pointer bg-[#E7EEF1] text-[#163B59] hover:bg-[#D7E3E8]"
                      : "cursor-pointer bg-[#F3F1EC] text-[#8B9297] hover:bg-[#EAE6DC]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{lang === "ko" ? "로딩 중..." : "Loading..."}</p>
          </div>
        ) : !currentMeditation ? (
          <div className="brand-surface rounded-xl border border-[#DCE4E7] py-12 text-center">
            <p className="text-[#607A91]">
              {lang === "ko" ? "이 날짜의 묵상이 없습니다." : "No meditation for this date."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 (2/3) */}
            <div className="lg:col-span-2">
              <Card className="brand-surface rounded-xl border-[#DCE4E7] p-6 shadow-none md:p-8">
                <div className="mb-3">
                  <p className="mb-1 text-sm font-semibold text-[#B07834]">
                    {lang === "ko" ? "개역개정" : hasEnglishContent ? "English translation" : "Revised Korean Version"}
                  </p>
                  <h3 className="mb-1 text-2xl font-bold text-[#163B59]">
                    {displayMeditation?.scriptureReference}
                  </h3>
                  <p className="mb-3 text-[#607A91]">{displayMeditation?.title}</p>
                  <button
                    type="button"
                    onClick={handleToggleMeditationLike}
                    disabled={toggleMeditationLike.isPending || meditationLikeStatus.isLoading}
                    aria-label={lang === "ko" ? `오늘의 묵상 공감 ${meditationLikeStatus.data?.likeCount ?? 0}` : `Like today's meditation, ${meditationLikeStatus.data?.likeCount ?? 0} likes`}
                    aria-pressed={meditationLikeStatus.data?.hasLiked ?? false}
                    className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      meditationLikeStatus.data?.hasLiked
                        ? "border-[#C9973E]/40 bg-[#C9973E]/15 text-[#8A6420]"
                        : "border-[#DCE4E7] bg-white text-[#607A91] hover:border-[#C9973E]/45 hover:bg-[#C9973E]/8 hover:text-[#8A6420]"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${meditationLikeStatus.data?.hasLiked ? "fill-current" : ""}`} />
                    {lang === "ko" ? "공감" : "Like"}
                    <span aria-live="polite">{meditationLikeStatus.data?.likeCount ?? 0}</span>
                  </button>
                  {lang === "en" && !hasEnglishContent && (
                    <p className="mb-3 rounded-md border border-[#C9973E]/25 bg-[#FBF8F3] px-3 py-2 text-xs leading-relaxed text-[#6A5734]">
                      This entry is currently available in Korean only. Add all four English fields in Daily Bible Management to publish its English version.
                    </p>
                  )}
                </div>

                <div className="space-y-1 mb-8">
                  {scriptures.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-3 rounded-md p-2 transition hover:bg-[#EEF3F5]"
                      onMouseEnter={() => {}}
                    >
                      {item.verse && (
                        <span className="min-w-fit font-semibold text-[#B07834]">{item.verse}</span>
                      )}
                      <span className="flex-1 text-[#2E3A46]">{item.text}</span>
                      {item.verse && (
                        <button
                          onClick={() => handleCopyVerse(`${item.verse} ${item.text}`)}
                          className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={lang === "ko" ? `${item.verse} 구절 복사` : `Copy verse ${item.verse}`}
                        >
                          {copiedVerse === `${item.verse} ${item.text}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 묵상 나눔 댓글 */}
                <section className="border-t pt-6" aria-labelledby="meditation-comments-title">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#C9973E]" aria-hidden="true" />
                      <h4 id="meditation-comments-title" className="font-semibold text-[#163B59]">
                        {lang === "ko" ? "묵상 나눔" : "Meditation Sharing"}
                      </h4>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {totalComments} {lang === "ko" ? "개의 나눔" : "shared"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6" aria-live="polite">
                    {commentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === "ko" ? "나눔을 불러오는 중..." : "Loading reflections..."}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="rounded-lg bg-[#EEF3F5] p-5 text-sm text-[#607A91]">
                        {lang === "ko"
                          ? "아직 나눔이 없습니다. 말씀을 통해 받은 은혜를 첫 번째로 나누어 주세요."
                          : "No reflections have been shared yet. Be the first to share what you received from the Word."}
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const mayDelete = user && (user.id === comment.authorId || user.role === "admin");
                        return (
                          <article key={comment.id} className="rounded-lg border border-[#DCE4E7] bg-white/80 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <p className="font-semibold text-sm text-[#17324D]">
                                  {comment.authorName || (lang === "ko" ? "이름 없는 성도" : "Church member")}
                                </p>
                                <time className="text-xs text-gray-500" dateTime={new Date(comment.createdAt).toISOString()}>
                                  {formatCommentDate(comment.createdAt)}
                                </time>
                              </div>
                              {mayDelete && (
                                <button
                                  type="button"
                                  aria-label={lang === "ko" ? "나눔 삭제" : "Delete reflection"}
                                  onClick={() => deleteComment.mutate({ id: comment.id })}
                                  disabled={deleteComment.isPending}
                                  className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#44515C]">{comment.content}</p>

                            <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => handleToggleCommentLike(comment.id)}
                                disabled={toggleCommentLike.isPending}
                                aria-label={lang === "ko" ? `나눔 공감 ${comment.likeCount}` : `Like reflection, ${comment.likeCount} likes`}
                                aria-pressed={comment.hasLiked}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition disabled:opacity-50 ${
                                  comment.hasLiked
                                    ? "bg-[#C9973E]/15 text-[#9B6817]"
                                    : "text-gray-500 hover:bg-[#C9973E]/10 hover:text-[#9B6817]"
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${comment.hasLiked ? "fill-current" : ""}`} />
                                {lang === "ko" ? "공감" : "Like"} {comment.likeCount > 0 ? comment.likeCount : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    startLogin();
                                    return;
                                  }
                                  setReplyingToId((activeId) => (activeId === comment.id ? null : comment.id));
                                  setReplyDraft("");
                                }}
                                aria-expanded={replyingToId === comment.id}
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-gray-500 transition hover:bg-[#17324D]/5 hover:text-[#17324D]"
                              >
                                <Reply className="w-3.5 h-3.5" />
                                {lang === "ko" ? "답글" : "Reply"}
                              </button>
                            </div>

                            {comment.replies.length > 0 && (
                              <div className="ml-2 sm:ml-6 mt-4 space-y-3 border-l-2 border-[#C9973E]/20 pl-4">
                                {comment.replies.map((reply) => {
                                  const mayDeleteReply = user && (user.id === reply.authorId || user.role === "admin");
                                  return (
                                    <article key={reply.id} className="rounded-md bg-[#F4F6F7] px-3.5 py-3">
                                      <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <div>
                                          <p className="font-semibold text-xs text-[#17324D]">
                                            {reply.authorName || (lang === "ko" ? "이름 없는 성도" : "Church member")}
                                          </p>
                                          <time className="text-[11px] text-gray-500" dateTime={new Date(reply.createdAt).toISOString()}>
                                            {formatCommentDate(reply.createdAt)}
                                          </time>
                                        </div>
                                        {mayDeleteReply && (
                                          <button
                                            type="button"
                                            aria-label={lang === "ko" ? "답글 삭제" : "Delete reply"}
                                            onClick={() => deleteComment.mutate({ id: reply.id })}
                                            disabled={deleteComment.isPending}
                                            className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{reply.content}</p>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCommentLike(reply.id)}
                                        disabled={toggleCommentLike.isPending}
                                        aria-label={lang === "ko" ? `답글 공감 ${reply.likeCount}` : `Like reply, ${reply.likeCount} likes`}
                                        aria-pressed={reply.hasLiked}
                                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium transition disabled:opacity-50 ${
                                          reply.hasLiked ? "bg-[#C9973E]/15 text-[#9B6817]" : "text-gray-500 hover:bg-[#C9973E]/10 hover:text-[#9B6817]"
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${reply.hasLiked ? "fill-current" : ""}`} />
                                        {lang === "ko" ? "공감" : "Like"} {reply.likeCount > 0 ? reply.likeCount : ""}
                                      </button>
                                    </article>
                                  );
                                })}
                              </div>
                            )}

                            {replyingToId === comment.id && isAuthenticated && (
                              <form onSubmit={(event) => handleReplySubmit(event, comment.id)} className="mt-4 ml-2 rounded-md border border-[#DCE4E7] bg-[#EEF3F5] p-3 sm:ml-6 [&_textarea]:border-[#C8D4D9] [&_textarea]:bg-white [&_textarea]:focus-visible:ring-[#607A91]">
                                <label htmlFor={`reply-${comment.id}`} className="sr-only">
                                  {lang === "ko" ? "답글 작성" : "Write a reply"}
                                </label>
                                <Textarea
                                  id={`reply-${comment.id}`}
                                  value={replyDraft}
                                  onChange={(event) => setReplyDraft(event.target.value)}
                                  maxLength={1200}
                                  placeholder={lang === "ko" ? "서로를 세우는 마음으로 답글을 남겨 주세요." : "Leave an encouraging reply."}
                                  className="min-h-20 resize-y bg-white text-sm"
                                  autoFocus
                                />
                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <p className="text-[11px] text-gray-500">{replyDraft.length}/1200</p>
                                  <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setReplyingToId(null)}>
                                      {lang === "ko" ? "취소" : "Cancel"}
                                    </Button>
                                    <Button type="submit" size="sm" disabled={!replyDraft.trim() || createComment.isPending} className="bg-[#163B59] hover:bg-[#245170]">
                                      {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      {lang === "ko" ? "답글 등록" : "Reply"}
                                    </Button>
                                  </div>
                                </div>
                              </form>
                            )}
                          </article>
                        );
                      })
                    )}
                  </div>

                  {totalComments > 10 && (
                    <div className="mb-6 flex items-center justify-center gap-2">
                      {commentOffset > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCommentOffset(Math.max(0, commentOffset - 10))}
                          disabled={commentsFetching}
                        >
                          {lang === "ko" ? "이전 댓글" : "Previous"}
                        </Button>
                      )}
                      {hasNextCommentPage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCommentOffset(commentPage?.nextOffset ?? commentOffset)}
                          disabled={commentsFetching}
                        >
                          {commentsFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {lang === "ko" ? "댓글 더보기" : "Show more"}
                        </Button>
                      )}
                    </div>
                  )}

                  {isAuthenticated ? (
                    <form onSubmit={handleCommentSubmit} className="rounded-lg border border-[#DCE4E7] bg-[#EEF3F5] p-4 [&_textarea]:border-[#C8D4D9] [&_textarea]:bg-white [&_textarea]:focus-visible:ring-[#607A91]">
                      <label htmlFor="meditation-comment" className="block text-sm font-semibold text-[#17324D] mb-2">
                        {lang === "ko" ? "말씀을 통해 받은 은혜를 나누어 주세요" : "Share your reflection from today's Word"}
                      </label>
                      <Textarea
                        id="meditation-comment"
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder={lang === "ko" ? "서로를 세우는 마음으로 나눔을 남겨 주세요." : "Leave a reflection that encourages our community."}
                        maxLength={1200}
                        className="min-h-28 resize-y bg-white"
                      />
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-500">{commentDraft.length}/1200</p>
                        <Button type="submit" size="sm" disabled={!commentDraft.trim() || createComment.isPending} className="bg-[#163B59] hover:bg-[#245170]">
                          {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {lang === "ko" ? "나눔 등록" : "Share"}
                        </Button>
                      </div>
                      {createComment.isError && (
                        <p role="alert" className="mt-3 text-sm text-red-600">
                          {lang === "ko" ? "나눔을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요." : "Your reflection could not be posted. Please try again."}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#C9973E]/25 bg-[#C9973E]/5 p-4">
                      <p className="text-sm text-[#17324D]">
                        {lang === "ko" ? "로그인하면 말씀 묵상을 나누고 서로를 격려할 수 있습니다." : "Sign in to share a reflection and encourage one another."}
                      </p>
                      <Button type="button" size="sm" variant="outline" onClick={() => startLogin()} className="shrink-0 border-[#C9973E]/50 text-[#17324D] hover:bg-[#C9973E]/10">
                        <LogIn className="w-4 h-4" />
                        {lang === "ko" ? "로그인" : "Sign in"}
                      </Button>
                    </div>
                  )}
                </section>
              </Card>
            </div>

            {/* 오른쪽: QT 질문 (1/3, sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="brand-surface rounded-xl border-[#DCE4E7] bg-white/85 p-6 shadow-none">
                  <h4 className="mb-6 font-semibold text-[#163B59]">
                    {lang === "ko" ? "묵상 질문" : "QT Questions"}
                  </h4>

                  <div className="space-y-6 [&_textarea]:border-[#C8D4D9] [&_textarea]:bg-white [&_textarea]:focus-visible:ring-[#607A91]">
                    {/* Q1 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "1. 하나님은 어떤 분?" : "1. Who is God?"}
                      </label>
                      <Textarea
                        value={qtAnswers.q1}
                        onChange={(e) => handleQtChange("q1", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>

                    {/* Q2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "2. 내게 주는 교훈은?" : "2. What is the lesson?"}
                      </label>
                      <Textarea
                        value={qtAnswers.q2}
                        onChange={(e) => handleQtChange("q2", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>

                    {/* Q3 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === "ko" ? "3. 오늘 나에게 주시는 성경 구절" : "3. Today's verse for me"}
                      </label>
                      <Textarea
                        value={qtAnswers.q3}
                        onChange={(e) => handleQtChange("q3", e.target.value)}
                        placeholder={lang === "ko" ? "답변을 입력하세요..." : "Enter your answer..."}
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">0/500</p>
                    </div>
                  </div>

                  {/* 오디오 플레이스홀더 */}
                  <div className="mt-6 rounded-lg bg-[#EEF3F5] p-4 text-center">
                    <p className="text-sm text-[#607A91]">
                      {lang === "ko" ? "🎙️ 음성 묵상 (준비 중)" : "🎙️ Voice Meditation (Coming soon)"}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

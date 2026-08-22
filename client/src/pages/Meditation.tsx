import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Copy, Check, Heart, Loader2, LogIn, MessageCircle, Reply, Send, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
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

  const scriptures = currentMeditation ? parseScripture(currentMeditation.scriptureText) : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 pt-20">
        {/* 헤더 */}
        <div className="text-center mb-8 mt-12">
          <p className="text-gray-600">
            {lang === "ko" ? "매일 말씀과 함께 묵상하는 시간" : "Meditate on God's Word daily"}
          </p>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {formatDate(currentDate)}
            </h2>
            <p className="text-xs text-gray-600">
              {lang === "ko" ? `연중 ${getDayOfYear(currentDate)}일` : `Day ${getDayOfYear(currentDate)} of 365`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
              className="mt-2"
            >
              {lang === "ko" ? "📅 캘린더" : "📅 Calendar"}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 캘린더 뷰 */}
        {showCalendar && (
          <Card className="mb-8 p-6">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
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
                      ? "bg-blue-500 text-white font-bold"
                      : allMeditations.some(
                          (m) =>
                            m.meditationDate ===
                            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        )
                      ? "bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200"
                      : "bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200"
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
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">
              {lang === "ko" ? "이 날짜의 묵상이 없습니다." : "No meditation for this date."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 성경 본문 (2/3) */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <div className="mb-3">
                  <p className="text-sm text-amber-600 font-semibold mb-1">개역개정</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {currentMeditation.scriptureReference}
                  </h3>
                  <p className="text-gray-600 mb-3">{currentMeditation.title}</p>
                </div>

                <div className="space-y-1 mb-8">
                  {scriptures.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition"
                      onMouseEnter={() => {}}
                    >
                      {item.verse && (
                        <span className="text-amber-600 font-semibold min-w-fit">{item.verse}</span>
                      )}
                      <span className="text-gray-800 flex-1">{item.text}</span>
                      {item.verse && (
                        <button
                          onClick={() => handleCopyVerse(`${item.verse} ${item.text}`)}
                          className="opacity-0 group-hover:opacity-100 transition"
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
                      <h4 id="meditation-comments-title" className="font-semibold text-gray-900">
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
                      <div className="rounded-lg bg-[#F4F6F7] p-5 text-sm text-gray-600">
                        {lang === "ko"
                          ? "아직 나눔이 없습니다. 말씀을 통해 받은 은혜를 첫 번째로 나누어 주세요."
                          : "No reflections have been shared yet. Be the first to share what you received from the Word."}
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const mayDelete = user && (user.id === comment.authorId || user.role === "admin");
                        return (
                          <article key={comment.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
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
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{comment.content}</p>

                            <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => handleToggleCommentLike(comment.id)}
                                disabled={toggleCommentLike.isPending}
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
                              <form onSubmit={(event) => handleReplySubmit(event, comment.id)} className="mt-4 ml-2 sm:ml-6 rounded-md bg-[#F4F6F7] p-3">
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
                                    <Button type="submit" size="sm" disabled={!replyDraft.trim() || createComment.isPending} className="bg-[#17324D] hover:bg-[#244A70]">
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
                    <form onSubmit={handleCommentSubmit} className="rounded-lg bg-[#F4F6F7] p-4">
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
                        <Button type="submit" size="sm" disabled={!commentDraft.trim() || createComment.isPending} className="bg-[#17324D] hover:bg-[#244A70]">
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
                <Card className="p-6 bg-white">
                  <h4 className="font-semibold text-gray-900 mb-6">
                    {lang === "ko" ? "묵상 질문" : "QT Questions"}
                  </h4>

                  <div className="space-y-6">
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
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
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

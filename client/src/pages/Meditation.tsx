/**
 * Daily Bible Meditation Page
 * Display today's meditation and archive of past meditations
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

export default function Meditation() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's meditation
  const todayQuery = trpc.meditation.today.useQuery({ date: today });
  const todayMeditation = todayQuery.data;

  // Fetch meditation archive
  const archiveQuery = trpc.meditation.list.useQuery({ limit: 30, offset: 0 });
  const meditations = archiveQuery.data || [];

  // Create meditation mutation (admin only)
  const createMutation = trpc.meditation.create.useMutation({
    onSuccess: () => {
      todayQuery.refetch();
      archiveQuery.refetch();
      setFormData({
        meditationDate: today,
        scriptureReference: "",
        scriptureText: "",
        title: "",
        content: "",
      });
      setIsDialogOpen(false);
    },
  });

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState<any>(null);
  const [formData, setFormData] = useState({
    meditationDate: today,
    scriptureReference: "",
    scriptureText: "",
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F6F7] to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#17324D] to-[#1a4d6d]">
        <div className="relative container text-center">
          <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">
            {lang === "ko" ? "묵상" : "Meditation"}
          </p>
          <h1
            className="text-white mb-4"
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
            }}
          >
            {lang === "ko" ? "Daily Bible" : "Daily Bible"}
          </h1>
          <div className="w-16 h-0.5 bg-[#C9973E] mx-auto mb-4" />
          <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
            {lang === "ko"
              ? "매일 생명의 삶 본문말씀을 묵상하며 말씀을 나눕니다."
              : "Daily devotional readings and reflections on Scripture."}
          </p>
        </div>
      </section>

      {/* Today's Meditation */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-2">
                {lang === "ko" ? "오늘의 말씀" : "Today's Meditation"}
              </p>
              <h2
                className="text-[#17324D]"
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 700,
                }}
              >
                {today}
              </h2>
            </div>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C9973E] hover:bg-[#b8862f] text-white gap-2">
                    <Plus className="w-4 h-4" />
                    {lang === "ko" ? "묵상 작성" : "Create Meditation"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {lang === "ko" ? "새 묵상 작성" : "Create New Meditation"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        {lang === "ko" ? "날짜" : "Date"}
                      </label>
                      <Input
                        type="date"
                        value={formData.meditationDate}
                        onChange={(e) =>
                          setFormData({ ...formData, meditationDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {lang === "ko" ? "성경 구절" : "Scripture Reference"}
                      </label>
                      <Input
                        placeholder="e.g., John 3:16"
                        value={formData.scriptureReference}
                        onChange={(e) =>
                          setFormData({ ...formData, scriptureReference: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {lang === "ko" ? "성경 본문" : "Scripture Text"}
                      </label>
                      <Textarea
                        placeholder={lang === "ko" ? "성경 본문을 입력하세요" : "Enter scripture text"}
                        value={formData.scriptureText}
                        onChange={(e) =>
                          setFormData({ ...formData, scriptureText: e.target.value })
                        }
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {lang === "ko" ? "제목" : "Title"}
                      </label>
                      <Input
                        placeholder={lang === "ko" ? "묵상 제목" : "Meditation title"}
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {lang === "ko" ? "묵상 내용" : "Meditation Content"}
                      </label>
                      <Textarea
                        placeholder={lang === "ko" ? "묵상 내용을 입력하세요" : "Enter meditation content"}
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        rows={6}
                        required
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        {lang === "ko" ? "취소" : "Cancel"}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="bg-[#C9973E] hover:bg-[#b8862f]"
                      >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {lang === "ko" ? "저장" : "Save"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {todayQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#C9973E]" />
            </div>
          ) : todayMeditation ? (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8">
              <div className="mb-6">
                <p className="text-[#C9973E] text-sm font-semibold mb-2">
                  {todayMeditation.scriptureReference}
                </p>
                <h3
                  className="text-[#17324D] mb-4"
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                  }}
                >
                  {todayMeditation.title}
                </h3>
              </div>

              <div className="mb-6 p-4 bg-[#F9F5F0] border-l-4 border-[#C9973E] rounded">
                <p className="text-[#17324D] leading-relaxed whitespace-pre-wrap">
                  {todayMeditation.scriptureText}
                </p>
              </div>

              <div className="prose prose-sm max-w-none mb-8">
                <p className="text-[#17324D] leading-relaxed whitespace-pre-wrap">
                  {todayMeditation.content}
                </p>
              </div>

              {/* Today's Prayer */}
              <div className="border-t border-[#E5E7EB] pt-8">
                <h4 className="text-[#17324D] font-semibold mb-4">
                  {lang === "ko" ? "오늘의 기도" : "Today's Prayer"}
                </h4>
                <p className="text-[#17324D] leading-relaxed whitespace-pre-wrap text-sm">
                  {lang === "ko"
                    ? "하나님, 그리스도의 십자가 공로로 언제든 하나님 보좌 앞에 나아갈 수 있게 하신 은혜가 얼마나 놀라운지요. 세상을 좇고 제 뜻을 고집하다 무너진 삶의 자리에 하나님 뜻이 이루어지길 간구합니다. 에덴의 기쁨을 회복하고, 하나님의 영광을 위해 살아가도록 저를 이끌어 주소서."
                    : "Lord, what a wonderful grace that through Christ's cross, we can always approach Your throne. I pray that Your will be done in the places where my life has crumbled from pursuing the world and my own desires. Restore the joy of Eden and lead me to live for Your glory."}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#F4F6F7] rounded-lg p-12 text-center">
              <p className="text-[#17324D]/70">
                {lang === "ko"
                  ? "오늘의 묵상이 아직 준비되지 않았습니다."
                  : "Today's meditation is not yet available."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Meditation Archive */}
      <section className="py-16 bg-[#F4F6F7]">
        <div className="container">
          <div className="mb-8">
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold mb-2">
              {lang === "ko" ? "지난 묵상" : "Meditation Archive"}
            </p>
            <h2
              className="text-[#17324D]"
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                fontWeight: 700,
              }}
            >
              {lang === "ko" ? "" : "Past Meditations"}
            </h2>
          </div>

          {archiveQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#C9973E]" />
            </div>
          ) : meditations.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {meditations.map((meditation) => (
                <div
                  key={meditation.id}
                  onClick={() => setSelectedMeditation(meditation)}
                  className="bg-white rounded-lg p-6 border border-[#E5E7EB] hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <p className="text-[#C9973E] text-xs font-semibold mb-2">
                    {meditation.meditationDate}
                  </p>
                  <p className="text-[#C9973E] text-sm font-semibold mb-3">
                    {meditation.scriptureReference}
                  </p>
                  <h3 className="text-[#17324D] font-semibold mb-3 line-clamp-2">
                    {meditation.title}
                  </h3>
                  <p className="text-[#17324D]/70 text-sm line-clamp-3">
                    {meditation.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-[#17324D]/70">
                {lang === "ko" ? "묵상이 없습니다." : "No meditations available."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Meditation Detail Modal */}
      {selectedMeditation && (
        <Dialog open={!!selectedMeditation} onOpenChange={(open) => !open && setSelectedMeditation(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#17324D]">
                {selectedMeditation.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-[#C9973E] text-sm font-semibold mb-2">
                  {selectedMeditation.meditationDate}
                </p>
                <p className="text-[#C9973E] text-sm font-semibold mb-4">
                  {selectedMeditation.scriptureReference}
                </p>
              </div>
              <div className="p-4 bg-[#F9F5F0] border-l-4 border-[#C9973E] rounded">
                <p className="text-[#17324D] leading-relaxed whitespace-pre-wrap text-sm">
                  {selectedMeditation.scriptureText}
                </p>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-[#17324D] leading-relaxed whitespace-pre-wrap">
                  {selectedMeditation.content}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

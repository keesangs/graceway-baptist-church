// Verified hosted Inworld schema: text maxLength is 2,000 characters.
// Do not silently split/truncate an operator-selected paragraph.
export const MAX_TRANSCRIPT_FEED_CHARS = 2000;
export function normalizeTranscriptFeed(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
export function prepareTranscriptFeed(text: string) {
  const paragraph = normalizeTranscriptFeed(text);
  if (!paragraph) throw new Error("송출할 문단이 비어 있습니다.");
  if (paragraph.length > MAX_TRANSCRIPT_FEED_CHARS) throw new Error("한 문단 전체 합성은 최대 2,000자입니다. 원고에서 의미 단위로 문단을 나눠 다시 가져와 주세요. 자동으로 문장을 자르거나 내용을 생략하지 않습니다.");
  return paragraph;
}

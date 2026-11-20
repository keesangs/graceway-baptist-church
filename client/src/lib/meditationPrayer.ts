/** Display the existing public meditation content as prayer; never rewrite storage. */
export function getMeditationPrayerBody(content: string | null | undefined): string {
  // Older entries include their own heading, on a line or before an em dash.
  // Remove only a recognized leading label, keeping the actual prayer verbatim.
  return (content ?? "").trim().replace(
    /^(?:오늘의 기도|Today['’]s Prayer)(?=\s|[:：—–-]|$)[\t ]*(?:[:：—–-][\t ]*)?(?:\r?\n)?/i,
    "",
  ).trim();
}

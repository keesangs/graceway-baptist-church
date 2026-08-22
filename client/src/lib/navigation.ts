/** Restores the expected initial scroll position after an internal route change. */
export function scrollPageToTop() {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

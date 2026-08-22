import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollPageToTop } from "@/lib/navigation";

describe("scrollPageToTop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves an internal page transition to the top-left corner", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });

    scrollPageToTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });

  it("does nothing when rendered without a browser window", () => {
    vi.stubGlobal("window", undefined);

    expect(() => scrollPageToTop()).not.toThrow();
  });
});

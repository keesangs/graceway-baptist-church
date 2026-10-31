import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getMissingYouTubeVideoIds } from "./db";
import { getServiceDateTimestamp, sortByServiceDateDesc } from "../client/src/lib/serviceDate";

const readSource = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("YouTube maintenance contracts", () => {
  it("identifies only persisted video IDs missing from a healthy playlist response", () => {
    expect(getMissingYouTubeVideoIds(["kept", "deleted", "legacy"], ["kept", "new"])).toEqual(["deleted", "legacy"]);
    expect(getMissingYouTubeVideoIds(["legacy"], [])).toEqual(["legacy"]);
  });

  it("orders both service lists with the shared date utility", () => {
    const values = [
      { title: "2026. 10.11 주일예배", date: "October 11, 2026" },
      { title: "2026. 10.25 주일예배", date: "October 25, 2026" },
      { title: "2026. 10.18 주일예배", date: "October 18, 2026" },
    ];
    expect(sortByServiceDateDesc(values, (value) => value.title, (value) => value.date).map((value) => value.title))
      .toEqual(["2026. 10.25 주일예배", "2026. 10.18 주일예배", "2026. 10.11 주일예배"]);
    expect(getServiceDateTimestamp("2026.  09. 20 주일예배", "2026-10-01T00:00:00Z"))
      .toBe(Date.UTC(2026, 8, 20));
  });

  it("keeps the sync hidden-state and admin-only cleanup boundaries explicit", () => {
    const router = readSource("server/routers.ts");
    const db = readSource("server/db.ts");
    const admin = readSource("client/src/pages/AdminInbox.tsx");
    expect(router).toContain("hideMissingYouTubePlaylistVideos(\"sermon\"");
    expect(router).toContain("listAdmin: adminProcedure");
    expect(router).toContain("deleteHidden: adminProcedure");
    expect(db).toContain("officialCutover = new Date(\"2026-09-20T00:00:00.000Z\")");
    expect(admin).toContain("Hidden and older videos");
    expect(admin).toContain("Permanently delete");
    expect(admin).toContain("Restore");
  });
});

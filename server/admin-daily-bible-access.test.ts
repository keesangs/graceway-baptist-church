import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "client/src/pages/AdminDailyBible.tsx"),
  "utf8",
);
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("Admin Daily Bible access recovery", () => {
  it("keeps the staff route available after logout with an explicit sign-in recovery path", () => {
    expect(source).toContain('import { startLogin } from "@/const"');
    expect(source).toContain('if (!user)');
    expect(source).toContain('state="signed-out" onLogin={startLogin}');
    expect(source).toContain("DailyBibleAccessPanel");
    expect(source).not.toContain('setLocation("/")');
  });

  it("keeps the management form restricted to administrators", () => {
    expect(source).toContain('if (user.role !== "admin")');
    expect(source).toContain('state="non-admin"');
    expect(source).toContain('trpc.meditation.create.useMutation');
    expect(source).toContain('trpc.meditation.update.useMutation');
  });

  it("enforces administrator-only Daily Bible writes on the server as well", () => {
    expect(routerSource).toContain("create: adminProcedure");
    expect(routerSource).toContain("update: adminProcedure");
    expect(routerSource).toContain("delete: adminProcedure");
  });

  it("keeps a visible update success state and refreshes the management list", () => {
    expect(source).toContain('text: lang === "ko" ? "묵상이 수정되었습니다."');
    expect(source).toContain("setEditingId(null)");
    expect(source).toContain("refetch();");
  });
});

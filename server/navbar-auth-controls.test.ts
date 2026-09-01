import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const navbar = readFileSync(resolve(process.cwd(), "client/src/components/Navbar.tsx"), "utf8");
const authHook = readFileSync(resolve(process.cwd(), "client/src/_core/hooks/useAuth.ts"), "utf8");

describe("global browser authentication controls", () => {
  it("shows accessible desktop and mobile login or logout controls from shared auth state", () => {
    expect(navbar).toContain('const { user, loading, logout } = useAuth()');
    expect(navbar).toContain('onClick={startLogin}');
    expect(navbar).toContain('onClick={handleLogout}');
    expect(navbar).toContain('aria-label={lang === "ko" ? "로그아웃" : "Log out"}');
    expect(navbar).toContain('{lang === "ko" ? "로그인" : "Sign in"}');
    expect(navbar).toContain('{lang === "ko" ? "로그아웃" : "Log out"}');
  });

  it("clears the session token and private QT browser copies through the shared logout path", () => {
    expect(authHook).toContain('sessionStorage.removeItem("manus-cookie")');
    expect(authHook).toContain("clearQtBrowserCopies(localStorage)");
    expect(authHook).toContain("utils.auth.me.setData(undefined, null)");
  });
});

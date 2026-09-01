// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DailyBibleAccessPanel } from "../client/src/components/DailyBibleAccessPanel";

afterEach(cleanup);

describe("Daily Bible access panel", () => {
  it("renders a sign-in recovery action after logout", async () => {
    const onLogin = vi.fn();
    const user = userEvent.setup();

    render(createElement(DailyBibleAccessPanel, { lang: "ko", state: "signed-out", onLogin }));

    await user.click(screen.getByRole("button", { name: "관리자 로그인" }));

    expect(screen.getByRole("heading", { name: "Daily Bible 관리자 로그인" })).toBeTruthy();
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("shows a visible access denial for an authenticated non-admin member", () => {
    render(createElement(DailyBibleAccessPanel, { lang: "ko", state: "non-admin" }));

    expect(screen.getByRole("alert").textContent).toContain("이 페이지는 관리자만 이용할 수 있습니다.");
    expect(screen.queryByRole("button", { name: "관리자 로그인" })).toBeNull();
  });
});

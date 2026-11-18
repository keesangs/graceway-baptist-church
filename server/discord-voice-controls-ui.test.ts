// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  save: vi.fn(), refetch: vi.fn(), fail: false,
  controls: { speaker: "Dennis", speed: 1.1, temperature: 1.1 },
}));
vi.mock("@/lib/trpc", () => ({ trpc: { discordTts: {
  voices: { useQuery: () => ({ data: { voices: [
    { id: "Dennis", name: "Dennis", kind: "preset" }, { id: "Ashley", name: "Ashley", kind: "preset" }, { id: "custom-1", name: "Church custom", kind: "custom" },
  ], presetCount: 127, customCount: 1, source: "live", warning: null }, refetch: mocks.refetch, isFetching: false }) },
  configure: { useMutation: () => ({ mutate: (patch: object, callbacks: { onSuccess: (next: unknown) => void; onError: (error: Error) => void }) => {
    mocks.save(patch);
    if (mocks.fail) { callbacks.onError(new Error("database unavailable")); return; }
    mocks.controls = { ...mocks.controls, ...patch };
    callbacks.onSuccess({ settings: mocks.controls });
  } }) },
} } }));
import DiscordVoiceControls from "../client/src/components/DiscordVoiceControls";
beforeEach(() => { vi.stubGlobal("React", React); mocks.save.mockClear(); mocks.fail = false; mocks.controls = { speaker: "Dennis", speed: 1.1, temperature: 1.1 }; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const mount = () => render(React.createElement(DiscordVoiceControls, { settings: mocks.controls, onSaved: mocks.refetch }));

describe("voice picker and fine sliders", () => {
  it("initializes from saved server controls and shows custom voices and real control meanings", () => {
    mocks.controls = { speaker: "Ashley", speed: 1.23, temperature: 0.88 };
    mount();
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("Ashley");
    const rate = screen.getByRole("slider", { name: "말하기 속도 / Speaking rate" }) as HTMLInputElement;
    expect(rate.value).toBe("1.23"); expect(rate.step).toBe("0.01");
    expect((screen.getByRole("slider", { name: "표현·억양 변화 / Expressiveness" }) as HTMLInputElement).value).toBe("0.88");
    expect(screen.getByRole("option", { name: "Church custom" })).toBeTruthy();
    expect(screen.getByText(/감정·음높이의 정확한 지정은 아니며/)).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("applies a selected voice immediately as a partial patch", async () => {
    mount();
    await userEvent.selectOptions(screen.getByRole("combobox"), "Ashley");
    expect(mocks.save).toHaveBeenCalledWith({ speaker: "Ashley" });
    expect(screen.getByText("적용·저장 완료")).toBeTruthy();
    expect((screen.getByRole("slider", { name: "말하기 속도 / Speaking rate" }) as HTMLInputElement).value).toBe("1.1");
  });
  it("debounces multiple slider movements and saves the last precise value", async () => {
    mount();
    const rate = screen.getByRole("slider", { name: "말하기 속도 / Speaking rate" });
    fireEvent.change(rate, { target: { value: "1.12" } });
    fireEvent.change(rate, { target: { value: "1.17" } });
    expect(mocks.save).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save).toHaveBeenCalledWith({ speed: 1.17 });
  });
  it("offers 0.01 keyboard-accessible adjustments and restores Dennis / 1.10", async () => {
    mount();
    await userEvent.click(screen.getByRole("button", { name: "표현·억양 변화 / Expressiveness increase 0.01" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ temperature: 1.11 }));
    await userEvent.click(screen.getByRole("button", { name: /기본값 복원/ }));
    expect(mocks.save).toHaveBeenLastCalledWith({ speaker: "Dennis", speed: 1.1, temperature: 1.1 });
  });
  it("reports a failed save and lets the administrator retry without falsely claiming success", async () => {
    mocks.fail = true; mount();
    await userEvent.selectOptions(screen.getByRole("combobox"), "Ashley");
    expect(screen.getByRole("alert").textContent).toContain("database unavailable");
    expect(screen.queryByText("적용·저장 완료")).toBeNull();
    mocks.fail = false;
    await userEvent.click(screen.getByRole("button", { name: "다시 적용 / Retry" }));
    expect(screen.getByText("적용·저장 완료")).toBeTruthy();
  });
});

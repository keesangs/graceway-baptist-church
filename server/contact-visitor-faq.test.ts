import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const connectSource = readFileSync(resolve(process.cwd(), "client/src/pages/Connect.tsx"), "utf8");

describe("first-time visitor FAQ", () => {
  it("uses the requested Korean FAQ heading", () => {
    expect(connectSource).toContain('ko ? "새로 오시는 분들을 위한 안내" : "What to Expect"');
  });

  it("answers how long Sunday worship lasts and invites guests to meal fellowship", () => {
    expect(connectSource).toContain('qKo: "예배시간은 보통 얼마나 걸리나요?"');
    expect(connectSource).toContain("주일 예배는 보통 한 시간 정도 진행됩니다");
    expect(connectSource).toContain("맛있는 음식을 나누며 식사 교제도 있으니, 꼭 함께해 주세요");
  });

  it("describes the Sunday service flow with the revised approximately-one-hour Korean duration", () => {
    expect(connectSource).toContain('qKo: "예배는 어떻게 진행되나요?"');
    expect(connectSource).toContain("예배는 약 한시간 가량 진행됩니다");
    expect(connectSource).toContain("Services last approximately 60 minutes");
  });

  it("explains that childcare can be provided when visitors contact the church in advance", () => {
    expect(connectSource).toContain("미리 연락을 주시면, 주일 예배 중 Child care를 제공하도록 하겠습니다");
  });
});

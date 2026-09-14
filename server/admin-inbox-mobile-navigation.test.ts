import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminInbox = readFileSync(resolve(process.cwd(), "client/src/pages/AdminInbox.tsx"), "utf8");

describe("Admin Inbox mobile navigation", () => {
  it("keeps the complete tab bar for desktop while supplying a separate mobile section picker", () => {
    expect(adminInbox).toContain('className="hidden overflow-hidden rounded-sm border border-[#17324D]/15 bg-white md:inline-flex"');
    expect(adminInbox).toContain('className="md:hidden"');
    expect(adminInbox).toContain('<Select value={tab} onValueChange={(value) => setTab(value as Tab)}>');
    expect(adminInbox).toContain('aria-label="Choose an Inbox section"');
  });

  it("retains every Inbox section, visible count, and keyboard-selectable option on mobile", () => {
    expect(adminInbox).toContain('const TAB_VALUES: readonly Tab[] = ["messages", "subscribers", "events", "gallery", "bulletins"]');
    expect(adminInbox).toContain('{activeTab.count}');
    expect(adminInbox).toContain('<SelectItem');
    expect(adminInbox).toContain('textValue={item.label}');
    expect(adminInbox).toContain('className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center"');
  });
});

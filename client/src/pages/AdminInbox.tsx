/**
 * Admin Inbox — Graceway Baptist Church
 * Staff-only view of the two things visitors submit from the public site:
 * Connect-page enquiries (contact_messages) and newsletter signups
 * (newsletter_subscribers). Both underlying procedures are adminProcedure, so
 * the UI gate here is a convenience — the server remains the real boundary.
 */
import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import {
  Inbox,
  Mail,
  Phone,
  Loader2,
  LogIn,
  ShieldAlert,
  Download,
  RefreshCw,
} from "lucide-react";

type Tab = "messages" | "subscribers";

const TOPIC_LABELS: Record<string, string> = {
  visit: "Plan a visit",
  prayer: "Prayer request",
  ministry: "Ministry",
  general: "General",
};

const TOPIC_STYLES: Record<string, string> = {
  visit: "bg-[#C9973E]/15 text-[#8a6420] border-[#C9973E]/30",
  prayer: "bg-[#2F6F9F]/12 text-[#215476] border-[#2F6F9F]/30",
  ministry: "bg-[#17324D]/10 text-[#17324D] border-[#17324D]/20",
  general: "bg-[#242A30]/8 text-[#242A30]/70 border-[#242A30]/15",
};

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Escapes a value for CSV so commas/quotes in a message never break columns. */
function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  // Prepend a BOM so Excel opens Korean text in the correct encoding.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminInbox() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("messages");

  const isAdmin = user?.role === "admin";

  const messagesQuery = trpc.contact.list.useQuery(undefined, { enabled: isAdmin });
  const subscribersQuery = trpc.newsletter.list.useQuery(undefined, { enabled: isAdmin });

  const messages = messagesQuery.data ?? [];
  const subscribers = subscribersQuery.data ?? [];

  const counts = useMemo(
    () => ({ messages: messages.length, subscribers: subscribers.length }),
    [messages.length, subscribers.length],
  );

  // ── Auth gates ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F7]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[#17324D]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F6F7]">
        <Navbar />
        <section className="py-32">
          <div className="container max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[#17324D]/10 flex items-center justify-center mx-auto mb-6">
              <LogIn size={28} className="text-[#17324D]" />
            </div>
            <h1
              className="text-[#17324D] text-2xl font-bold mb-3"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Sign In Required
            </h1>
            <p className="text-[#242A30]/60 mb-8">
              Please sign in with your church staff account to view the inbox.
            </p>
            <button
              onClick={() => startLogin()}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#17324D] text-white font-semibold text-sm tracking-wide rounded-sm hover:bg-[#1e4060] transition-all duration-200 active:scale-[0.97]"
            >
              <LogIn size={16} /> Sign In
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F6F7]">
        <Navbar />
        <section className="py-32">
          <div className="container max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[#C9973E]/15 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={28} className="text-[#C9973E]" />
            </div>
            <h1
              className="text-[#17324D] text-2xl font-bold mb-3"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Staff Access Only
            </h1>
            <p className="text-[#242A30]/60">
              You are signed in as <strong>{user?.name || user?.email}</strong>, which does not
              have administrator access. Please ask a church administrator to grant your account
              the admin role.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isLoading = tab === "messages" ? messagesQuery.isLoading : subscribersQuery.isLoading;
  const refetch = tab === "messages" ? messagesQuery.refetch : subscribersQuery.refetch;

  const handleExport = () => {
    if (tab === "messages") {
      downloadCsv("graceway-contact-messages.csv", [
        ["Received", "First Name", "Last Name", "Email", "Phone", "Topic", "Status", "Message"],
        ...messages.map(m => [
          formatDateTime(m.createdAt),
          m.firstName,
          m.lastName,
          m.email,
          m.phone ?? "",
          TOPIC_LABELS[m.topic] ?? m.topic,
          m.status,
          m.message ?? "",
        ]),
      ]);
    } else {
      downloadCsv("graceway-newsletter-subscribers.csv", [
        ["Subscribed", "Email", "Language"],
        ...subscribers.map(s => [formatDateTime(s.createdAt), s.email, s.lang.toUpperCase()]),
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />

      <BrandPageHero
        eyebrow="Church Staff"
        title="Inbox"
        description="Enquiries from the Connect page and newsletter signups, newest first."
        visual="community"
      />

      <div className="container py-12">
        {/* Tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex rounded-sm border border-[#17324D]/15 bg-white overflow-hidden">
            {(
              [
                { key: "messages" as Tab, label: "Messages", count: counts.messages },
                { key: "subscribers" as Tab, label: "Subscribers", count: counts.subscribers },
              ]
            ).map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                aria-pressed={tab === item.key}
                className={`px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 ${
                  tab === item.key
                    ? "bg-[#163B59] text-white"
                    : "text-[#607A91] hover:bg-[#E7EEF1]"
                }`}
              >
                {item.label}
                <span
                  className={`ml-2 text-xs ${tab === item.key ? "text-[#D9B87A]" : "text-[#607A91]/60"}`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-[#C8D4D9] bg-[#FFFEFB] px-4 py-2.5 text-sm font-semibold text-[#163B59] transition-all duration-200 hover:bg-[#E7EEF1] active:scale-[0.97]"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-md bg-[#163B59] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#245170] active:scale-[0.97]"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="brand-surface flex items-center justify-center rounded-xl border border-[#DCE4E7] py-24">
            <Loader2 size={28} className="animate-spin text-[#163B59]" />
          </div>
        ) : tab === "messages" ? (
          messages.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No messages yet"
              body="Enquiries submitted through the Connect page will appear here, and church staff also receive a notification for each one."
            />
          ) : (
            <div className="space-y-4">
              {messages.map(m => (
                <article
                  key={m.id}
                  className="brand-surface rounded-xl border border-[#DCE4E7] p-6 transition-colors duration-200 hover:border-[#B7C5CD]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3
                        className="text-lg font-bold text-[#163B59]"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {m.firstName} {m.lastName}
                      </h3>
                      <p className="mt-1 text-xs text-[#607A91]/70">
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-sm border ${
                        TOPIC_STYLES[m.topic] ?? TOPIC_STYLES.general
                      }`}
                    >
                      {TOPIC_LABELS[m.topic] ?? m.topic}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm">
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-2 text-[#607A91] hover:underline"
                    >
                      <Mail size={14} /> {m.email}
                    </a>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="inline-flex items-center gap-2 text-[#607A91] hover:underline"
                      >
                        <Phone size={14} /> {m.phone}
                      </a>
                    )}
                  </div>

                  {m.message ? (
                    <p className="border-l-2 border-[#B9955E]/55 pl-4 text-sm leading-relaxed whitespace-pre-line text-[#44515C]">
                      {m.message}
                    </p>
                  ) : (
                    <p className="text-[#242A30]/40 text-sm italic">No message provided.</p>
                  )}
                </article>
              ))}
            </div>
          )
        ) : subscribers.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No subscribers yet"
            body="Visitors who sign up through the newsletter form on the Home page will be listed here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#DCE4E7] bg-[#FFFEFB]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#E7EEF1] text-left">
                  <th className="px-6 py-3 font-semibold text-[#163B59]">Email</th>
                  <th className="w-32 px-6 py-3 font-semibold text-[#163B59]">Language</th>
                  <th className="w-56 px-6 py-3 font-semibold text-[#163B59]">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr
                    key={s.id}
                    className="border-t border-[#DCE4E7] transition-colors duration-150 hover:bg-[#EEF3F5]"
                  >
                    <td className="px-6 py-3.5">
                      <a
                        href={`mailto:${s.email}`}
                        className="text-[#607A91] hover:underline"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-sm bg-[#E7EEF1] px-2 py-0.5 text-xs font-semibold text-[#163B59]">
                        {s.lang.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[#607A91]">
                      {formatDateTime(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="brand-surface rounded-xl border border-[#DCE4E7] px-6 py-20 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7EEF1]">
        <Icon size={24} className="text-[#163B59]/60" />
      </div>
      <h3
        className="mb-2 text-lg font-bold text-[#163B59]"
        style={{ fontFamily: "'Source Serif 4', serif" }}
      >
        {title}
      </h3>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-[#607A91]">{body}</p>
    </div>
  );
}

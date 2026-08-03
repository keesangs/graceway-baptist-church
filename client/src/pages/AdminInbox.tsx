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

      {/* Page Header */}
      <section className="pt-28 pb-12 bg-[#17324D] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C9973E] to-transparent opacity-60" />
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#C9973E]" />
            <p className="text-[#C9973E] text-xs tracking-[0.3em] uppercase font-semibold">
              Church Staff
            </p>
          </div>
          <h1
            className="text-white text-4xl font-bold mb-2"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Inbox
          </h1>
          <p className="text-white/60 text-sm">
            Enquiries from the Connect page and newsletter signups, newest first.
          </p>
        </div>
      </section>

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
                className={`px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 ${
                  tab === item.key
                    ? "bg-[#17324D] text-white"
                    : "text-[#17324D]/70 hover:bg-[#17324D]/5"
                }`}
              >
                {item.label}
                <span
                  className={`ml-2 text-xs ${tab === item.key ? "text-[#C9973E]" : "text-[#242A30]/40"}`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#17324D] border border-[#17324D]/20 bg-white rounded-sm hover:bg-[#17324D]/5 transition-all duration-200 active:scale-[0.97]"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#17324D] rounded-sm hover:bg-[#1e4060] transition-all duration-200 active:scale-[0.97]"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 bg-white border border-[#17324D]/10 rounded-sm">
            <Loader2 size={28} className="animate-spin text-[#17324D]" />
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
                  className="bg-white border border-[#17324D]/10 rounded-sm p-6 hover:border-[#17324D]/25 transition-colors duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3
                        className="text-[#17324D] text-lg font-bold"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {m.firstName} {m.lastName}
                      </h3>
                      <p className="text-[#242A30]/45 text-xs mt-1">
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
                      className="inline-flex items-center gap-2 text-[#2F6F9F] hover:underline"
                    >
                      <Mail size={14} /> {m.email}
                    </a>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="inline-flex items-center gap-2 text-[#2F6F9F] hover:underline"
                      >
                        <Phone size={14} /> {m.phone}
                      </a>
                    )}
                  </div>

                  {m.message ? (
                    <p className="text-[#242A30]/75 text-sm leading-relaxed whitespace-pre-line border-l-2 border-[#C9973E]/40 pl-4">
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
          <div className="bg-white border border-[#17324D]/10 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#17324D]/5 text-left">
                  <th className="px-6 py-3 font-semibold text-[#17324D]">Email</th>
                  <th className="px-6 py-3 font-semibold text-[#17324D] w-32">Language</th>
                  <th className="px-6 py-3 font-semibold text-[#17324D] w-56">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr
                    key={s.id}
                    className="border-t border-[#17324D]/8 hover:bg-[#17324D]/[0.03] transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5">
                      <a
                        href={`mailto:${s.email}`}
                        className="text-[#2F6F9F] hover:underline"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-sm bg-[#17324D]/8 text-[#17324D]">
                        {s.lang.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[#242A30]/55">
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
    <div className="bg-white border border-[#17324D]/10 rounded-sm py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#17324D]/8 flex items-center justify-center mx-auto mb-5">
        <Icon size={24} className="text-[#17324D]/50" />
      </div>
      <h3
        className="text-[#17324D] text-lg font-bold mb-2"
        style={{ fontFamily: "'Source Serif 4', serif" }}
      >
        {title}
      </h3>
      <p className="text-[#242A30]/55 text-sm max-w-md mx-auto leading-relaxed">{body}</p>
    </div>
  );
}

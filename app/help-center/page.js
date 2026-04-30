"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HelpCenterPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I am the EduHub help assistant. Ask me about attendance, enrollment, notifications, or when to submit a report issue.",
    },
  ]);
  const [form, setForm] = useState({
    subject: "",
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();

        if (!data.success || data.data.user.role !== "parent") {
          router.push("/login");
          return;
        }
      } catch (e) {
        router.push("/login");
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to send report issue");
        setSubmitting(false);
        return;
      }

      setSuccess("Your report issue was sent successfully.");
      setForm({ subject: "", message: "" });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  const handleAssistantSubmit = async (e) => {
    e.preventDefault();

    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const nextMessages = [...assistantMessages, { role: "user", content: trimmed }];
    setAssistantMessages(nextMessages);
    setAssistantInput("");
    setAssistantError("");
    setAssistantLoading(true);

    try {
      const res = await fetch("/api/help-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (!data.success) {
        setAssistantError(data.error || "Failed to get assistant response.");
        setAssistantMessages((prev) => prev.slice(0, -1));
        setAssistantInput(trimmed);
        return;
      }

      setAssistantMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data.reply },
      ]);
    } catch (err) {
      setAssistantError("Something went wrong. Please try again.");
      setAssistantMessages((prev) => prev.slice(0, -1));
      setAssistantInput(trimmed);
    } finally {
      setAssistantLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Help Center</h1>
            <p className="text-white/60 mt-2">Send a report issue to the school admin team.</p>
          </div>

          <Link
            href="/help-center/report-logs"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/10 transition-colors"
          >
            Report Logs
          </Link>
        </div>

        <div className="mt-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">Send Report Issue</h2>
              <p className="text-white/60 text-sm mt-2">
                Use this when you need the school admin team to review a real issue.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  maxLength={120}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500"
                  placeholder="Example: Attendance record issue"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Report details</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe the issue clearly so admin can help quickly."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Report Issue"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
        {assistantOpen ? (
          <div className="w-[calc(100vw-2rem)] max-w-sm rounded-[1.75rem] border border-white/10 bg-slate-950/95 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="text-sm font-semibold text-white">EduHub Assistant</h2>
                <p className="text-xs text-white/50 mt-1">Quick help before sending a report issue.</p>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="h-9 w-9 cursor-pointer rounded-full border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
                aria-label="Close assistant"
              >
                x
              </button>
            </div>

            <div className="h-[25rem] flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {assistantMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/90 border border-white/10"
                        }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {assistantLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white/10 text-white/70 border border-white/10">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 px-4 py-4 bg-white/[0.03]">
                {assistantError && (
                  <div className="mb-3 rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
                    {assistantError}
                  </div>
                )}

                <form onSubmit={handleAssistantSubmit} className="space-y-3">
                  <textarea
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    rows={3}
                    maxLength={1500}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 resize-none"
                    placeholder="Ask about attendance, enrollment, reports, or notifications..."
                  />
                  <button
                    type="submit"
                    disabled={assistantLoading || !assistantInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {assistantLoading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="assistant-glow-border group cursor-pointer inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 lg:pr-5 md:pr-5 p-0 py-2 text-white transition-all hover:-translate-y-1 duration-300"
          >
            <span className="assistant-shine"></span>
            <Image src="/images/chat-bot.png" width={50} height={50} alt="chat bot image" className="w-20 h-15 " />
            <span className="text-left lg:block md:block hidden">
              <span className="block text-sm font-semibold leading-tight">Ask EduHub Assistant</span>
              <span className="block text-xs text-white/80 leading-tight">Quick help and guidance</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

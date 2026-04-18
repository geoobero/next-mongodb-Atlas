"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [draftStatuses, setDraftStatuses] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedReportId, setExpandedReportId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const statusLabel = (status) => {
    if (status === "in_review") return "In Review";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const fetchReports = async (filter = statusFilter) => {
    try {
      const query = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/reports${query}`, { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch reports");
        return;
      }

      setReports(data.data.reports);

      const nextStatuses = {};
      const nextReplies = {};
      for (const report of data.data.reports) {
        nextStatuses[report._id] = report.status;
        nextReplies[report._id] = "";
      }
      setDraftStatuses(nextStatuses);
      setReplyDrafts(nextReplies);
    } catch (e) {
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        const data = await res.json();

        if (!data.success || data.data.user.role !== "admin") {
          router.push("/login");
          return;
        }

        fetchReports("all");
      } catch (e) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleStatusFilterChange = (nextFilter) => {
    setStatusFilter(nextFilter);
    setLoading(true);
    setError("");
    setSuccess("");
    setExpandedReportId("");
    fetchReports(nextFilter);
  };

  const updateReport = async (report) => {
    const nextStatus = draftStatuses[report._id] || report.status;
    const replyMessage = (replyDrafts[report._id] || "").trim();
    const statusChanged = nextStatus !== report.status;

    if (!statusChanged && !replyMessage) {
      setError("Add a reply or change the status before sending.");
      setSuccess("");
      return;
    }

    setUpdatingId(report._id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/reports/${report._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          replyMessage,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to send update");
      } else {
        setSuccess("Reply/status sent to parent notifications.");
        await fetchReports(statusFilter);
        setExpandedReportId(report._id);
      }
    } catch (e) {
      setError("Failed to send update");
    } finally {
      setUpdatingId("");
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === "open") return "bg-red-500/20 text-red-300 border-red-500/30";
    if (status === "in_review") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-green-500/20 text-green-300 border-green-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-white/60 mt-1">Review parent issues and send replies with status updates</p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-slate-800">All Statuses</option>
            <option value="open" className="bg-slate-800">Open</option>
            <option value="in_review" className="bg-slate-800">In Review</option>
            <option value="resolved" className="bg-slate-800">Resolved</option>
          </select>
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

        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report._id;

            return (
              <div key={report._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{report.subject}</h3>
                      <span className={`px-2.5 py-1 text-xs rounded-full border ${getStatusBadgeClass(report.status)}`}>
                        {statusLabel(report.status)}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Parent: {report.parentId?.name || "Unknown"} ({report.parentId?.email || "No email"})
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Submitted: {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setExpandedReportId(isExpanded ? "" : report._id)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    {isExpanded ? "Close" : "Reply / Update"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h4 className="text-sm uppercase tracking-wide text-white/50 mb-2">Parent Reported Issue</h4>
                      <p className="text-white/90 whitespace-pre-wrap">{report.message}</p>

                      <div className="mt-4">
                        <p className="text-xs text-white/40 mb-2">Status History</p>
                        {report.statusHistory?.length > 0 ? (
                          <div className="space-y-2">
                            {report.statusHistory.map((entry, index) => (
                              <div key={`${entry.updatedAt}-${index}`} className="text-xs text-white/70 rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                                <span className="text-white">{statusLabel(entry.status)}</span>
                                <span className="text-white/50"> by {entry.updatedBy?.name || "Admin"} on {new Date(entry.updatedAt).toLocaleString()}</span>
                                {entry.note && <span className="text-white/40"> - {entry.note}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-white/40">No admin status updates yet.</p>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-white/40 mb-2">Admin Replies</p>
                        {report.replies?.length > 0 ? (
                          <div className="space-y-2">
                            {report.replies.map((reply, index) => (
                              <div key={`${reply.createdAt}-${index}`} className="text-sm text-white/80 rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                                <p className="whitespace-pre-wrap">{reply.message}</p>
                                <p className="text-xs text-white/40 mt-1">
                                  {reply.adminId?.name || "Admin"} - {new Date(reply.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-white/40">No admin replies yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <h4 className="text-sm uppercase tracking-wide text-blue-200 mb-3">Admin Reply</h4>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs text-white/60 mb-2">Update Status</label>
                          <select
                            value={draftStatuses[report._id] || report.status}
                            onChange={(e) => setDraftStatuses({ ...draftStatuses, [report._id]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                          >
                            <option value="open" className="bg-slate-800">Open</option>
                            <option value="in_review" className="bg-slate-800">In Review</option>
                            <option value="resolved" className="bg-slate-800">Resolved</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-white/60 mb-2">Reply Message</label>
                          <textarea
                            value={replyDrafts[report._id] || ""}
                            onChange={(e) => setReplyDrafts({ ...replyDrafts, [report._id]: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-blue-500 resize-none"
                            placeholder="Write your reply to the parent here..."
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => updateReport(report)}
                        disabled={updatingId === report._id}
                        className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {updatingId === report._id ? "Sending..." : "Send Reply & Update"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-white/60">No reports found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReportLogsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const getStatusBadgeClass = (status) => {
    if (status === "open") return "bg-red-500/20 text-red-300 border-red-500/30";
    if (status === "in_review") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-green-500/20 text-green-300 border-green-500/30";
  };

  const formatStatus = (status) => {
    if (status === "in_review") return "In Review";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await fetch("/api/auth", { cache: "no-store" });
        const authData = await authRes.json();

        if (!authData.success || authData.data.user.role !== "parent") {
          router.push("/login");
          return;
        }

        const reportsRes = await fetch("/api/reports/my", { cache: "no-store" });
        const reportsData = await reportsRes.json();

        if (!reportsData.success) {
          setError(reportsData.error || "Failed to load report logs");
        } else {
          setReports(reportsData.data.reports);
        }
      } catch (e) {
        setError("Failed to load report logs");
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

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

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Report Logs</h1>
            <p className="text-white/60 mt-2">Track your submitted issues and admin replies.</p>
          </div>
          <Link
            href="/help-center"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/10 transition-colors"
          >
            Back to Help Center
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{report.subject}</h2>
                  <p className="text-xs text-white/50 mt-1">
                    Submitted: {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full border ${getStatusBadgeClass(report.status)}`}>
                  {formatStatus(report.status)}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
                <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Your Issue</p>
                <p className="text-white/90 whitespace-pre-wrap">{report.message}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Status Updates</p>
                  {report.statusHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {report.statusHistory.map((entry, index) => (
                        <div key={`${entry.updatedAt}-${index}`} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm">
                          <p className="text-white">{formatStatus(entry.status)}</p>
                          <p className="text-white/50 text-xs mt-1">
                            {entry.updatedBy?.name || "Admin"} - {new Date(entry.updatedAt).toLocaleString()}
                          </p>
                          {entry.note && <p className="text-white/40 text-xs mt-1">{entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">No status updates yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-xs text-blue-200 uppercase tracking-wide mb-2">Admin Replies</p>
                  {report.replies?.length > 0 ? (
                    <div className="space-y-2">
                      {report.replies.map((reply, index) => (
                        <div key={`${reply.createdAt}-${index}`} className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm">
                          <p className="text-white/90 whitespace-pre-wrap">{reply.message}</p>
                          <p className="text-white/50 text-xs mt-1">
                            {reply.adminId?.name || "Admin"} - {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">No replies yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && !error && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No Report Logs Yet</h3>
              <p className="text-white/60 mb-4">You have not submitted any issue reports yet.</p>
              <Link
                href="/help-center"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Create a Report
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

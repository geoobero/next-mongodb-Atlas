import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, IssueReport, Notification } from "../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, replyMessage } = body;

    const normalizedReply = typeof replyMessage === "string" ? replyMessage.trim() : "";
    const hasReply = normalizedReply.length > 0;
    const hasStatusValue = typeof status === "string" && status.length > 0;

    if (!hasReply && !hasStatusValue) {
      return NextResponse.json(
        { success: false, error: "Provide a reply or a status update" },
        { status: 400 }
      );
    }

    if (hasStatusValue && !["open", "in_review", "resolved"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid report status" },
        { status: 400 }
      );
    }

    const report = await IssueReport.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    const statusChanged = hasStatusValue && report.status !== status;

    if (!hasReply && hasStatusValue && !statusChanged) {
      return NextResponse.json(
        { success: false, error: "Status is already set to this value" },
        { status: 400 }
      );
    }

    if (hasReply) {
      report.replies.push({
        adminId: decoded.id,
        message: escapeHtml(normalizedReply),
      });
    }

    if (statusChanged) {
      report.status = status;
      report.statusHistory.push({
        status,
        updatedBy: decoded.id,
        updatedAt: new Date(),
        note: hasReply ? "Updated with admin reply" : "Status updated by admin",
      });
    }

    await report.save();

    const notificationsToCreate = [];

    if (hasReply) {
      notificationsToCreate.push({
        userId: report.parentId,
        issueReportId: report._id,
        message: `Admin replied to your report: "${report.subject}"`,
        type: "report_update",
      });
    }

    if (statusChanged) {
      const label = status === "in_review"
        ? "In Review"
        : status.charAt(0).toUpperCase() + status.slice(1);

      notificationsToCreate.push({
        userId: report.parentId,
        issueReportId: report._id,
        message: `Your report status is now: ${label}`,
        type: "report_update",
      });
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    const updatedReport = await IssueReport.findById(report._id)
      .populate("parentId", "name email")
      .populate("replies.adminId", "name email")
      .populate("statusHistory.updatedBy", "name email");

    return NextResponse.json({
      success: true,
      data: { report: updatedReport },
      message: "Report updated successfully"
    });
  } catch (error) {
    console.error("Report PUT Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

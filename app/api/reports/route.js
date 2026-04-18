import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, IssueReport, User } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = {};

    if (status && ["open", "in_review", "resolved"].includes(status)) {
      query.status = status;
    }

    const reports = await IssueReport.find(query)
      .populate("parentId", "name email")
      .populate("replies.adminId", "name email")
      .populate("statusHistory.updatedBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error("Reports GET Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    if (decoded.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Only parents can submit reports" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const parent = await User.findById(decoded.id);
    if (!parent || parent.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Invalid parent account" },
        { status: 400 }
      );
    }

    const report = await IssueReport.create({
      parentId: decoded.id,
      subject: subject.trim(),
      message: message.trim(),
      status: "open"
    });

    const populatedReport = await IssueReport.findById(report._id)
      .populate("parentId", "name email");

    return NextResponse.json({
      success: true,
      data: { report: populatedReport },
      message: "Issue report submitted successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Reports POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

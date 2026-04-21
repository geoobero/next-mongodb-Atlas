import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, IssueReport } from "../../models";
import { getJwtSecret } from "../../auth-helpers";

const JWT_SECRET = getJwtSecret();

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

    if (decoded.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent only." },
        { status: 403 }
      );
    }

    const reports = await IssueReport.find({ parentId: decoded.id })
      .populate("replies.adminId", "name email")
      .populate("statusHistory.updatedBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error("Parent Reports GET Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Attendance, Notification } from "../../models";
import { getJwtSecret } from "../../auth-helpers";

const JWT_SECRET = getJwtSecret();

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
    
    if (decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Only teachers can update attendance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ["present", "late", "excused"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be present, late, or excused" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (attendance.teacherId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own attendance records" },
        { status: 403 }
      );
    }

    attendance.status = status;
    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate("studentId", "name")
      .populate("teacherId", "name");

    return NextResponse.json({
      success: true,
      data: { attendance: updatedAttendance },
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Attendance PUT Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

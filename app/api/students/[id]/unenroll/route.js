import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Student } from "../../../models";
import { getJwtSecret } from "../../../auth-helpers";

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
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can unenroll students" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.status !== "enrolled") {
      return NextResponse.json(
        { success: false, error: "Student is not enrolled" },
        { status: 400 }
      );
    }

    student.classroomId = null;
    student.status = "archived";
    await student.save();

    return NextResponse.json({
      success: true,
      message: "Student unenrolled successfully"
    });

  } catch (error) {
    console.error("Student Unenroll Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

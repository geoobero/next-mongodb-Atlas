import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Student, Classroom, Notification } from "../../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

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
        { success: false, error: "Only teachers can enroll students" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { classroomId } = body;

    if (!classroomId) {
      return NextResponse.json(
        { success: false, error: "Classroom ID is required" },
        { status: 400 }
      );
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return NextResponse.json(
        { success: false, error: "Classroom not found" },
        { status: 404 }
      );
    }

    if (classroom.adviserId?.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You can only enroll students to your assigned classrooms" },
        { status: 403 }
      );
    }

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.status === "enrolled") {
      return NextResponse.json(
        { success: false, error: "Student is already enrolled" },
        { status: 400 }
      );
    }

    student.classroomId = classroomId;
    student.status = "enrolled";
    await student.save();

    await Notification.create({
      userId: student.parentId,
      studentId: student._id,
      message: `Your child ${student.name} has been enrolled in ${classroom.name} by ${decoded.email}`,
      type: "enrollment"
    });

    const populatedStudent = await Student.findById(student._id)
      .populate("parentId", "name email phone")
      .populate("classroomId", "name gradeLevel")
      .populate("schoolYearId", "year");

    return NextResponse.json({
      success: true,
      data: { student: populatedStudent },
      message: "Student enrolled successfully"
    });

  } catch (error) {
    console.error("Student Enroll Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to enroll student" },
      { status: 500 }
    );
  }
}

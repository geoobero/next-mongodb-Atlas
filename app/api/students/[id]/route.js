import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Student, Attendance } from "../../models";
import { getJwtSecret } from "../../auth-helpers";

const JWT_SECRET = getJwtSecret();

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    jwt.verify(token, JWT_SECRET);

    const { id } = await params;
    const student = await Student.findById(id)
      .populate("parentId", "name email phone address")
      .populate("classroomId", "name gradeLevel adviserId")
      .populate("schoolYearId", "year");

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { student }
    });

  } catch (error) {
    console.error("Student GET Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
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
    
    const body = await request.json();
    const { name, age, birthday, address } = body;

    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (decoded.role === "parent" && student.parentId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own children" },
        { status: 403 }
      );
    }

    if (name) student.name = name;
    if (age) student.age = age;
    if (birthday) student.birthday = new Date(birthday);
    if (address !== undefined) student.address = address;

    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate("parentId", "name email phone")
      .populate("classroomId", "name gradeLevel")
      .populate("schoolYearId", "year");

    return NextResponse.json({
      success: true,
      data: { student: updatedStudent }
    });

  } catch (error) {
    console.error("Student PUT Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
        { success: false, error: "Only admins can delete students" },
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

    await Attendance.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (error) {
    console.error("Student DELETE Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

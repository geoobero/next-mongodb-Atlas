import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Classroom, Student } from "../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

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
    const classroom = await Classroom.findById(id)
      .populate("adviserId", "name email")
      .populate("schoolYearId", "year isActive");

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: "Classroom not found" },
        { status: 404 }
      );
    }

    const students = await Student.find({ classroomId: id })
      .populate("parentId", "name email phone")
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: { 
        classroom,
        students
      }
    });

  } catch (error) {
    console.error("Classroom GET Error:", error.message);
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
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, gradeLevel, adviserId } = body;

    const { id } = await params;
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return NextResponse.json(
        { success: false, error: "Classroom not found" },
        { status: 404 }
      );
    }

    if (name) classroom.name = name;
    if (gradeLevel) classroom.gradeLevel = gradeLevel;
    if (adviserId !== undefined) classroom.adviserId = adviserId || null;

    await classroom.save();

    const populatedClassroom = await Classroom.findById(classroom._id)
      .populate("adviserId", "name email")
      .populate("schoolYearId", "year isActive");

    return NextResponse.json({
      success: true,
      data: { classroom: populatedClassroom }
    });

  } catch (error) {
    console.error("Classroom PUT Error:", error.message);
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
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const enrolledStudents = await Student.find({ 
      classroomId: id,
      status: "enrolled"
    });

    if (enrolledStudents.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete classroom with enrolled students. Remove students first." },
        { status: 400 }
      );
    }

    const classroom = await Classroom.findByIdAndDelete(id);
    if (!classroom) {
      return NextResponse.json(
        { success: false, error: "Classroom not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Classroom deleted successfully"
    });

  } catch (error) {
    console.error("Classroom DELETE Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

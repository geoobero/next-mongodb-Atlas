import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Classroom, SchoolYear, Student, User } from "../models";
import { getJwtSecret } from "../auth-helpers";

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
    
    const { searchParams } = new URL(request.url);
    const schoolYearId = searchParams.get("schoolYearId");
    const adviserId = searchParams.get("adviserId");

    let query = {};
    
    if (schoolYearId) {
      query.schoolYearId = schoolYearId;
    }
    
    if (decoded.role === "teacher") {
      query.adviserId = decoded.id;
    } else if (adviserId) {
      query.adviserId = adviserId;
    }

    const classrooms = await Classroom.find(query)
      .populate("adviserId", "name email")
      .populate("schoolYearId", "year isActive")
      .sort({ gradeLevel: 1, name: 1 });

    return NextResponse.json({
      success: true,
      data: { classrooms }
    });

  } catch (error) {
    console.error("Classrooms GET Error:", error.message);
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
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, gradeLevel, adviserId, schoolYearId } = body;

    if (!name || !gradeLevel || !schoolYearId) {
      return NextResponse.json(
        { success: false, error: "Name, grade level, and school year are required" },
        { status: 400 }
      );
    }

    const schoolYear = await SchoolYear.findById(schoolYearId);
    if (!schoolYear) {
      return NextResponse.json(
        { success: false, error: "School year not found" },
        { status: 404 }
      );
    }

    if (adviserId) {
      const teacher = await User.findById(adviserId);
      if (!teacher || teacher.role !== "teacher") {
        return NextResponse.json(
          { success: false, error: "Invalid teacher selected" },
          { status: 400 }
        );
      }
    }

    const existingClassroom = await Classroom.findOne({ 
      name, 
      schoolYearId 
    });
    
    if (existingClassroom) {
      return NextResponse.json(
        { success: false, error: "Classroom with this name already exists in this school year" },
        { status: 400 }
      );
    }

    const classroom = await Classroom.create({
      name,
      gradeLevel,
      adviserId: adviserId || null,
      schoolYearId
    });

    const populatedClassroom = await Classroom.findById(classroom._id)
      .populate("adviserId", "name email")
      .populate("schoolYearId", "year isActive");

    return NextResponse.json({
      success: true,
      data: { classroom: populatedClassroom }
    }, { status: 201 });

  } catch (error) {
    console.error("Classrooms POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

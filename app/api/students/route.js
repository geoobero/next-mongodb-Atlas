import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Student, User, Classroom, SchoolYear, Notification } from "../models";

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
    
    const { searchParams } = new URL(request.url);
    const schoolYearId = searchParams.get("schoolYearId");
    const parentId = searchParams.get("parentId");
    const classroomId = searchParams.get("classroomId");
    const status = searchParams.get("status");

    let query = {};

    if (schoolYearId) {
      query.schoolYearId = schoolYearId;
    } else {
      const activeYear = await SchoolYear.findOne({ isActive: true });
      if (activeYear) {
        query.schoolYearId = activeYear._id;
      }
    }

    if (decoded.role === "parent") {
      query.parentId = decoded.id;
    } else if (parentId) {
      query.parentId = parentId;
    }

    if (decoded.role === "teacher") {
      const teacherClassrooms = await Classroom.find({ adviserId: decoded.id }).select("_id");
      const classroomIds = teacherClassrooms.map(c => c._id);
      query.classroomId = { $in: classroomIds };
    } else if (classroomId) {
      query.classroomId = classroomId;
    }

    if (status) {
      query.status = status;
    }

    const students = await Student.find(query)
      .populate("parentId", "name email phone")
      .populate("classroomId", "name gradeLevel adviserId")
      .populate("schoolYearId", "year")
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: { students }
    });

  } catch (error) {
    console.error("Students GET Error:", error.message);
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
    
    const body = await request.json();
    const { name, age, birthday, targetLevel, address, schoolYearId } = body;

    if (!name || !age || !birthday) {
      return NextResponse.json(
        { success: false, error: "Name, age, and birthday are required" },
        { status: 400 }
      );
    }

    let parentId = decoded.id;
    let studentSchoolYearId = schoolYearId;

    if (decoded.role === "admin") {
      if (!body.parentId) {
        return NextResponse.json(
          { success: false, error: "Parent ID is required when admin creates a student" },
          { status: 400 }
        );
      }
      if (!schoolYearId) {
        return NextResponse.json(
          { success: false, error: "School year is required" },
          { status: 400 }
        );
      }
      parentId = body.parentId;
      studentSchoolYearId = schoolYearId;
    } else if (decoded.role === "parent") {
      if (!targetLevel) {
        return NextResponse.json(
          { success: false, error: "Target student level is required" },
          { status: 400 }
        );
      }
      parentId = decoded.id;
    } else {
      return NextResponse.json(
        { success: false, error: "Only admin and parents can create students" },
        { status: 403 }
      );
    }

    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Invalid parent" },
        { status: 400 }
      );
    }

    if (!studentSchoolYearId) {
      const activeYear = await SchoolYear.findOne({ isActive: true });
      if (!activeYear) {
        return NextResponse.json(
          { success: false, error: "No active school year found" },
          { status: 400 }
        );
      }
      studentSchoolYearId = activeYear._id;
    }

    const student = await Student.create({
      name,
      age,
      birthday: new Date(birthday),
      targetLevel: targetLevel || "",
      address: address || "",
      parentId,
      schoolYearId: studentSchoolYearId,
      status: "pending"
    });

    const populatedStudent = await Student.findById(student._id)
      .populate("parentId", "name email phone")
      .populate("schoolYearId", "year");

    return NextResponse.json({
      success: true,
      data: { student: populatedStudent }
    }, { status: 201 });

  } catch (error) {
    console.error("Students POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

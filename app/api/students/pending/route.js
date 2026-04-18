import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Student, User, SchoolYear } from "../../models";

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
    
    if (decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Only teachers can view pending students" },
        { status: 403 }
      );
    }

    const activeYear = await SchoolYear.findOne({ isActive: true });
    if (!activeYear) {
      return NextResponse.json(
        { success: false, error: "No active school year found" },
        { status: 400 }
      );
    }

    const students = await Student.find({ 
      schoolYearId: activeYear._id,
      status: "pending"
    })
      .populate("parentId", "name email phone")
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: { students }
    });

  } catch (error) {
    console.error("Pending Students GET Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

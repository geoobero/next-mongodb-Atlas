import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, SchoolYear, Classroom, Student } from "../../models";
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

    const schoolYear = await SchoolYear.findById(id);
    if (!schoolYear) {
      return NextResponse.json(
        { success: false, error: "School year not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { schoolYear }
    });

  } catch (error) {
    console.error("School Year GET Error:", error.message);
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
    const { id } = await params;
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { year, startDate, endDate } = body;

    const schoolYear = await SchoolYear.findById(id);
    if (!schoolYear) {
      return NextResponse.json(
        { success: false, error: "School year not found" },
        { status: 404 }
      );
    }

    if (year) schoolYear.year = year;
    if (startDate) schoolYear.startDate = new Date(startDate);
    if (endDate) schoolYear.endDate = new Date(endDate);

    await schoolYear.save();

    return NextResponse.json({
      success: true,
      data: { schoolYear }
    });

  } catch (error) {
    console.error("School Year PUT Error:", error.message);
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
    const { id } = await params;
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const classrooms = await Classroom.find({ schoolYearId: id });
    if (classrooms.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete school year with existing classrooms" },
        { status: 400 }
      );
    }

    const schoolYear = await SchoolYear.findByIdAndDelete(id);
    if (!schoolYear) {
      return NextResponse.json(
        { success: false, error: "School year not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "School year deleted successfully"
    });

  } catch (error) {
    console.error("School Year DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Database error occurred" },
      { status: 500 }
    );
  }
}

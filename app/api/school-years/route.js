import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, SchoolYear } from "../models";

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
    jwt.verify(token, JWT_SECRET);

    const schoolYears = await SchoolYear.find().sort({ isActive: -1, year: -1 });

    return NextResponse.json({
      success: true,
      data: { schoolYears }
    });

  } catch (error) {
    console.error("School Years GET Error:", error.message);
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
    const { year, startDate, endDate } = body;

    if (!year || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Year, start date, and end date are required" },
        { status: 400 }
      );
    }

    const existingYear = await SchoolYear.findOne({ year });
    if (existingYear) {
      return NextResponse.json(
        { success: false, error: "School year already exists" },
        { status: 400 }
      );
    }

    await SchoolYear.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );

    const schoolYear = await SchoolYear.create({
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: { schoolYear }
    }, { status: 201 });

  } catch (error) {
    console.error("School Years POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

let cachedMongoose = null;

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (cachedMongoose) {
    return cachedMongoose;
  }

  const mongooseLib = await import("mongoose");
  
  cachedMongoose = await mongooseLib.default.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  return cachedMongoose;
}

async function getStudentModel() {
  const mongooseLib = await import("mongoose");
  
  const studentSchema = new mongooseLib.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      age: { type: Number, required: true },
    },
    { timestamps: true }
  );

  return mongooseLib.models.Student || mongooseLib.model("Student", studentSchema);
}

function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const Student = await getStudentModel();
    const students = await Student.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("GET Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin only" }, { status: 403 });
    }

    await connectDB();
    const Student = await getStudentModel();
    const body = await request.json();
    const student = await Student.create(body);
    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin only" }, { status: 403 });
    }

    await connectDB();
    const Student = await getStudentModel();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const student = await Student.findByIdAndUpdate(id, body, { new: true });
    
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error("PUT Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin only" }, { status: 403 });
    }

    await connectDB();
    const Student = await getStudentModel();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const student = await Student.findByIdAndDelete(id);
    
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error("DELETE Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

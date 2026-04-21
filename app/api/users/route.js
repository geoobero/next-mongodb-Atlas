import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, User } from "../models";
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
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let query = {};
    if (role && ["admin", "teacher", "parent"].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error("Users GET Error:", error.message);
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

    const bcrypt = require("bcryptjs");
    const body = await request.json();
    const { name, email, password, role, phone, address, age, birthday } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "teacher", "parent"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be admin, teacher, or parent." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      address: address || "",
      age: age || null,
      birthday: birthday || null
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          age: user.age,
          birthday: user.birthday
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Users POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

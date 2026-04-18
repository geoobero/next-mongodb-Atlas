import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, User } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await connectDB();
    const bcrypt = require("bcryptjs");
    const body = await request.json();
    const { name, email, password } = body;

    if (action === "login") {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        address: user.address || "",
        age: user.age || null,
        birthday: user.birthday || null,
        profilePicture: user.profilePicture || ""
      };

      const cookieUserData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const response = NextResponse.json({
        success: true,
        data: {
          user: userData,
          token
        }
      });

      response.cookies.set("token", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set("user", JSON.stringify(cookieUserData), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Auth Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          address: user.address || "",
          age: user.age || null,
          birthday: user.birthday || null,
          profilePicture: user.profilePicture || ""
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}

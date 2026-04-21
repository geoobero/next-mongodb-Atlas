import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, User } from "../models";
import { getAuthCookieOptions, getJwtSecret } from "../auth-helpers";

const JWT_SECRET = getJwtSecret();

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000;

function isBlocked(email) {
  const attempt = loginAttempts.get(email);
  if (!attempt) return false;
  if (Date.now() < attempt.blockedUntil) {
    return true;
  }
  loginAttempts.delete(email);
  return false;
}

function recordFailedAttempt(email) {
  const attempt = loginAttempts.get(email) || { count: 0, blockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = Date.now() + BLOCK_DURATION;
  }
  loginAttempts.set(email, attempt);
}

function clearFailedAttempts(email) {
  loginAttempts.delete(email);
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await connectDB();
    const bcrypt = require("bcryptjs");
    const body = await request.json();
    const { name, email, password } = body;

    if (action === "login") {
      if (isBlocked(email)) {
        return NextResponse.json(
          { success: false, error: "Too many login attempts. Please try again later." },
          { status: 429 }
        );
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        recordFailedAttempt(email);
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      clearFailedAttempts(email);

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

      const response = NextResponse.json({
        success: true,
        data: {
          user: userData,
          token
        }
      });

      response.cookies.set("token", token, getAuthCookieOptions(60 * 60 * 24 * 7));

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

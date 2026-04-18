import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, User } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function PUT(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();

    const body = await request.json();
    const { name, profilePicture, phone, address, age, birthday } = body;

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (age !== undefined) user.age = age;
    if (birthday !== undefined) user.birthday = birthday;
    await user.save();

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
    console.error("Profile Update Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Notification } from "../../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

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
    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You can only mark your own notifications" },
        { status: 403 }
      );
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("Notification Read Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

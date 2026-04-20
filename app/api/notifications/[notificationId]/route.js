import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Notification } from "../../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);

    const { notificationId } = await params;
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own notifications" },
        { status: 403 }
      );
    }

    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification deleted"
    });

  } catch (error) {
    console.error("Notification DELETE Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

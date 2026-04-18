import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, FeedPost } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    jwt.verify(token, JWT_SECRET);

    const posts = await FeedPost.find({})
      .populate("authorId", "name email profilePicture")
      .sort({ isPinned: -1, createdAt: -1 });

    return NextResponse.json({ success: true, data: { posts } });
  } catch (error) {
    console.error("Feed GET Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, error: "Access denied. Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const post = await FeedPost.create({
      content: content.trim(),
      authorId: decoded.id,
    });

    const populated = await FeedPost.findById(post._id).populate("authorId", "name email");

    return NextResponse.json({ success: true, data: { post: populated } }, { status: 201 });
  } catch (error) {
    console.error("Feed POST Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

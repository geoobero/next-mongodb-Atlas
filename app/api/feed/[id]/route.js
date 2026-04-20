import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, FeedPost } from "../../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    jwt.verify(token, JWT_SECRET);

    const { id } = await params;
    const post = await FeedPost.findById(id)      .populate("authorId", "name email profilePicture");

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { post } });
  } catch (error) {
    console.error("Feed Post GET Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const { content, isPinned } = body;

    const post = await FeedPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (content !== undefined) post.content = escapeHtml(content.trim());
    if (isPinned !== undefined) post.isPinned = Boolean(isPinned);

    await post.save();

    const updated = await FeedPost.findById(post._id)      .populate("authorId", "name email profilePicture");

    return NextResponse.json({ success: true, data: { post: updated } });
  } catch (error) {
    console.error("Feed Post PUT Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;
    const post = await FeedPost.findByIdAndDelete(id);

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Feed Post DELETE Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out" });
    
    response.cookies.set("token", "", {
      path: "/",
      maxAge: 0,
    });
    
    response.cookies.set("user", "", {
      path: "/",
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

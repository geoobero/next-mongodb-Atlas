import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "../../auth-helpers";

export async function POST(request) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out" });

    response.cookies.set("token", "", getAuthCookieOptions(0));
    response.cookies.set("user", "", {
      ...getAuthCookieOptions(0),
      httpOnly: false,
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

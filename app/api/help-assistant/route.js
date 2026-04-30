import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../auth-helpers";

const JWT_SECRET = getJwtSecret();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 1500;

function buildSystemPrompt(role) {
  return [
    "You are the EduHub Help Center assistant for a school management system.",
    `The current user role is: ${role}.`,
    "Your job is to help the user understand common school-management workflows such as attendance concerns, enrollment questions, notifications, issue reports, and navigation inside the EduHub app.",
    "Give short, practical, calm answers.",
    "If the user reports a serious account, attendance, or student-record problem, advise them to submit or continue an issue report to the school admin team.",
    "Do not invent school policies, deadlines, or legal requirements.",
    "If you are unsure, say what you do not know and suggest contacting the school admin through the Help Center report form.",
  ].join(" ");
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => message && ["user", "assistant"].includes(message.role))
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0);
}

function toResponseMessage(message) {
  return {
    role: message.role,
    content: [
      {
        type: message.role === "assistant" ? "output_text" : "input_text",
        text: message.content,
      },
    ],
  };
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

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!["parent", "admin"].includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const messages = normalizeMessages(body.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json(
        { success: false, error: "A user message is required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: buildSystemPrompt(decoded.role) }],
          },
          ...messages.map(toResponseMessage),
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error?.message || "Failed to get assistant response" },
        { status: response.status }
      );
    }

    const reply = (data.output_text || "").trim();

    if (!reply) {
      return NextResponse.json(
        { success: false, error: "Assistant returned an empty response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        model: OPENAI_MODEL,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process assistant request" },
      { status: 500 }
    );
  }
}

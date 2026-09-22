import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Attach authenticated user ID if logged in
    const { userId } = await auth();

    const payload = {
      ...body,
      user_id: userId ?? null,
    };

    // Basic server-side validation before hitting backend
    const name = (payload.name ?? "").trim();
    const email = (payload.email ?? "").trim();
    const subject = (payload.subject ?? "").trim();
    const message = (payload.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { detail: "All fields are required" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { detail: "Invalid email address" },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { detail: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Contact proxy error:", error);
    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 }
    );
  }
}

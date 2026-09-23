import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export async function POST() {
  try {
    const cookieStore = await cookies();

    if (cookieStore.get("aegis_demo")?.value !== "1") {
      return NextResponse.json(
        { detail: "Demo session required" },
        { status: 403 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/demo/simulate`, {
      method: "POST",
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Demo simulation error:", error);
    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 },
    );
  }
}

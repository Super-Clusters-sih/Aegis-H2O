import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

/**
 * Protected proxy for /api/history with pagination support
 * Requires Clerk auth + approved company status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isDemo = cookieStore.get("aegis_demo")?.value === "1";
    const { userId } = await auth();

    if (!userId && !isDemo) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = userId === process.env.AEGIS_ADMIN_CLERK_USER_ID;

    if (!isDemo && !isAdmin) {
      const statusRes = await fetch(
        `${BACKEND_URL}/api/companies/status/${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );

      if (statusRes.status === 404) {
        return NextResponse.json({ detail: "Not registered" }, { status: 403 });
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.company?.status !== "approved") {
          return NextResponse.json(
            { detail: "Access not approved" },
            { status: 403 }
          );
        }
      }
    }

    // Forward pagination params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "50";
    const offset = searchParams.get("offset") ?? "0";

    const response = await fetch(
      `${BACKEND_URL}/api/history?limit=${limit}&offset=${offset}`,
      { cache: "no-store" }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("History proxy error:", error);
    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 }
    );
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    // Require Clerk authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const companyName = typeof body.company_name === "string" ? body.company_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
    const orgType = typeof body.org_type === "string" ? body.org_type.trim() : undefined;
    const reasonForAccess = typeof body.reason_for_access === "string" ? body.reason_for_access.trim() : undefined;

    if (!companyName || companyName.length > 255) {
      return NextResponse.json(
        { detail: "Organization name is required (max 255 characters)" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@") || email.length > 255) {
      return NextResponse.json(
        { detail: "A valid email address is required" },
        { status: 400 }
      );
    }

    const allowedOrgTypes = ["College", "School", "Business", "Research Organization", "Other"];
    if (orgType && !allowedOrgTypes.includes(orgType)) {
      return NextResponse.json(
        { detail: "Invalid organization type" },
        { status: 400 }
      );
    }

    // Force the clerk_user_id from the authenticated session —
    // never trust the client-supplied value
    const payload = {
      clerk_user_id: userId,
      company_name: companyName,
      email,
      full_name: fullName || null,
      org_type: orgType || null,
      reason_for_access: reasonForAccess || null,
    };

    const response = await fetch(
      `${BACKEND_URL}/api/companies/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Company register proxy error:", error);
    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 }
    );
  }
}

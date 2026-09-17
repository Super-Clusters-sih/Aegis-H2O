import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type AdminContext =
  | { ok: true; userId: string; adminKey: string }
  | { ok: false; response: NextResponse };

async function getAdminContext(): Promise<AdminContext> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ detail: "Unauthorized" }, { status: 401 }) };
  }
  if (!process.env.AEGIS_ADMIN_CLERK_USER_ID || userId !== process.env.AEGIS_ADMIN_CLERK_USER_ID) {
    return { ok: false, response: NextResponse.json({ detail: "Forbidden" }, { status: 403 }) };
  }
  const adminKey = process.env.AEGIS_ADMIN_API_KEY;
  if (!adminKey) {
    return { ok: false, response: NextResponse.json({ detail: "Server admin configuration is missing" }, { status: 500 }) };
  }
  return { ok: true, userId, adminKey };
}

export async function GET() {
  try {
    const context = await getAdminContext();
    if (!context.ok) return context.response;
    const response = await fetch(`${BACKEND_URL}/api/admin/companies`, {
      headers: { "x-admin-key": context.adminKey },
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin companies GET error:", error);
    return NextResponse.json({ detail: "Could not connect to the backend" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getAdminContext();
    if (!context.ok) return context.response;
    const body = await request.json();
    const companyId = Number(body.company_id);
    const status = body.status;
    const allowedStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!Number.isInteger(companyId) || !allowedStatuses.includes(status)) {
      return NextResponse.json({ detail: "Invalid company ID or status" }, { status: 400 });
    }
    const response = await fetch(`${BACKEND_URL}/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": context.adminKey },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin companies PATCH error:", error);
    return NextResponse.json({ detail: "Could not connect to the backend" }, { status: 502 });
  }
}

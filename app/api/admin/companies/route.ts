import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type AdminContext =
  | {
      ok: true;
      userId: string;
      adminKey: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

async function getAdminContext(): Promise<AdminContext> {
  const { userId } = await auth();

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const adminUserId = process.env.AEGIS_ADMIN_CLERK_USER_ID;

  if (!adminUserId || userId !== adminUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  const adminKey = process.env.AEGIS_ADMIN_API_KEY;

  if (!adminKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "Server admin configuration is missing" },
        { status: 500 }
      ),
    };
  }

  return {
    ok: true,
    userId,
    adminKey,
  };
}

export async function GET() {
  try {
    const context = await getAdminContext();

    if (context.ok === false) {
      return context.response;
    }

    const response = await fetch(
      `${BACKEND_URL}/api/admin/companies`,
      {
        method: "GET",
        headers: {
          "x-admin-key": context.adminKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Admin companies GET error:", error);

    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getAdminContext();

    if (context.ok === false) {
      return context.response;
    }

    const body = await request.json();

    const companyId = Number(body.company_id);
    const status = body.status;
    const rejectionReason =
      typeof body.rejection_reason === "string"
        ? body.rejection_reason.trim()
        : null;

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "suspended",
    ];

    if (
      !Number.isInteger(companyId) ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { detail: "Invalid company ID or status" },
        { status: 400 }
      );
    }

    if (status === "rejected" && (!rejectionReason || rejectionReason.length < 3)) {
      return NextResponse.json(
        { detail: "A valid rejection reason is required (minimum 3 characters)" },
        { status: 400 }
      );
    }

    const payload: {
      status: string;
      approved_by?: string;
      rejection_reason?: string | null;
    } = {
      status,
    };

    if (status === "approved") {
      payload.approved_by = context.userId;
      payload.rejection_reason = null;
    } else if (status === "rejected") {
      payload.rejection_reason = rejectionReason;
    }

    const response = await fetch(
      `${BACKEND_URL}/api/admin/companies/${companyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": context.adminKey,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Record in admin audit log
      try {
        await fetch(`${BACKEND_URL}/api/admin/audit-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": context.adminKey,
          },
          body: JSON.stringify({
            admin_clerk_id: context.userId,
            action: `COMPANY_STATUS_${status.toUpperCase()}`,
            target_company_id: companyId,
            notes:
              status === "rejected"
                ? `Rejected with reason: ${rejectionReason}`
                : `Status updated to ${status} by admin`,
          }),
          cache: "no-store",
        });
      } catch (logErr) {
        console.error("Failed to write to admin audit log:", logErr);
      }
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Admin companies PATCH error:", error);

    return NextResponse.json(
      { detail: "Could not connect to the backend" },
      { status: 502 }
    );
  }
}
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  const adminUserId = process.env.AEGIS_ADMIN_CLERK_USER_ID;

  return NextResponse.json({
    authenticated: Boolean(userId),
    hasUserId: Boolean(userId),
    hasAdminId: Boolean(adminUserId),
    isAdmin: Boolean(userId && adminUserId && userId === adminUserId),
    userIdPreview: userId
      ? `${userId.slice(0, 8)}...`
      : null,
  });
}
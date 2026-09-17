import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  return NextResponse.json({
    authenticated: Boolean(userId),
    hasUserId: Boolean(userId),
    hasAdminId: Boolean(process.env.AEGIS_ADMIN_CLERK_USER_ID),
    userIdPreview: userId
      ? `${userId.slice(0, 8)}...`
      : null,
  });
}
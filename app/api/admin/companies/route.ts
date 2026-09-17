import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    source: "next-admin-route",
    test: true,
  });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    source: "next-admin-route",
    test: true,
    method: request.method,
  });
}
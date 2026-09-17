import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

const BACKEND_URL =
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function isApproved(userId: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/companies/status/${encodeURIComponent(userId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return false;
    const data = await response.json();
    return data.company?.status === "approved";
  } catch {
    return false;
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (userId === process.env.AEGIS_ADMIN_CLERK_USER_ID) redirect("/admin");
  if (!(await isApproved(userId))) redirect("/");

  return <DashboardClient />;
}

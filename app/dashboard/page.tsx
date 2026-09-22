import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.AEGIS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function getCompanyStatus(userId: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/companies/status/${encodeURIComponent(userId)}`,
      { cache: "no-store" },
    );

    if (response.status === 404) return "not_registered";
    if (!response.ok) return "unknown";

    const data = await response.json();
    return data.company?.status ?? "pending";
  } catch {
    return "unknown";
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // Admin access redirects to admin dashboard
  if (userId === process.env.AEGIS_ADMIN_CLERK_USER_ID) {
    redirect("/admin");
  }

  const status = await getCompanyStatus(userId);

  if (status === "approved") {
    return <DashboardClient />;
  }

  if (status === "not_registered") {
    redirect("/register-company");
  }

  // Pending, rejected, or suspended
  redirect("/pending-approval");
}

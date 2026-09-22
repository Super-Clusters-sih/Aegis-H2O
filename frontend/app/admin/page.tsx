import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const adminUserId = process.env.AEGIS_ADMIN_CLERK_USER_ID;

  if (!adminUserId) {
    throw new Error(
      "AEGIS_ADMIN_CLERK_USER_ID is not configured.",
    );
  }

  if (userId !== adminUserId) {
    redirect("/unauthorized");
  }

  return <AdminClient />;
}
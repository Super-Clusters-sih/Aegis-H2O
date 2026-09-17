import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (userId !== process.env.AEGIS_ADMIN_CLERK_USER_ID) redirect("/");
  return <AdminClient />;
}

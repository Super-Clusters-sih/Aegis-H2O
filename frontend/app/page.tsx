import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 text-3xl text-white">
            💧
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Aegis <span className="rainbow-text">H2O</span>
          </h1>
          <p className="mt-4 text-slate-500">
            Intelligent water monitoring with real-time sensors and machine-learning predictions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-in"
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
            >
              Create account
            </Link>
          </div>
          <Link
            href="/api/demo/start"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-6 py-3 text-sm font-bold text-teal-700 transition hover:border-teal-300 hover:bg-teal-100 sm:w-auto"
          >
            Continue with Demo Account
          </Link>
          <p className="mt-3 text-xs text-slate-400">
            Demo access for evaluation purposes only. No registration or admin approval required.
          </p>
        </div>
      </main>
    );
  }

  if (userId === process.env.AEGIS_ADMIN_CLERK_USER_ID) {
    redirect("/admin");
  }

  const status = await getCompanyStatus(userId);

  if (status === "approved") redirect("/dashboard");
  if (status === "pending") redirect("/pending-approval");
  if (status === "rejected" || status === "suspended") redirect("/pending-approval");
  if (status === "not_registered") redirect("/register-company");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-black text-slate-900">Aegis H2O</h1>
        <p className="mt-3 text-slate-500">We could not check your company status. Please refresh and try again.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white">Try again</Link>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">
          !
        </div>

        <h1 className="mt-6 text-2xl font-black text-slate-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          You do not have permission to access the administrator dashboard.
          Please sign in with an authorized administrator account.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Go to Home
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
          >
            User Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 text-3xl font-black text-white shadow-md">
          404
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Page Not Found
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          The telemetry endpoint, monitoring dashboard view, or resource you requested does not exist or has been relocated.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

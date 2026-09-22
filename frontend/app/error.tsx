"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600 border border-rose-200">
          ⚠️
        </div>

        <h1 className="text-xl font-black text-slate-900">
          System Encountered an Error
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {error.message || "An unexpected error occurred while loading this view."}
        </p>

        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-slate-400">
            Error Digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}

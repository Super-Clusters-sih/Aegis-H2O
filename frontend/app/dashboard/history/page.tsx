"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/Sidebar";

type HistoryItem = {
  id: number;
  timestamp: string;
  ph: number;
  tds_mgl: number;
  flow_lpm: number;
  turbidity_ntu: number;
  photodiode_mv: number;
  water_health: string;
  filter_status: string;
};

type HistoryResponse = {
  total: number;
  limit: number;
  offset: number;
  readings: HistoryItem[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PredictionHistoryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [readings, setReadings] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    const offset = targetPage * pageSize;

    try {
      const response = await fetch(
        `/api/history?limit=${pageSize}&offset=${offset}`,
        { cache: "no-store" }
      );

      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }

      if (response.status === 403) {
        router.replace("/pending-approval");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to retrieve prediction history.");
      }

      const data: HistoryResponse | HistoryItem[] = await response.json();

      if (Array.isArray(data)) {
        setReadings(data);
        setTotal(data.length);
      } else {
        setReadings(data.readings ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "History fetch failed.");
    } finally {
      setLoading(false);
    }
  }, [router, pageSize]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    fetchHistory(page);
  }, [isLoaded, user, router, page, fetchHistory]);

  if (!isLoaded || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold">Loading telemetry history...</p>
        </div>
      </main>
    );
  }

  const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_CLERK_ID;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                  Telemetry Archive
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {total.toLocaleString()} Records
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                Prediction & Sensor History
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Historical sensor readings logged into PostgreSQL with AI water health and filter classifications.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchHistory(page)}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
              >
                Live Dashboard &rarr;
              </Link>
            </div>
          </header>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchHistory(page)}
                className="font-bold underline ml-3 hover:text-rose-950"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">pH Level</th>
                    <th className="px-4 py-3">TDS (mg/L)</th>
                    <th className="px-4 py-3">Flow (L/min)</th>
                    <th className="px-4 py-3">Turbidity (NTU)</th>
                    <th className="px-4 py-3">Photodiode (mV)</th>
                    <th className="px-4 py-3">Water Health</th>
                    <th className="px-4 py-3">Filter Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                          <span>Loading records from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : readings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                        No sensor readings found in database.
                      </td>
                    </tr>
                  ) : (
                    readings.map((r) => {
                      const healthClass =
                        r.water_health === "Safe"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.water_health === "Moderate"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200";

                      const filterClass =
                        r.filter_status === "Good"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.filter_status === "Normal"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : r.filter_status === "Degraded"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200";

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-500">
                            {formatDate(r.timestamp)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {Number(r.ph).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {Number(r.tds_mgl).toFixed(1)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {Number(r.flow_lpm).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {Number(r.turbidity_ntu).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {Number(r.photodiode_mv).toFixed(1)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${healthClass}`}
                            >
                              {r.water_health}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${filterClass}`}
                            >
                              {r.filter_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span>
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> (
                {total.toLocaleString()} total items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  &larr; Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

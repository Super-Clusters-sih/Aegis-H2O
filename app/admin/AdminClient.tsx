"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Company = {
  id: number;
  clerk_user_id: string;
  company_name: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
};

const statusOptions = ["pending", "approved", "rejected", "suspended"] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadCompanies() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/companies", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to load companies");
      }

      setCompanies(Array.isArray(data) ? data : data.companies ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load companies");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(companyId: number, status: Company["status"]) {
    setUpdatingId(companyId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to update company");
      }

      setCompanies((current) =>
        current.map((company) =>
          company.id === companyId ? { ...company, status } : company,
        ),
      );
      setMessage(`Company status updated to ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update company");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Aegis H2O
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin approval panel</h1>
            <p className="mt-2 text-slate-600">
              Review company registrations and control dashboard access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCompanies}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <UserButton />
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Registered companies ({companies.length})</h2>
          </div>

          {loading ? (
            <p className="px-5 py-8 text-slate-600">Loading company registrations...</p>
          ) : companies.length === 0 ? (
            <p className="px-5 py-8 text-slate-600">No company registrations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{company.company_name}</p>
                        <p className="mt-1 text-xs text-slate-500">ID: {company.id}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{company.email}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(company.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {company.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={company.status}
                          disabled={updatingId === company.id}
                          onChange={(event) =>
                            updateStatus(company.id, event.target.value as Company["status"])
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

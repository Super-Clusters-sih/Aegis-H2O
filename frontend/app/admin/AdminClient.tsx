"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Company = {
  id: number;
  clerk_user_id: string;
  company_name: string;
  email: string;
  full_name?: string | null;
  org_type?: string | null;
  reason_for_access?: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason?: string | null;
  created_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
};

type ConfirmationModalState = {
  isOpen: boolean;
  type: "approve" | "reject" | "suspend" | null;
  company: Company | null;
  rejectionReason: string;
  submitting: boolean;
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedReasonId, setExpandedReasonId] = useState<number | null>(null);

  // Confirmation Modal State
  const [modal, setModal] = useState<ConfirmationModalState>({
    isOpen: false,
    type: null,
    company: null,
    rejectionReason: "",
    submitting: false,
  });

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/companies", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to load company registrations.");
      }

      setCompanies(Array.isArray(data) ? data : data.companies ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load company registrations.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const response = await fetch("/api/admin/companies", { cache: "no-store" });
        const data = await response.json();
        if (ignore) return;
        if (!response.ok) {
          setFeedback({
            type: "error",
            text: data.detail ?? "Unable to load company registrations.",
          });
        } else {
          setCompanies(Array.isArray(data) ? data : data.companies ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setFeedback({
            type: "error",
            text: error instanceof Error ? error.message : "Unable to load company registrations.",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  // Open confirmation modal for sensitive action
  function openConfirm(type: "approve" | "reject" | "suspend", company: Company) {
    setModal({
      isOpen: true,
      type,
      company,
      rejectionReason: company.rejection_reason ?? "",
      submitting: false,
      error: undefined,
    });
  }

  function closeModal() {
    if (modal.submitting) return;
    setModal({
      isOpen: false,
      type: null,
      company: null,
      rejectionReason: "",
      submitting: false,
      error: undefined,
    });
  }

  // Execute confirmed status update
  async function handleConfirmAction() {
    if (!modal.company || !modal.type) return;

    const companyId = modal.company.id;
    const targetStatus =
      modal.type === "approve"
        ? "approved"
        : modal.type === "reject"
        ? "rejected"
        : "suspended";

    if (modal.type === "reject" && modal.rejectionReason.trim().length < 3) {
      setModal((prev) => ({
        ...prev,
        error: "Please enter a valid rejection reason (minimum 3 characters).",
      }));
      return;
    }

    setModal((prev) => ({ ...prev, submitting: true, error: undefined }));

    try {
      const response = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          status: targetStatus,
          rejection_reason:
            modal.type === "reject" ? modal.rejectionReason.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? `Failed to update status to ${targetStatus}`);
      }

      setCompanies((current) =>
        current.map((c) =>
          c.id === companyId
            ? {
                ...c,
                status: targetStatus,
                rejection_reason:
                  modal.type === "reject" ? modal.rejectionReason.trim() : null,
                approved_at:
                  targetStatus === "approved" ? new Date().toISOString() : c.approved_at,
              }
            : c
        )
      );

      setFeedback({
        type: "success",
        text: `Company "${modal.company.company_name}" has been ${targetStatus}. Action logged.`,
      });

      closeModal();
    } catch (err) {
      setModal((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : "Action failed.",
      }));
    }
  }

  // Metrics computation
  const stats = useMemo(() => {
    const total = companies.length;
    const pending = companies.filter((c) => c.status === "pending").length;
    const approved = companies.filter((c) => c.status === "approved").length;
    const rejected = companies.filter((c) => c.status === "rejected").length;
    const suspended = companies.filter((c) => c.status === "suspended").length;
    return { total, pending, approved, rejected, suspended };
  }, [companies]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // Status filter
      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.company_name?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesContact = c.full_name?.toLowerCase().includes(q);
        const matchesOrg = c.org_type?.toLowerCase().includes(q);
        return Boolean(matchesName || matchesEmail || matchesContact || matchesOrg);
      }

      return true;
    });
  }, [companies, statusFilter, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 text-sm font-black text-white">
                💧
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                Aegis H2O Administration
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Company Access & Verification
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Authorize organization access, review intended use, and manage telemetry permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              View Live Dashboard &rarr;
            </Link>
            <button
              onClick={loadCompanies}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
            <UserButton />
          </div>
        </header>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-sm font-medium ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Statistics Cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              statusFilter === "pending"
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200 bg-white hover:border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
              {stats.pending > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-black text-amber-900">{stats.pending}</p>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              statusFilter === "approved"
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved</p>
            <p className="mt-2 text-2xl font-black text-emerald-900">{stats.approved}</p>
          </div>

          <div
            onClick={() => setStatusFilter("rejected")}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              statusFilter === "rejected"
                ? "border-rose-400 bg-rose-50"
                : "border-slate-200 bg-white hover:border-rose-200"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</p>
            <p className="mt-2 text-2xl font-black text-rose-900">{stats.rejected}</p>
          </div>

          <div
            onClick={() => setStatusFilter("suspended")}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              statusFilter === "suspended"
                ? "border-orange-400 bg-orange-50"
                : "border-slate-200 bg-white hover:border-orange-200"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Suspended</p>
            <p className="mt-2 text-2xl font-black text-orange-900">{stats.suspended}</p>
          </div>
        </section>

        {/* Filter and Search Controls */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "pending", "approved", "rejected", "suspended"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                  statusFilter === s
                    ? "bg-slate-900 text-white shadow"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s === "all" ? "All Requests" : s}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, org..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </section>

        {/* Main Registrations Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Registrations ({filteredCompanies.length} of {companies.length})
            </h2>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              Loading company records...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No registration requests match the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Organization</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Intended Use / Details</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((c) => {
                    const isExpanded = expandedReasonId === c.id;

                    return (
                      <tr key={c.id} className="align-top hover:bg-slate-50/70 transition">
                        {/* Organization */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">{c.company_name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {c.org_type && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {c.org_type}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">ID #{c.id}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {c.full_name || "—"}
                          </p>
                          <p className="mt-0.5 text-slate-500">{c.email}</p>
                        </td>

                        {/* Intended Use / Notes */}
                        <td className="px-5 py-4 max-w-xs">
                          {c.reason_for_access ? (
                            <div>
                              <p
                                className={`text-slate-600 ${
                                  !isExpanded ? "line-clamp-2" : ""
                                }`}
                              >
                                {c.reason_for_access}
                              </p>
                              {c.reason_for_access.length > 80 && (
                                <button
                                  onClick={() =>
                                    setExpandedReasonId(isExpanded ? null : c.id)
                                  }
                                  className="mt-1 text-[10px] font-bold text-teal-700 hover:underline"
                                >
                                  {isExpanded ? "Show less" : "Read full reason"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No notes provided</span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(c.created_at)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4">
                          {c.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}

                          {c.status === "approved" && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Approved
                              </span>
                              {c.approved_at && (
                                <p className="mt-1 text-[10px] text-slate-400">
                                  {formatDate(c.approved_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {c.status === "rejected" && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                Rejected
                              </span>
                              {c.rejection_reason && (
                                <p className="mt-1 text-[10px] text-rose-600 max-w-xs truncate" title={c.rejection_reason}>
                                  Reason: {c.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}

                          {c.status === "suspended" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-800">
                              <span className="h-2 w-2 rounded-full bg-orange-500" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Actions with Confirmation */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status !== "approved" && (
                              <button
                                onClick={() => openConfirm("approve", c)}
                                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                              >
                                Approve
                              </button>
                            )}

                            {c.status !== "rejected" && (
                              <button
                                onClick={() => openConfirm("reject", c)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            )}

                            {c.status === "approved" && (
                              <button
                                onClick={() => openConfirm("suspend", c)}
                                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-700 hover:bg-orange-100 transition"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CONFIRMATION MODAL */}
        {modal.isOpen && modal.company && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {modal.type === "approve" && "Confirm Organization Approval"}
                  {modal.type === "reject" && "Reject Organization Request"}
                  {modal.type === "suspend" && "Confirm Access Suspension"}
                </h3>
                <button
                  onClick={closeModal}
                  disabled={modal.submitting}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-600">
                  Target Organization:{" "}
                  <strong className="text-slate-900">{modal.company.company_name}</strong>{" "}
                  ({modal.company.email})
                </p>

                {modal.type === "approve" && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Approving this request will immediately grant the organization access to the
                    live sensor streams, AI water health analysis, and prediction history.
                  </p>
                )}

                {modal.type === "suspend" && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Suspending access will immediately block users from viewing live dashboard data.
                    You can re-approve access at any time.
                  </p>
                )}

                {modal.type === "reject" && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Reason for Rejection <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={modal.rejectionReason}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          rejectionReason: e.target.value,
                          error: undefined,
                        }))
                      }
                      placeholder="Explain why this request is being rejected (e.g. invalid organization credentials, incomplete contact info, unverified intent)..."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      This reason will be visible to the user on their pending approval page.
                    </p>
                  </div>
                )}

                {modal.error && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                    {modal.error}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={closeModal}
                  disabled={modal.submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmAction}
                  disabled={modal.submitting}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                    modal.type === "approve"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : modal.type === "reject"
                      ? "bg-rose-700 hover:bg-rose-800"
                      : "bg-orange-700 hover:bg-orange-800"
                  }`}
                >
                  {modal.submitting
                    ? "Updating..."
                    : modal.type === "approve"
                    ? "Confirm Approval"
                    : modal.type === "reject"
                    ? "Confirm Rejection"
                    : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

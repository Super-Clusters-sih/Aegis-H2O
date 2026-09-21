"use client";

import { useUser, UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../components/Sidebar";

type CompanyDetails = {
  id: number;
  company_name: string;
  email: string;
  full_name?: string | null;
  org_type?: string | null;
  reason_for_access?: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason?: string | null;
  created_at?: string;
  approved_at?: string | null;
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [showClerkProfile, setShowClerkProfile] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    let active = true;

    async function fetchCompanyStatus() {
      try {
        const res = await fetch("/api/companies/status", { cache: "no-store" });
        if (active && res.ok) {
          const data = await res.json();
          if (data.company) {
            setCompany(data.company);
          }
        }
      } catch (err) {
        console.error("Failed to load company profile:", err);
      } finally {
        if (active) setLoadingCompany(false);
      }
    }

    fetchCompanyStatus();

    return () => {
      active = false;
    };
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold">Loading profile...</p>
        </div>
      </main>
    );
  }

  const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_CLERK_ID;
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? "—";
  const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Account Profile
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage your personal credentials, identity, and organization access tier.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* User Info Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-1">
              <div className="flex flex-col items-center text-center">
                {user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt={fullName}
                    className="h-20 w-20 rounded-full border-2 border-teal-500 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-violet-600 text-2xl font-bold text-white shadow-sm">
                    {fullName.charAt(0)}
                  </div>
                )}

                <h2 className="mt-4 text-base font-bold text-slate-900">
                  {fullName}
                </h2>
                <p className="text-xs text-slate-500">{primaryEmail}</p>

                {isAdmin && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 border border-violet-200">
                    System Administrator
                  </span>
                )}

                <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2 text-slate-600">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Account ID
                    </span>
                    <span className="font-mono text-[11px] truncate block" title={user.id}>
                      {user.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Joined
                    </span>
                    <span>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowClerkProfile(!showClerkProfile)}
                  className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  {showClerkProfile ? "Close Security Profile" : "Manage Security & Password"}
                </button>
              </div>
            </section>

            {/* Organization & Access Details */}
            <section className="space-y-6 md:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Organization Membership
                </h3>

                {loadingCompany ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Loading organization status...
                  </div>
                ) : !company ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-xs text-slate-500">
                      You have not registered an organization yet.
                    </p>
                    <Link
                      href="/register-company"
                      className="mt-3 inline-block rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                    >
                      Register Organization
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Organization
                        </span>
                        <span className="text-sm font-bold text-slate-900 block mt-0.5">
                          {company.company_name}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Organization Type
                        </span>
                        <span className="text-sm font-bold text-slate-900 block mt-0.5">
                          {company.org_type || "Standard Organization"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Monitoring Access Status
                          </span>
                          <span className="text-sm font-bold text-slate-900 block mt-0.5 capitalize">
                            {company.status}
                          </span>
                        </div>

                        {company.status === "approved" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Active Access
                          </span>
                        )}

                        {company.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            Awaiting Approval
                          </span>
                        )}

                        {company.status === "rejected" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Request Rejected
                          </span>
                        )}

                        {company.status === "suspended" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800 border border-orange-200">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Access Suspended
                          </span>
                        )}
                      </div>

                      {company.rejection_reason && company.status === "rejected" && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-800">
                          <strong className="block text-[11px]">Administrator Note:</strong>
                          {company.rejection_reason}
                        </div>
                      )}
                    </div>

                    {company.reason_for_access && (
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Registered Intended Use
                        </span>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {company.reason_for_access}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Registration ID: #{company.id}</span>
                      {company.approved_at && (
                        <span>Approved: {new Date(company.approved_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation links */}
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  &larr; Back to Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  Configure System Settings &rarr;
                </Link>
              </div>
            </section>
          </div>

          {/* Embedded Clerk UserProfile Modal/Section */}
          {showClerkProfile && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Clerk Security & Profile Editor
                </h3>
                <button
                  onClick={() => setShowClerkProfile(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Close &times;
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <UserProfile routing="hash" />
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

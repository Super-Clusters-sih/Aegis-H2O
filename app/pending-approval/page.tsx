"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CompanyInfo = {
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

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) {
      router.replace("/sign-in");
      return;
    }

    let active = true;

    const checkStatus = async () => {
      try {
        // Query Next.js proxy route — never call FastAPI directly
        const response = await fetch("/api/companies/status", {
          cache: "no-store",
        });

        if (response.status === 404) {
          if (active) router.replace("/register-company");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not check approval status");
        }

        const data = await response.json();
        const comp = data.company as CompanyInfo | undefined;

        if (!active) return;

        if (comp) {
          setCompany(comp);
          setErrorMessage("");
          setLastChecked(new Date());

          if (comp.status === "approved") {
            // Auto redirect to dashboard when approved
            router.replace("/dashboard");
          }
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Status check failed"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    checkStatus();

    // Poll every 5 seconds
    const interval = window.setInterval(checkStatus, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLoaded, user?.id, router]);

  if (!isLoaded || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading approval status...</p>
        </div>
      </main>
    );
  }

  const status = company?.status ?? "pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Top bar with branding and UserButton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 text-2xl text-white shadow-md">
              💧
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Aegis <span className="rainbow-text">H2O</span>
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Intelligent Water Monitoring System
              </p>
            </div>
          </div>
          <UserButton />
        </div>

        {/* Company Overview Card */}
        {company && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Organization
                </p>
                <p className="text-base font-bold text-slate-900">
                  {company.company_name}
                </p>
              </div>
              {company.org_type && (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {company.org_type}
                </span>
              )}
            </div>
            {company.full_name && (
              <p className="mt-1 text-xs text-slate-600">
                Contact: <span className="font-medium">{company.full_name}</span> ({company.email})
              </p>
            )}
          </div>
        )}

        {/* STATUS CARD: PENDING */}
        {status === "pending" && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Pending Approval
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-amber-950">
              Your registration is under administrator review
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              Access to real-time telemetry and ML analytics requires verification.
              An administrator will review your organization&apos;s request shortly.
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-amber-200/60 pt-3 text-xs text-amber-700">
              <span>Checking automatically every 5s</span>
              <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* STATUS CARD: APPROVED */}
        {status === "approved" && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Approved
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-emerald-950">
              Access Granted!
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              Your organization has been approved. You now have full access to the live sensor feeds and ML predictions.
            </p>

            <div className="mt-5">
              <Link
                href="/dashboard"
                className="inline-block rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800 transition"
              >
                Go to Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* STATUS CARD: REJECTED */}
        {status === "rejected" && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 rounded-full bg-rose-500" />
              <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                Registration Rejected
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-rose-950">
              Your access request could not be approved
            </h2>

            {company?.rejection_reason ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-white/80 p-3 text-sm text-rose-900">
                <span className="font-semibold block text-xs uppercase tracking-wider text-rose-600 mb-1">
                  Reason provided by administrator:
                </span>
                {company.rejection_reason}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-rose-800">
                No specific reason was provided by the administrator.
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-800 transition"
              >
                Contact Support / Administrator
              </Link>
            </div>
          </div>
        )}

        {/* STATUS CARD: SUSPENDED */}
        {status === "suspended" && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/80 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 rounded-full bg-orange-500" />
              <span className="text-xs font-black uppercase tracking-wider text-orange-800">
                Access Suspended
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-orange-950">
              Your organization access is temporarily suspended
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-orange-800">
              An administrator has paused your organization&apos;s monitoring access. Please get in touch with our team if you believe this is an error.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-orange-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-800 transition"
              >
                Contact Administration
              </Link>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <p className="mt-4 text-xs font-semibold text-rose-600">
            {errorMessage}
          </p>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition">
            &larr; Back to Home
          </Link>
          <Link href="/contact" className="hover:text-teal-700 transition">
            Need Help? Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}

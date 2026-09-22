"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ORG_TYPES = [
  "College",
  "School",
  "Business",
  "Research Organization",
  "Other",
] as const;

export default function RegisterCompanyPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [customFullName, setCustomFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [orgType, setOrgType] = useState<string>("Business");
  const [reasonForAccess, setReasonForAccess] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const defaultFullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const fullName = customFullName ?? defaultFullName;

  // Check if already registered
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    // Check if user is already registered via Next.js proxy route
    let active = true;
    async function checkStatus() {
      try {
        const res = await fetch("/api/companies/status", { cache: "no-store" });
        if (active && res.ok) {
          const data = await res.json();
          if (data.company?.status) {
            router.replace(
              data.company.status === "approved"
                ? "/dashboard"
                : "/pending-approval"
            );
            return;
          }
        }
      } catch (err) {
        console.error("Status check error:", err);
      } finally {
        if (active) setCheckingExisting(false);
      }
    }

    checkStatus();

    return () => {
      active = false;
    };
  }, [isLoaded, user, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    const cleanCompanyName = companyName.trim();
    const cleanFullName = fullName.trim();
    const cleanReason = reasonForAccess.trim();

    // Client-side validation
    if (!cleanCompanyName) {
      setMessage("Please enter your organization or company name.");
      return;
    }

    if (cleanCompanyName.length > 255) {
      setMessage("Organization name must be under 255 characters.");
      return;
    }

    if (!email) {
      setMessage("Your account does not have a verified email address.");
      return;
    }

    if (!ORG_TYPES.includes(orgType as (typeof ORG_TYPES)[number])) {
      setMessage("Please select a valid organization type.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Call Next.js proxy route — never call FastAPI directly from client
      const response = await fetch("/api/companies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: cleanCompanyName,
          email,
          full_name: cleanFullName || undefined,
          org_type: orgType,
          reason_for_access: cleanReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Registration request failed.");
      }

      setIsSuccess(true);
      setMessage(
        data.status === "already_registered"
          ? "Account is already registered. Redirecting to approval status..."
          : "Your access request has been submitted successfully! Redirecting..."
      );

      setTimeout(() => {
        router.replace("/pending-approval");
      }, 1500);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to submit registration."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || checkingExisting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm font-medium">Checking registration status...</p>
        </div>
      </main>
    );
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Header */}
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

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-xl font-bold text-slate-900">
            Request Dashboard Access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Register your organization to access real-time water sensor metrics and ML health analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email (Read-only from Clerk) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Account Email
            </label>
            <input
              type="text"
              value={primaryEmail}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Linked to your authenticated Clerk session.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Contact Person Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setCustomFullName(e.target.value)}
              placeholder="e.g. Dr. Jane Doe"
              maxLength={255}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Company / Org Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Organization / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Water Labs or State University"
              maxLength={255}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Org Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Organization Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {ORG_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Access */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Reason for Access / Intended Use
            </label>
            <textarea
              rows={3}
              value={reasonForAccess}
              onChange={(e) => setReasonForAccess(e.target.value)}
              placeholder="Briefly describe why your organization needs access to Aegis H2O monitoring data (e.g. campus water safety, municipal testing, research)."
              maxLength={2000}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`rounded-xl border p-3 text-xs font-medium ${
                isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Submitting Request..." : "Submit Access Request"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
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

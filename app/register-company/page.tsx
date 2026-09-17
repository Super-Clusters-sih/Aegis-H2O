"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function RegisterCompanyPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoaded && !user) {
    router.replace("/sign-in");
    return null;
  }

  async function submit() {
    if (!user?.id) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!companyName.trim()) return setMessage("Enter your company name.");
    if (!email) return setMessage("Your account does not have an email address.");

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/companies/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          company_name: companyName.trim(),
          email,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Registration failed");
      router.replace("/pending-approval");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 text-2xl text-white">💧</div>
        <h1 className="text-3xl font-black text-slate-900">Aegis <span className="rainbow-text">H2O</span></h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Register your company to request access to the monitoring dashboard.</p>
        <label className="mt-6 block text-sm font-bold text-slate-700">Company name</label>
        <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Enter your company name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        <button onClick={submit} disabled={loading || !isLoaded} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">{loading ? "Submitting..." : "Request dashboard access"}</button>
        {message && <p className="mt-4 text-sm font-medium text-rose-600">{message}</p>}
        <div className="mt-8 flex justify-end"><UserButton /></div>
      </div>
    </main>
  );
}

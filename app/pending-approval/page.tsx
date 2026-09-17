"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type Status = "pending" | "approved" | "rejected" | "suspended" | "not_registered" | null;

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) {
      router.replace("/sign-in");
      return;
    }

    let active = true;
    const check = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/companies/status/${encodeURIComponent(user.id)}`, { cache: "no-store" });
        if (response.status === 404) {
          if (active) router.replace("/register-company");
          return;
        }
        if (!response.ok) throw new Error("Could not check approval status");
        const data = await response.json();
        const nextStatus = data.company?.status as Status;
        if (!active) return;
        setStatus(nextStatus);
        if (nextStatus === "approved") router.replace("/dashboard");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Could not check approval status");
      }
    };

    check();
    const interval = window.setInterval(check, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLoaded, user?.id, router]);

  const heading = status === "rejected" ? "Your company registration was rejected." : status === "suspended" ? "Your company access is suspended." : "Your company registration is awaiting admin approval.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 text-2xl text-white">💧</div>
        <h1 className="text-3xl font-black text-slate-900">Aegis <span className="rainbow-text">H2O</span></h1>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-800">{heading}</p>
          <p className="mt-2 text-sm text-amber-700">This page checks your account automatically every 5 seconds.</p>
        </div>
        {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
        <div className="mt-8 flex justify-end"><UserButton /></div>
      </div>
    </main>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../components/Sidebar";

type ThemeOption = "light" | "dark" | "system";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [theme, setTheme] = useState<ThemeOption>("system");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current theme on mount
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    try {
      const stored = localStorage.getItem("aegis-theme") as ThemeOption | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setTheme(stored);
      }
    } catch {
      // ignore
    }
  }, [isLoaded, user, router]);

  function handleThemeChange(newTheme: ThemeOption) {
    setTheme(newTheme);
    try {
      localStorage.setItem("aegis-theme", newTheme);

      let effectiveTheme = newTheme;
      if (newTheme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      document.documentElement.setAttribute("data-theme", effectiveTheme);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
  }

  if (!isLoaded || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold">Loading settings...</p>
        </div>
      </main>
    );
  }

  const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_CLERK_ID;

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              System Settings
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Configure your visual appearance, telemetry preferences, and monitoring defaults.
            </p>
          </header>

          {saveSuccess && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
              Settings updated successfully. Theme preference applied.
            </div>
          )}

          <div className="space-y-6">
            {/* Theme Preferences */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Appearance & Theme
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose how Aegis H2O looks to you. Select a theme or sync with your system display.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Light Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                    theme === "light"
                      ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-700 mb-3">
                    ☀️
                  </div>
                  <span className="text-sm font-bold text-slate-900">Light Mode</span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    High contrast, clear visibility for daylight conditions.
                  </span>
                </button>

                {/* Dark Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                    theme === "dark"
                      ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg text-slate-200 mb-3">
                    🌙
                  </div>
                  <span className="text-sm font-bold text-slate-900">Dark Mode</span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Reduced glare, optimized for monitoring control rooms.
                  </span>
                </button>

                {/* System Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("system")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                    theme === "system"
                      ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg text-indigo-700 mb-3">
                    💻
                  </div>
                  <span className="text-sm font-bold text-slate-900">System Sync</span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Automatically match your operating system theme.
                  </span>
                </button>
              </div>
            </section>

            {/* Live Telemetry & Refresh Settings */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Telemetry & Polling Rate
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Hardware telemetry configuration and streaming parameters.
              </p>

              <div className="mt-4 space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-800 block">Sensor Refresh Frequency</span>
                    <span className="text-slate-500">Polling rate for real-time sensor metrics</span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-700">
                    2000 ms (2.0s)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-800 block">Machine Learning Inference</span>
                    <span className="text-slate-500">Online classification models: Random Forest & Decision Tree</span>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200">
                    Active (v1.2)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-800 block">Historical Cache Buffer</span>
                    <span className="text-slate-500">Rolling window of local sensor points displayed in chart</span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-700">
                    50 points
                  </span>
                </div>
              </div>
            </section>

            {/* Session Information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Authentication & Session
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Session Provider
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    Clerk Modern Identity (JWT Token Session)
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Data Transmission
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    TLS / HTTPS Encrypted REST API
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                <Link href="/profile" className="font-bold text-teal-700 hover:underline">
                  &larr; View Profile
                </Link>
                <Link href="/dashboard" className="font-bold text-slate-600 hover:text-slate-900">
                  Return to Dashboard &rarr;
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

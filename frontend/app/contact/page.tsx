"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components/Sidebar";

export default function ContactPage() {
  const { user, isLoaded } = useUser();

  const [customName, setCustomName] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
    referenceId?: number;
  } | null>(null);

  const defaultName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "";
  const defaultEmail = user?.primaryEmailAddress?.emailAddress || "";

  const name = customName ?? defaultName;
  const email = customEmail ?? defaultEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // Client-side validations
    if (!cleanName) {
      setResult({ type: "error", text: "Please enter your name." });
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setResult({ type: "error", text: "Please provide a valid email address." });
      return;
    }

    if (!cleanSubject) {
      setResult({ type: "error", text: "Please specify a subject for your inquiry." });
      return;
    }

    if (cleanMessage.length < 10) {
      setResult({
        type: "error",
        text: "Please provide a descriptive message of at least 10 characters.",
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Failed to submit message.");
      }

      setResult({
        type: "success",
        text: "Your message has been securely submitted and logged for the Aegis H2O administration team.",
        referenceId: data.id,
      });

      // Reset message form fields
      setSubject("");
      setMessage("");
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Unable to submit your message.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Contact & Support
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Have questions regarding sensor telemetry, hardware installation, or access verification?
              </p>
            </div>
            {user && <UserButton />}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Support Info Sidebar */}
          <section className="space-y-4 md:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
                Direct Inquiries
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Messages submitted through this portal are saved to our central administrative review queue.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs space-y-3">
              <div>
                <span className="font-bold text-slate-800 block">Project Focus</span>
                <span className="text-slate-500">Intelligent IoT Water Monitoring & ML Classification</span>
              </div>
              <div>
                <span className="font-bold text-slate-800 block">System Availability</span>
                <span className="text-slate-500">24/7 Real-Time Telemetry Pipeline</span>
              </div>
            </div>

            {!user && (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-xs">
                <span className="font-bold text-teal-900 block">Already have an account?</span>
                <p className="mt-1 text-teal-800 text-[11px]">
                  Sign in to link inquiries directly to your registered organization.
                </p>
                <Link
                  href="/sign-in"
                  className="mt-2.5 inline-block rounded-lg bg-teal-700 px-3 py-1.5 font-bold text-white hover:bg-teal-800 transition text-[11px]"
                >
                  Sign In &rarr;
                </Link>
              </div>
            )}
          </section>

          {/* Form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Submit Message
            </h2>

            {result && (
              <div
                className={`mt-4 rounded-xl border p-4 text-xs ${
                  result.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                <p className="font-bold">{result.text}</p>
                {result.referenceId && (
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Inquiry Reference: <strong>#{result.referenceId}</strong>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  maxLength={255}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@organization.com"
                  maxLength={255}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Sensor calibration query or organization approval"
                  maxLength={500}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, request, or issue in detail..."
                  maxLength={5000}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <span className="mt-1 block text-right text-[10px] text-slate-400">
                  {message.length} / 5000 characters
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Send Message"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <Link href="/" className="hover:text-teal-700 transition">
                &larr; Back to Home
              </Link>
              {user && (
                <Link href="/dashboard" className="hover:text-teal-700 transition">
                  Go to Dashboard &rarr;
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  if (isLoaded && user) {
    const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_CLERK_ID;
    return <AppShell isAdmin={isAdmin}>{content}</AppShell>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {content}
    </main>
  );
}

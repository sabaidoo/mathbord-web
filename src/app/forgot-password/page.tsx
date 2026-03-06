"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show the success message regardless of whether the email
      // was found — this prevents email enumeration
      if (res.ok || res.status === 404) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl text-navy"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}
          >
            Mathbord
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Right Tutor. Right Plan. Visible Progress.
          </p>
        </div>

        <div className="bg-white rounded-card border border-gray-200 shadow-sm p-8">
          {submitted ? (
            <div className="text-center">
              {/* Check icon */}
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#06A5FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                If an account exists for{" "}
                <strong className="text-navy">{email}</strong>, we&apos;ve
                sent a password reset link. It will expire in&nbsp;1&nbsp;hour.
              </p>
              <a
                href="/login"
                className="mt-6 inline-block text-sm text-teal hover:underline"
              >
                Back to sign in
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-navy mb-1">
                Forgot your password?
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-[6px]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-teal text-white text-sm font-semibold rounded-btn hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <a
                  href="/login"
                  className="text-xs text-gray-500 hover:text-teal transition-colors"
                >
                  Back to sign in
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

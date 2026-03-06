"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No reset token found. Please request a new password reset link."
      );
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        // Redirect to login after a short delay
        setTimeout(() => router.push("/login"), 3000);
      } else {
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
          {success ? (
            <div className="text-center">
              {/* Check icon */}
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">
                Password updated!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been changed successfully. Redirecting you to
                sign in&hellip;
              </p>
              <a
                href="/login"
                className="mt-4 inline-block text-sm text-teal hover:underline"
              >
                Sign in now
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-navy mb-1">
                Set a new password
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Choose a strong password for your Mathbord account. It must be
                at least 8 characters long.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
                  />
                </div>

                {/* Password strength hint */}
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-600 font-medium">
                    Password is too short ({password.length}/8 characters).
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-[6px]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 bg-teal text-white text-sm font-semibold rounded-btn hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <a
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-teal transition-colors"
                >
                  Request a new reset link
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

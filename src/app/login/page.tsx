"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
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
          <h2 className="text-lg font-bold text-navy mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[8px] text-sm outline-none focus:border-teal transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[8px] text-sm outline-none focus:border-teal transition-colors"
                placeholder="••••••••"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-xs text-teal hover:underline"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Dev hint — remove in production */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Seed accounts: admin@mathbord.com / sarah@mathbord.com / etc. — password: <code>mathbord2026</code>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

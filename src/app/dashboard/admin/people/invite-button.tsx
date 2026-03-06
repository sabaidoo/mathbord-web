"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setError("");
    setSent(false);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to send invite.");
        return;
      }
      setSent(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-teal text-white text-xs font-bold rounded-lg hover:bg-teal-dark transition-colors"
      >
        + Send Invite
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-800">Send Client Invite</h3>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {sent ? (
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-navy mb-1">Invite sent!</p>
                <p className="text-sm text-gray-400 mb-4">An invite link was sent to {email}.</p>
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 py-2 bg-teal text-white text-sm font-semibold rounded-[8px] hover:bg-teal-dark transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-teal"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  A registration link valid for 7 days will be emailed to the client.
                </p>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-[6px]">{error}</p>
                )}
                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={reset} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-btn transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

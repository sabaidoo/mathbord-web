"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AppStatus = "pending" | "interview" | "approved" | "rejected";

interface ApplicationActionsProps {
  applicationId: string;
  currentStatus: string;
}

export function ApplicationActions({ applicationId, currentStatus }: ApplicationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function update(newStatus: AppStatus) {
    setLoading(newStatus);
    setError("");
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Update failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  if (currentStatus === "approved") return null;

  return (
    <div className="flex flex-col gap-1">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <div className="flex gap-1.5 flex-wrap">
        {currentStatus !== "interview" && (
          <button
            type="button"
            onClick={() => update("interview")}
            disabled={loading !== null}
            className="px-2.5 py-1 text-xs font-semibold bg-teal-50 hover:bg-teal-50/80 text-teal rounded-[5px] transition-colors disabled:opacity-50"
          >
            {loading === "interview" ? "…" : "Interview"}
          </button>
        )}
        <button
          type="button"
          onClick={() => update("approved")}
          disabled={loading !== null}
          className="px-2.5 py-1 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 rounded-[5px] transition-colors disabled:opacity-50"
        >
          {loading === "approved" ? "…" : "Approve"}
        </button>
        {currentStatus !== "rejected" && (
          <button
            type="button"
            onClick={() => update("rejected")}
            disabled={loading !== null}
            className="px-2.5 py-1 text-xs font-semibold bg-accent-light hover:bg-accent-light/80 text-accent rounded-[5px] transition-colors disabled:opacity-50"
          >
            {loading === "rejected" ? "…" : "Reject"}
          </button>
        )}
      </div>
    </div>
  );
}

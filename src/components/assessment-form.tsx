"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentFormProps {
  studentId: string;
  studentName: string;
  jobId: string;
  topics: string[];
  onSuccess: () => void;
  onClose: () => void;
}

const ASSESSMENT_TYPES = [
  { value: "diagnostic", label: "Diagnostic" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "test", label: "Test" },
  { value: "practice_test", label: "Practice Test" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
] as const;

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AssessmentForm({
  studentId,
  studentName,
  jobId,
  topics,
  onSuccess,
  onClose,
}: AssessmentFormProps) {
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [type, setType] = useState<string>("quiz");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    const scoreNum = Number(score);
    const maxScoreNum = Number(maxScore);

    if (!topic) {
      setError("Please select a topic.");
      return;
    }
    if (!type) {
      setError("Please select an assessment type.");
      return;
    }
    if (score === "" || isNaN(scoreNum)) {
      setError("Please enter a valid score.");
      return;
    }
    if (maxScore === "" || isNaN(maxScoreNum) || maxScoreNum <= 0) {
      setError("Please enter a valid max score.");
      return;
    }
    if (scoreNum < 0 || scoreNum > maxScoreNum) {
      setError(`Score must be between 0 and ${maxScoreNum}.`);
      return;
    }
    if (!date) {
      setError("Please enter a date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          jobId,
          topic,
          type,
          score: scoreNum,
          maxScore: maxScoreNum,
          date,
          notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to save assessment. Please try again.");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Modal overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-800">
            Log Assessment{" "}
            <span className="font-normal text-gray-500">— {studentName}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} id="assessment-form" className="px-6 py-5 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors bg-white"
            >
              {topics.length === 0 && (
                <option value="" disabled>
                  No topics available
                </option>
              )}
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors bg-white"
            >
              {ASSESSMENT_TYPES.map((at) => (
                <option key={at.value} value={at.value}>
                  {at.label}
                </option>
              ))}
            </select>
          </div>

          {/* Score + Max Score */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                min={0}
                max={Number(maxScore) || 100}
                step="any"
                placeholder="e.g. 82"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Max Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                required
                min={1}
                step="any"
                placeholder="100"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
              />
            </div>
          </div>

          {/* Live percentage preview */}
          {score !== "" && maxScore !== "" && Number(maxScore) > 0 && (
            <p className="text-xs text-gray-500 -mt-1">
              Percentage:{" "}
              <span className="font-semibold text-gray-700">
                {Math.round((Number(score) / Number(maxScore)) * 100)}%
              </span>
            </p>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional observations or context…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors resize-none"
            />
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-[6px]">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assessment-form"
            disabled={submitting}
            className="px-5 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-btn transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

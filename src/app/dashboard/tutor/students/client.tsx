"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentRecord {
  id: string;
  topic: string;
  type: string;
  score: number;
  maxScore: number;
  date: string;
  notes: string | null;
  pct: number;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  grade: string | null;
  curriculum: string | null;
  status: string;
  startDate: string | null;
  clientName: string;
  jobId: string | null;
  topics: string[];
  progress: {
    mastery: Array<{ topic: string; level: string; avg: number; count: number }>;
    progressPoints: Array<{ date: string; pct: number; topic: string; type: string }>;
    trackStatus: string;
    overallAvg: number;
    totalAssessments: number;
    completedLessons: number;
    upcomingLessons: number;
  };
  recentAssessments: AssessmentRecord[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TutorStudentsClient({
  students,
}: {
  students: StudentData[];
  tutorId: string;
}) {
  const [assessingStudent, setAssessingStudent] = useState<StudentData | null>(null);

  if (students.length === 0) {
    return (
      <div>
        <h1 className="font-display text-3xl text-navy mb-1">My Students</h1>
        <p className="text-sm text-gray-500 mb-8">Students assigned to you will appear here.</p>
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-4">👩‍🎓</p>
          <p className="text-sm text-gray-400">No students assigned yet. Contact your admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">My Students</h1>
      <p className="text-sm text-gray-500 mb-8">
        {students.length} student{students.length !== 1 ? "s" : ""} — progress tracking &amp; assessment logs.
      </p>

      <div className="space-y-6">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onLogAssessment={() => setAssessingStudent(student)}
          />
        ))}
      </div>

      {/* Assessment modal */}
      {assessingStudent && (
        <AssessmentModal
          student={assessingStudent}
          onClose={() => setAssessingStudent(null)}
          onSuccess={() => {
            setAssessingStudent(null);
            // Trigger a page refresh to reload progress data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  student,
  onLogAssessment,
}: {
  student: StudentData;
  onLogAssessment: () => void;
}) {
  const [showAssessments, setShowAssessments] = useState(false);
  const { progress, recentAssessments } = student;

  const statusColors: Record<string, string> = {
    "on-track": "bg-green-900/20 text-green-400",
    "needs-attention": "bg-amber-900/20 text-amber-400",
    pending: "bg-gray-700/30 text-gray-400",
  };
  const masteryTagColors: Record<string, string> = {
    strong: "bg-green-100 text-green-700",
    developing: "bg-yellow-100 text-yellow-700",
    gap: "bg-accent-light text-accent",
    "not-started": "bg-gray-100 text-gray-400",
  };
  const masteryIcons: Record<string, string> = {
    strong: "✓",
    developing: "◑",
    gap: "✕",
    "not-started": "—",
  };
  const statusLabel: Record<string, string> = {
    "on-track": "On Track",
    "needs-attention": "Needs Attention",
    pending: "Pending",
  };

  return (
    <div id={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header bar */}
      <div className="bg-navy px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal border-2 border-white/20 flex items-center justify-center text-white text-sm font-bold">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="text-white font-bold">{student.firstName} {student.lastName}</p>
            <p className="text-gray-400 text-xs">
              {student.grade} · {student.curriculum} · Client: {student.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[progress.trackStatus] ?? "bg-gray-700/30 text-gray-400"}`}>
            {statusLabel[progress.trackStatus] ?? progress.trackStatus}
          </span>
          <button
            onClick={onLogAssessment}
            className="px-4 py-2 bg-teal text-white text-xs font-bold rounded-lg hover:bg-teal-dark transition-colors"
          >
            + Log Assessment
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Topic Mastery */}
        {progress.mastery.length > 0 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3">
              Topic Mastery ({progress.totalAssessments} assessments)
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {progress.mastery.map((m) => (
                <span
                  key={m.topic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${masteryTagColors[m.level] ?? "bg-gray-100 text-gray-400"}`}
                >
                  {m.topic}
                  {m.count > 0 ? ` ${m.avg}% ${masteryIcons[m.level]}` : " —"}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 mb-6">No curriculum topics set up for this student yet.</p>
        )}

        {/* Progress Chart */}
        {progress.progressPoints.length > 1 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3">
              Assessment Scores Over Time
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-end gap-0.5 h-28 px-1">
                {progress.progressPoints.map((pt, i) => {
                  const opacity = 0.3 + (i / (progress.progressPoints.length - 1)) * 0.7;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end gap-0.5 group"
                      title={`${pt.date}: ${pt.pct}% (${pt.topic})`}
                    >
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pt.pct}
                      </span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(pt.pct, 4)}%`,
                          background: `rgba(6,165,255,${opacity.toFixed(2)})`,
                          minHeight: "4px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>{progress.progressPoints[0].date}</span>
                <span>{progress.progressPoints[progress.progressPoints.length - 1].date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Assessments toggle */}
        <div>
          <button
            onClick={() => setShowAssessments((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3 w-full text-left hover:text-teal transition-colors"
          >
            <span>Assessment History ({recentAssessments.length})</span>
            <span className="ml-auto">{showAssessments ? "▲" : "▼"}</span>
          </button>

          {showAssessments && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-4">Topic</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-4">Type</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-4">Score</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-4">Date</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssessments.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-sm font-semibold text-navy">{a.topic}</td>
                      <td className="py-2.5 pr-4 text-xs capitalize text-gray-500">
                        {a.type.replace("_", " ")}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-sm font-bold ${a.pct >= 75 ? "text-green-600" : a.pct >= 55 ? "text-amber-600" : "text-red-500"}`}>
                          {a.score}/{a.maxScore}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">({a.pct}%)</span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500 font-mono">{a.date}</td>
                      <td className="py-2.5 text-xs text-gray-400 max-w-[200px] truncate">
                        {a.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────

function AssessmentModal({
  student,
  onClose,
  onSuccess,
}: {
  student: StudentData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [topic, setTopic] = useState(student.topics[0] ?? "");
  const [type, setType] = useState("quiz");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const scoreN = parseFloat(score);
    const maxScoreN = parseFloat(maxScore);

    if (!topic || !type || isNaN(scoreN) || isNaN(maxScoreN) || !date) {
      setError("Please fill in all required fields.");
      return;
    }
    if (scoreN < 0 || scoreN > maxScoreN) {
      setError(`Score must be between 0 and ${maxScoreN}.`);
      return;
    }
    if (!student.jobId) {
      setError("No active job found for this student.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          jobId: student.jobId,
          topic,
          type,
          score: scoreN,
          maxScore: maxScoreN,
          date,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save assessment.");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-navy">Log Assessment</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.firstName} {student.lastName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Topic */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Topic *</label>
              {student.topics.length > 0 ? (
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
                >
                  {student.topics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic name"
                  required
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
                />
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
              >
                <option value="diagnostic">Diagnostic</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="test">Test</option>
                <option value="practice_test">Practice Test</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
              />
            </div>

            {/* Score */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Score *</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 82"
                min={0}
                step="0.5"
                required
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
              />
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Score *</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                min={1}
                step="0.5"
                required
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors"
              />
            </div>

            {/* Live percentage preview */}
            {score && maxScore && !isNaN(parseFloat(score)) && !isNaN(parseFloat(maxScore)) && parseFloat(maxScore) > 0 && (
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (parseFloat(score) / parseFloat(maxScore)) * 100 >= 75
                        ? "bg-green-500"
                        : (parseFloat(score) / parseFloat(maxScore)) * 100 >= 55
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min((parseFloat(score) / parseFloat(maxScore)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-navy w-12 text-right">
                  {Math.round((parseFloat(score) / parseFloat(maxScore)) * 100)}%
                </span>
              </div>
            )}

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, areas of strength/weakness..."
                rows={3}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-teal transition-colors resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest(".fixed")?.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={loading}
            className="px-6 py-2.5 bg-teal text-white rounded-lg text-sm font-bold hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

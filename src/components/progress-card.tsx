"use client";

import { initials, fmtDate } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProgressCardProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string | null;
    curriculum: string | null;
    tutorName?: string | null;
  };
  progress: {
    mastery: Array<{ topic: string; level: string; avg: number; count: number }>;
    progressPoints: Array<{ date: string; pct: number; topic: string; type: string }>;
    trackStatus: string;
    overallAvg: number;
    totalAssessments: number;
    completedLessons: number;
  };
  upcomingLessons?: Array<{
    date: string;
    subject: string | null;
    tutorName: string;
    startTime: string;
  }>;
  showLogAssessment?: boolean;
  onLogAssessment?: (studentId: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

type MasteryLevel = "strong" | "developing" | "gap" | "not-started";

const MASTERY_CONFIG: Record<
  MasteryLevel,
  { classes: string; icon: string }
> = {
  strong: { classes: "bg-green-100 text-green-700 border-green-200", icon: "✓" },
  developing: { classes: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "◑" },
  gap: { classes: "bg-accent-light text-accent border-accent-light", icon: "✕" },
  "not-started": { classes: "bg-gray-100 text-gray-500 border-gray-200", icon: "—" },
};

type TrackStatus = "on-track" | "needs-attention" | "pending";

const TRACK_CONFIG: Record<TrackStatus, { classes: string; label: string }> = {
  "on-track": { classes: "bg-green-100 text-green-700 border-green-200", label: "On Track" },
  "needs-attention": { classes: "bg-amber-100 text-amber-700 border-amber-200", label: "Needs Attention" },
  "pending": { classes: "bg-gray-100 text-gray-500 border-gray-200", label: "Pending" },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProgressCard({
  student,
  progress,
  upcomingLessons,
  showLogAssessment = false,
  onLogAssessment,
}: ProgressCardProps) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const studentInitials = initials(fullName);

  const trackKey = (progress.trackStatus as TrackStatus) in TRACK_CONFIG
    ? (progress.trackStatus as TrackStatus)
    : "pending";
  const track = TRACK_CONFIG[trackKey];

  // Build subtitle metadata line
  const meta = [student.grade, student.curriculum, student.tutorName]
    .filter(Boolean)
    .join(" · ");

  // Bar chart data: oldest bars are most faded
  const points = progress.progressPoints;
  const totalBars = points.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex items-center gap-3 bg-navy"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
          {studentInitials}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            {fullName}
          </p>
          {meta && (
            <p className="text-white/50 text-xs mt-0.5 truncate">{meta}</p>
          )}
        </div>

        {/* Track status badge */}
        <span
          className={[
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0",
            track.classes,
          ].join(" ")}
        >
          {track.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">
        {/* Topic Mastery */}
        {progress.mastery.length > 0 && (
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Topic Mastery
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {progress.mastery.map((m) => {
                const level = (m.level as MasteryLevel) in MASTERY_CONFIG
                  ? (m.level as MasteryLevel)
                  : "not-started";
                const cfg = MASTERY_CONFIG[level];
                return (
                  <span
                    key={m.topic}
                    className={[
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                      cfg.classes,
                    ].join(" ")}
                    title={`${m.count} assessment${m.count !== 1 ? "s" : ""}`}
                  >
                    {m.topic}
                    {m.count > 0 && (
                      <span className="opacity-70">{m.avg}%</span>
                    )}
                    <span>{cfg.icon}</span>
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Assessment Scores Bar Chart */}
        {points.length > 0 && (
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Assessment Scores Over Time
            </h4>
            {/* Axis label */}
            <div className="flex items-end gap-[3px] h-28 relative">
              {/* 75% guideline */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ bottom: "75%" }}
                title="75% threshold"
              />
              {points.map((pt, i) => {
                // Opacity: oldest = 0.3, newest = 1.0
                const opacity =
                  totalBars === 1
                    ? 1
                    : 0.3 + (0.7 * i) / (totalBars - 1);
                const heightPct = Math.max(pt.pct, 3); // min 3% so bars are visible
                return (
                  <div
                    key={`${pt.date}-${i}`}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: `rgba(6, 165, 255, ${opacity})`,
                    }}
                    title={`${pt.topic} · ${pt.type} · ${pt.pct}% · ${pt.date}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">
                {points[0]?.date}
              </span>
              <span className="text-[10px] text-gray-400">
                Overall: {progress.overallAvg}%
              </span>
              <span className="text-[10px] text-gray-400">
                {points[points.length - 1]?.date}
              </span>
            </div>
          </section>
        )}

        {/* Upcoming Sessions */}
        {upcomingLessons && upcomingLessons.length > 0 && (
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Upcoming Sessions
            </h4>
            <div className="space-y-1.5">
              {upcomingLessons.slice(0, 3).map((lesson, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-[6px] text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-teal">📅</span>
                    <span className="text-gray-700 font-medium">
                      {fmtDate(lesson.date)}
                    </span>
                    {lesson.subject && (
                      <span className="text-gray-400 text-xs">
                        · {lesson.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{lesson.startTime}</span>
                    <span>· {lesson.tutorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {progress.completedLessons} lesson
            {progress.completedLessons !== 1 ? "s" : ""} completed
            {progress.progressPoints.length > 0 && (
              <> · Started {progress.progressPoints[0].date}</>
            )}
          </p>
          <p className="text-xs text-gray-400">
            {progress.totalAssessments} assessment
            {progress.totalAssessments !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Log Assessment button */}
        {showLogAssessment && onLogAssessment && (
          <button
            type="button"
            onClick={() => onLogAssessment(student.id)}
            className="w-full py-2 text-sm font-semibold text-teal border border-teal rounded-btn hover:bg-teal hover:text-white transition-colors"
          >
            Log Assessment
          </button>
        )}
      </div>
    </div>
  );
}

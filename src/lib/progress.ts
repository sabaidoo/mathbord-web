/**
 * progress.ts
 *
 * Server-side port of getStudentProgress() from mathbord-saas-prototype.html.
 * This is a pure computation — it takes raw DB records and derives mastery.
 *
 * Algorithm (TECHNICAL_SPEC §5.4):
 *   - For each curriculum topic, average the last 2 assessment scores (as %)
 *   - ≥75% → "strong"  |  55-74% → "developing"  |  <55% → "gap"  |  0 data → "not-started"
 *   - Overall track status: avg of all scored topics ≥70% → "on-track", else "needs-attention"
 *   - Progress chart: chronological list of all scores as percentages
 */

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasteryLevel = "strong" | "developing" | "gap" | "not-started";
export type TrackStatus = "on-track" | "needs-attention" | "pending";

export interface TopicMastery {
  topic: string;
  level: MasteryLevel;
  /** Average of last 2 scores as whole-number percentage (0-100) */
  avg: number;
  /** Total assessments logged for this topic */
  count: number;
}

export interface ProgressPoint {
  date: string; // YYYY-MM-DD
  pct: number;  // 0-100
  topic: string;
  type: string;
}

export interface StudentProgress {
  mastery: TopicMastery[];
  progressPoints: ProgressPoint[];
  trackStatus: TrackStatus;
  overallAvg: number;
  totalAssessments: number;
  completedLessons: number;
  upcomingLessons: number;
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getStudentProgress(
  studentId: string
): Promise<StudentProgress> {
  // 1. Find the active (or enquiry) job for this student
  const job = await prisma.job.findFirst({
    where: {
      studentId,
      status: { in: ["active", "enquiry"] },
    },
    include: {
      curriculumTopics: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  // 2. Fetch all assessments for this student, sorted chronologically
  const assessments = await prisma.assessment.findMany({
    where: { studentId },
    orderBy: { date: "asc" },
  });

  // 3. Fetch lesson counts for stats
  const lessons = await prisma.lesson.findMany({
    where: { studentId },
    select: { status: true },
  });

  const completedLessons = lessons.filter((l) => l.status === "completed").length;
  const upcomingLessons = lessons.filter((l) => l.status === "scheduled").length;

  // 4. Build topic mastery from curriculum
  const topics = job?.curriculumTopics ?? [];
  const mastery: TopicMastery[] = topics.map((ct) => {
    const topicAssessments = assessments.filter((a) => a.topic === ct.topicName);

    if (topicAssessments.length === 0) {
      return { topic: ct.topicName, level: "not-started", avg: 0, count: 0 };
    }

    // Take the last 2 assessments for this topic
    const latestTwo = topicAssessments.slice(-2);
    const avg =
      latestTwo.reduce((sum, a) => {
        return sum + (Number(a.score) / Number(a.maxScore)) * 100;
      }, 0) / latestTwo.length;

    const rounded = Math.round(avg);
    let level: MasteryLevel;
    if (rounded >= 75) level = "strong";
    else if (rounded >= 55) level = "developing";
    else level = "gap";

    return {
      topic: ct.topicName,
      level,
      avg: rounded,
      count: topicAssessments.length,
    };
  });

  // 5. Build chronological progress points for the chart
  const progressPoints: ProgressPoint[] = assessments.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    pct: Math.round((Number(a.score) / Number(a.maxScore)) * 100),
    topic: a.topic,
    type: a.type,
  }));

  // 6. Compute overall average and track status
  const scoredTopics = mastery.filter((m) => m.count > 0);
  const overallAvg =
    scoredTopics.length > 0
      ? Math.round(
          scoredTopics.reduce((sum, m) => sum + m.avg, 0) / scoredTopics.length
        )
      : 0;

  let trackStatus: TrackStatus = "pending";
  if (scoredTopics.length > 0) {
    trackStatus = overallAvg >= 70 ? "on-track" : "needs-attention";
  }

  return {
    mastery,
    progressPoints,
    trackStatus,
    overallAvg,
    totalAssessments: assessments.length,
    completedLessons,
    upcomingLessons,
  };
}

// ─── Batch version for listing multiple students ──────────────────────────────

/** Returns a lightweight summary for each student (used in list views) */
export async function getStudentsProgressSummary(
  studentIds: string[]
): Promise<Map<string, { trackStatus: TrackStatus; overallAvg: number; totalAssessments: number }>> {
  if (studentIds.length === 0) return new Map();

  const assessments = await prisma.assessment.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { date: "asc" },
  });

  const jobs = await prisma.job.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: ["active", "enquiry"] },
    },
    include: { curriculumTopics: { orderBy: { displayOrder: "asc" } } },
  });

  const jobByStudent = new Map(jobs.map((j) => [j.studentId, j]));

  const result = new Map<string, { trackStatus: TrackStatus; overallAvg: number; totalAssessments: number }>();

  for (const sid of studentIds) {
    const studentAssessments = assessments.filter((a) => a.studentId === sid);
    const job = jobByStudent.get(sid);
    const topics = job?.curriculumTopics ?? [];

    const mastery = topics.map((ct) => {
      const ta = studentAssessments.filter((a) => a.topic === ct.topicName);
      if (ta.length === 0) return { avg: 0, count: 0 };
      const latest2 = ta.slice(-2);
      const avg = Math.round(
        latest2.reduce((s, a) => s + (Number(a.score) / Number(a.maxScore)) * 100, 0) /
          latest2.length
      );
      return { avg, count: ta.length };
    });

    const scored = mastery.filter((m) => m.count > 0);
    const overallAvg =
      scored.length > 0
        ? Math.round(scored.reduce((s, m) => s + m.avg, 0) / scored.length)
        : 0;

    result.set(sid, {
      trackStatus: scored.length === 0 ? "pending" : overallAvg >= 70 ? "on-track" : "needs-attention",
      overallAvg,
      totalAssessments: studentAssessments.length,
    });
  }

  return result;
}

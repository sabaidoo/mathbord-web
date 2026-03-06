import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentProgress } from "@/lib/progress";
import TutorStudentsClient from "./client";

export const dynamic = "force-dynamic";

export default async function TutorStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/login");

  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
  });
  if (!tutor) redirect("/login");

  const students = await prisma.student.findMany({
    where: { tutorId: tutor.id },
    include: {
      client: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { firstName: "asc" },
  });

  // Compute progress for all assigned students in parallel
  const progressResults = await Promise.all(
    students.map(async (s) => {
      const progress = await getStudentProgress(s.id);

      // Get curriculum topics for the assessment form
      const job = await prisma.job.findFirst({
        where: { studentId: s.id, status: { in: ["active", "enquiry"] } },
        include: { curriculumTopics: { orderBy: { displayOrder: "asc" } } },
      });

      // Get recent assessments
      const recentAssessments = await prisma.assessment.findMany({
        where: { studentId: s.id },
        orderBy: { date: "desc" },
        take: 10,
      });

      return {
        studentId: s.id,
        progress,
        jobId: job?.id ?? null,
        topics: job?.curriculumTopics.map((t) => t.topicName) ?? [],
        recentAssessments,
      };
    })
  );

  // Shape data for the client component (must be plain serializable objects)
  const studentData = students.map((s, idx) => {
    const pd = progressResults[idx];
    return {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      curriculum: s.curriculum,
      status: s.status,
      startDate: s.startDate ? s.startDate.toISOString().split("T")[0] : null,
      clientName: `${s.client.user.firstName} ${s.client.user.lastName}`,
      jobId: pd.jobId,
      topics: pd.topics,
      progress: {
        mastery: pd.progress.mastery,
        progressPoints: pd.progress.progressPoints,
        trackStatus: pd.progress.trackStatus,
        overallAvg: pd.progress.overallAvg,
        totalAssessments: pd.progress.totalAssessments,
        completedLessons: pd.progress.completedLessons,
        upcomingLessons: pd.progress.upcomingLessons,
      },
      recentAssessments: pd.recentAssessments.map((a) => ({
        id: a.id,
        topic: a.topic,
        type: a.type,
        score: Number(a.score),
        maxScore: Number(a.maxScore),
        date: a.date.toISOString().split("T")[0],
        notes: a.notes,
        pct: Math.round((Number(a.score) / Number(a.maxScore)) * 100),
      })),
    };
  });

  return <TutorStudentsClient students={studentData} tutorId={tutor.id} />;
}

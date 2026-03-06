import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentProgress } from "@/lib/progress";
import { fmtDate } from "@/lib/utils";
import { ProgressCard } from "@/components/progress-card";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  // Students have a user account — find their Student record via userId
  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    include: {
      tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!student) {
    // Student record exists but user link not set up yet
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">👋</p>
        <h1 className="font-display text-2xl text-navy mb-2">Welcome to Mathbord!</h1>
        <p className="text-sm text-gray-400">Your account is being set up. Check back soon.</p>
      </div>
    );
  }

  const progress = await getStudentProgress(student.id);

  const [upcoming, recentLessons] = await Promise.all([
    prisma.lesson.findMany({
      where: { studentId: student.id, status: "scheduled", date: { gte: new Date() } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 3,
      include: {
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
    }),
    prisma.lesson.findMany({
      where: { studentId: student.id, status: "completed", report: { not: null } },
      orderBy: [{ date: "desc" }],
      take: 3,
      include: {
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
    }),
  ]);

  const studentForCard = {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    grade: student.grade,
    curriculum: student.curriculum,
    tutorName: student.tutor
      ? `${student.tutor.user.firstName} ${student.tutor.user.lastName}`
      : null,
  };

  const progressForCard = {
    mastery: progress.mastery,
    progressPoints: progress.progressPoints,
    trackStatus: progress.trackStatus,
    overallAvg: progress.overallAvg,
    totalAssessments: progress.totalAssessments,
    completedLessons: progress.completedLessons,
    upcomingLessons: progress.upcomingLessons,
  };

  const upcomingForCard = upcoming.map((l) => ({
    date: l.date.toISOString().split("T")[0],
    subject: l.job?.subject ?? null,
    tutorName: `${l.tutor.user.firstName} ${l.tutor.user.lastName}`,
    startTime: `${String(l.startTime.getUTCHours()).padStart(2, "0")}:${String(l.startTime.getUTCMinutes()).padStart(2, "0")}`,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">
        Hey, {student.firstName} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-8">Here&apos;s your progress and what&apos;s coming up.</p>

      {/* Progress card */}
      <ProgressCard
        student={studentForCard}
        progress={progressForCard}
        upcomingLessons={upcomingForCard}
      />

      {/* Recent lesson reports */}
      {recentLessons.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <span className="text-sm font-bold text-navy">Recent Lesson Reports</span>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLessons.map((l) => (
              <div key={l.id} className="px-6 py-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-navy">{l.job?.subject ?? "Session"}</p>
                    <p className="text-xs text-gray-400">
                      {l.tutor.user.firstName} {l.tutor.user.lastName} · {fmtDate(l.date)}
                    </p>
                  </div>
                </div>
                {l.report && (
                  <p className="text-sm text-gray-600 leading-relaxed">{l.report}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next session call-to-action */}
      {upcoming.length > 0 && (
        <div className="mt-6 bg-navy rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Next Session</p>
            <p className="text-gray-400 text-sm mt-1">
              {upcoming[0].job?.subject ?? "Session"} · {fmtDate(upcoming[0].date)} at{" "}
              {String(upcoming[0].startTime.getUTCHours()).padStart(2, "0")}:
              {String(upcoming[0].startTime.getUTCMinutes()).padStart(2, "0")}{" "}
              with {upcoming[0].tutor.user.firstName} {upcoming[0].tutor.user.lastName}
            </p>
          </div>
          <button className="px-6 py-3 bg-teal text-white font-bold text-sm rounded-xl hover:bg-teal-dark transition-colors">
            Join Session
          </button>
        </div>
      )}
    </div>
  );
}

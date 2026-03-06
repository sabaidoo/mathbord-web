import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentProgress } from "@/lib/progress";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  const student = await prisma.student.findFirst({ where: { userId: session.user.id } });
  if (!student) redirect("/dashboard/student");

  const [progress, lessonReports] = await Promise.all([
    getStudentProgress(student.id),
    prisma.lesson.findMany({
      where: { studentId: student.id, status: "completed", report: { not: null } },
      include: {
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
      orderBy: [{ date: "desc" }],
    }),
  ]);

  const masteryColors: Record<string, string> = {
    strong: "bg-green-100 text-green-700",
    developing: "bg-yellow-100 text-yellow-700",
    gap: "bg-accent-light text-accent",
    "not-started": "bg-gray-100 text-gray-400",
  };
  const masteryIcons: Record<string, string> = { strong: "✓", developing: "◑", gap: "✕", "not-started": "—" };

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">My Reports</h1>
      <p className="text-sm text-gray-500 mb-8">Assessment history and tutor session notes.</p>

      {/* Topic mastery summary */}
      {progress.mastery.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-navy mb-4">
            Topic Mastery Overview
            <span className="ml-2 text-gray-400 font-normal">({progress.totalAssessments} assessments)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {progress.mastery.map((m) => (
              <span
                key={m.topic}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${masteryColors[m.level] ?? "bg-gray-100 text-gray-400"}`}
              >
                {m.topic}
                {m.count > 0 ? ` · ${m.avg}% ${masteryIcons[m.level]}` : " · —"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress chart */}
      {progress.progressPoints.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-navy mb-4">Assessment Scores Over Time</h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-end gap-0.5 h-32 px-1">
              {progress.progressPoints.map((pt, i) => {
                const opacity = 0.3 + (i / (progress.progressPoints.length - 1)) * 0.7;
                return (
                  <div
                    key={i}
                    className="flex-1 group relative"
                    title={`${pt.date}: ${pt.pct}% (${pt.topic})`}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {pt.pct}%
                    </div>
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
            <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
              <span>{progress.progressPoints[0].date}</span>
              <span>{progress.progressPoints[progress.progressPoints.length - 1].date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lesson reports */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-bold text-navy">Tutor Session Notes</span>
        </div>
        <div className="divide-y divide-gray-100">
          {lessonReports.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No session reports yet.</div>
          ) : (
            lessonReports.map((l) => (
              <div key={l.id} className="px-6 py-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-navy">{l.job?.subject ?? "Session"}</p>
                    <p className="text-xs text-gray-400">
                      {l.tutor.user.firstName} {l.tutor.user.lastName} · {fmtDate(l.date)} · {l.durationMinutes}min
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{l.report}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

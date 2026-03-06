import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";

export default async function ClientReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client") redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });
  if (!client) redirect("/login");

  // Get all students for this client
  const students = await prisma.student.findMany({
    where: { clientId: client.id },
    select: { id: true, firstName: true, lastName: true },
  });

  const studentIds = students.map((s) => s.id);

  // Get completed lessons with reports for all students
  const lessons = await prisma.lesson.findMany({
    where: {
      studentId: { in: studentIds },
      status: "completed",
      report: { not: null },
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
      job: { select: { subject: true } },
    },
    orderBy: [{ date: "desc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-8">
        {lessons.length} lesson report{lessons.length !== 1 ? "s" : ""} across your students.
      </p>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-sm text-gray-400">No lesson reports available yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-navy">
                        {lesson.student.firstName} {lesson.student.lastName}
                      </p>
                      <span className="text-gray-300">·</span>
                      <p className="text-xs text-gray-400">
                        {lesson.job?.subject ?? "Session"}
                      </p>
                      <span className="text-gray-300">·</span>
                      <p className="text-xs text-gray-400">
                        {lesson.tutor.user.firstName} {lesson.tutor.user.lastName}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{lesson.report}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-mono text-gray-400">{fmtDate(lesson.date)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lesson.durationMinutes}min</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

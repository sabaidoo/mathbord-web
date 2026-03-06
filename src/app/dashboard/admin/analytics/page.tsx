import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const [
    studentCount,
    tutorCount,
    lessonStats,
    revenueByMonth,
    topTutors,
    studentsByStatus,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.tutor.count(),
    prisma.lesson.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { status: "paid" },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),
    prisma.tutor.findMany({
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { totalHours: "desc" },
    }),
    prisma.student.groupBy({ by: ["status"], _count: true }),
  ]);

  const completedLessons = lessonStats.find((s) => s.status === "completed")?._count ?? 0;
  const scheduledLessons = lessonStats.find((s) => s.status === "scheduled")?._count ?? 0;
  const totalRevenue = revenueByMonth.reduce((s, i) => s + Number(i.amount), 0);

  // Monthly revenue breakdown (last 6 months)
  const monthlyRevenue: Record<string, number> = {};
  for (const inv of revenueByMonth) {
    if (!inv.paidAt) continue;
    const key = inv.paidAt.toLocaleString("en-CA", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(inv.amount);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-8">Platform-wide performance metrics.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={studentCount} />
        <StatCard label="Active Tutors" value={tutorCount} />
        <StatCard label="Completed Lessons" value={completedLessons} />
        <StatCard label="All-time Revenue" value={fmtMoney(totalRevenue)} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Lesson status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-navy mb-4">Lesson Breakdown</h2>
          <div className="space-y-3">
            {lessonStats.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{s.status.replace("_", " ")}</span>
                    <span className="font-semibold text-navy">{s._count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${(s._count / (completedLessons + scheduledLessons + 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top tutors by hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-navy mb-4">Top Tutors by Hours</h2>
          <div className="space-y-3">
            {topTutors.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                  {t.user.firstName[0]}{t.user.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{t.user.firstName} {t.user.lastName}</p>
                </div>
                <span className="text-sm font-mono text-teal font-semibold">{Number(t.totalHours)}h</span>
              </div>
            ))}
            {topTutors.length === 0 && <p className="text-gray-400 text-sm">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Student status breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-navy mb-4">Student Status Distribution</h2>
        <div className="flex gap-6">
          {studentsByStatus.map((s) => (
            <div key={s.status} className="text-center">
              <p className="font-display text-2xl text-navy">{s._count}</p>
              <p className="text-xs text-gray-400 capitalize mt-1">{s.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
    </div>
  );
}

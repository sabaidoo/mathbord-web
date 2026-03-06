import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney, fmtDate } from "@/lib/utils";

export default async function TutorEarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/login");

  const tutor = await prisma.tutor.findUnique({ where: { userId: session.user.id } });
  if (!tutor) redirect("/login");

  const completedLessons = await prisma.lesson.findMany({
    where: { tutorId: tutor.id, status: "completed" },
    include: {
      student: { select: { firstName: true, lastName: true } },
      job: { select: { subject: true } },
    },
    orderBy: [{ date: "desc" }],
  });

  // Group by month
  type MonthEntry = { lessons: typeof completedLessons; hours: number; earnings: number };
  const byMonth: Record<string, MonthEntry> = {};
  for (const lesson of completedLessons) {
    const key = lesson.date.toLocaleString("en-CA", { month: "long", year: "numeric" });
    if (!byMonth[key]) byMonth[key] = { lessons: [], hours: 0, earnings: 0 };
    byMonth[key].lessons.push(lesson);
    byMonth[key].hours += lesson.durationMinutes / 60;
    byMonth[key].earnings += (lesson.durationMinutes / 60) * Number(tutor.payRate);
  }

  const totalHours = completedLessons.reduce((s, l) => s + l.durationMinutes / 60, 0);
  const totalEarnings = totalHours * Number(tutor.payRate);
  const now = new Date();
  const thisMonthKey = now.toLocaleString("en-CA", { month: "long", year: "numeric" });
  const thisMonth = byMonth[thisMonthKey];

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">My Earnings</h1>
      <p className="text-sm text-gray-500 mb-8">
        Pay rate: {fmtMoney(Number(tutor.payRate))}/hr · All-time totals below.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="All-time Hours" value={`${totalHours.toFixed(1)}h`} />
        <StatCard label="All-time Earnings" value={fmtMoney(totalEarnings)} />
        <StatCard label="This Month Hours" value={`${(thisMonth?.hours ?? 0).toFixed(1)}h`} />
        <StatCard label="This Month Earnings" value={fmtMoney(thisMonth?.earnings ?? 0)} />
      </div>

      {/* Monthly breakdown */}
      <div className="space-y-4">
        {Object.entries(byMonth).map(([month, data]) => (
          <div key={month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="font-semibold text-navy">{month}</span>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-500">{data.lessons.length} session{data.lessons.length !== 1 ? "s" : ""}</span>
                <span className="text-gray-500">{data.hours.toFixed(1)}h</span>
                <span className="font-bold text-navy">{fmtMoney(data.earnings)}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.lessons.map((l) => {
                const hrs = l.durationMinutes / 60;
                const pay = hrs * Number(tutor.payRate);
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-mono text-gray-400 w-20">{fmtDate(l.date)}</span>
                    <div className="flex-1">
                      <span className="text-sm text-navy">
                        {l.student.firstName} {l.student.lastName}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{l.job?.subject ?? "—"}</span>
                    </div>
                    <span className="text-xs text-gray-400">{l.durationMinutes}min</span>
                    <span className="text-sm font-semibold text-navy w-20 text-right">{fmtMoney(pay)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {completedLessons.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            No completed lessons yet. Earnings will appear here once sessions are marked complete.
          </div>
        )}
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

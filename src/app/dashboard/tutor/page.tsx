import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TutorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/login");

  // Get tutor record
  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!tutor) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [myLessons, myStudents] = await Promise.all([
    prisma.lesson.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        job: { select: { subject: true, title: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.student.findMany({
      where: { tutorId: tutor.id, status: "active" },
      select: { id: true, firstName: true, lastName: true, grade: true, curriculum: true },
    }),
  ]);

  const upcoming = myLessons.filter((l) => l.status === "scheduled");
  const completedThisMonth = myLessons.filter(
    (l) => l.status === "completed" && l.date >= monthStart
  );
  const hoursThisMonth = completedThisMonth.reduce((s, l) => s + l.durationMinutes / 60, 0);
  const earningsThisMonth = hoursThisMonth * Number(tutor.payRate);

  const monthName = now.toLocaleString("en-CA", { month: "long" });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">
        Welcome, {tutor.user.firstName}
      </h1>
      <p className="text-sm text-gray-500 mb-8">Here&apos;s your teaching overview for {monthName}.</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Students" value={myStudents.length} />
        <StatCard label={`Upcoming Lessons`} value={upcoming.length} trend="scheduled" trendUp />
        <StatCard label={`Hours (${monthName})`} value={`${hoursThisMonth.toFixed(1)}h`} trend={`${completedThisMonth.length} sessions`} trendUp />
        <StatCard label={`Earnings (${monthName})`} value={fmtMoney(earningsThisMonth)} trendUp trend={`@ ${fmtMoney(Number(tutor.payRate))}/hr`} />
      </div>

      <div className="grid grid-cols-[3fr_2fr] gap-6">
        {/* Upcoming Lessons */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-navy">Upcoming Lessons</span>
            <a href="/dashboard/tutor/schedule" className="text-xs font-semibold text-teal hover:underline">
              View calendar →
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No upcoming lessons.</div>
            ) : (
              upcoming.slice(0, 6).map((l) => {
                const timeStr = `${String(l.startTime.getUTCHours()).padStart(2, "0")}:${String(l.startTime.getUTCMinutes()).padStart(2, "0")}`;
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        {l.date.toLocaleString("en-CA", { weekday: "short" })}
                      </p>
                      <p className="text-xl font-display text-navy">{l.date.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy">
                        {l.student.firstName} {l.student.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {l.job?.subject ?? "Session"} · {l.durationMinutes}min
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono text-sm text-teal font-semibold">{timeStr}</span>
                      <span className="px-3 py-1.5 bg-teal-50 text-teal text-xs font-bold rounded-lg border border-teal/20 hover:bg-teal hover:text-white cursor-pointer transition-colors">
                        Join
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* My Students */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-navy">My Students</span>
            <a href="/dashboard/tutor/students" className="text-xs font-semibold text-teal hover:underline">
              View all →
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {myStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No students assigned yet.</div>
            ) : (
              myStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                    {s.firstName[0]}{s.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-400">{s.grade} · {s.curriculum}</p>
                  </div>
                  <a
                    href={`/dashboard/tutor/students#${s.id}`}
                    className="text-xs text-teal font-semibold hover:underline flex-shrink-0"
                  >
                    Progress →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp }: { label: string; value: string | number; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
      {trend && <p className={`text-xs font-semibold mt-1 ${trendUp ? "text-green-600" : "text-gray-400"}`}>{trend}</p>}
    </div>
  );
}

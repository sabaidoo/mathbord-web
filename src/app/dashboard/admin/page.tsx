import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  // ── Parallel data fetches ────────────────────────────────────────────────
  const [
    activeStudents,
    activeTutors,
    lessonsThisMonth,
    revenueResult,
    pendingApps,
    recentLessons,
    overdueInvoices,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "active" } }),
    prisma.tutor.count({ where: { user: { status: "active" } } }),
    prisma.lesson.count({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(),
        },
      },
    }),
    prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.application.count({ where: { status: "pending" } }),
    prisma.lesson.findMany({
      take: 8,
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      include: {
        student: { select: { firstName: true, lastName: true } },
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
    }),
    prisma.invoice.count({ where: { status: "overdue" } }),
  ]);

  const totalRevenue = Number(revenueResult._sum.amount ?? 0);
  const currentMonth = new Date().toLocaleString("en-CA", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Welcome back, {session.user.name}. Here&apos;s your overview for {currentMonth}.
      </p>

      {/* ── Stat Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Students" value={activeStudents} trend="↑ enrolled" trendUp />
        <StatCard label="Active Tutors" value={activeTutors} trend="ready to teach" trendUp />
        <StatCard
          label={`Lessons (${new Date().toLocaleString("en-CA", { month: "short" })})`}
          value={lessonsThisMonth}
          trend="this month"
          trendUp
        />
        <StatCard
          label="Total Revenue"
          value={fmtMoney(totalRevenue)}
          trend={overdueInvoices > 0 ? `${overdueInvoices} invoice(s) overdue` : "✓ All paid"}
          trendUp={overdueInvoices === 0}
        />
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {(pendingApps > 0 || overdueInvoices > 0) && (
        <div className="flex gap-3 mb-6">
          {pendingApps > 0 && (
            <a
              href="/dashboard/admin/people?tab=applications"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span>⚠</span>
              <span>{pendingApps} pending tutor application{pendingApps > 1 ? "s" : ""}</span>
            </a>
          )}
          {overdueInvoices > 0 && (
            <a
              href="/dashboard/admin/accounting"
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <span>⚠</span>
              <span>{overdueInvoices} overdue invoice{overdueInvoices > 1 ? "s" : ""}</span>
            </a>
          )}
        </div>
      )}

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* Recent Lessons */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-navy">Recent Lessons</span>
            <a href="/dashboard/admin/activity?tab=lessons" className="text-xs font-semibold text-teal hover:underline">
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLessons.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No lessons recorded yet.</p>
            ) : (
              recentLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                    {lesson.student.firstName[0]}{lesson.student.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {lesson.student.firstName} {lesson.student.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lesson.job?.subject ?? "Session"} · {lesson.tutor.user.firstName} {lesson.tutor.user.lastName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-gray-500">{fmtDate(lesson.date)}</p>
                    <StatusBadge status={lesson.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <span className="text-sm font-bold text-navy">Quick Actions</span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {[
              { label: "📋 People & Roster", href: "/dashboard/admin/people" },
              { label: "📅 Activity & Calendar", href: "/dashboard/admin/activity" },
              { label: "💳 Accounting", href: "/dashboard/admin/accounting" },
              { label: "📊 Analytics", href: "/dashboard/admin/analytics" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="flex items-center px-4 py-3 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal text-sm font-semibold text-gray-700 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline sub-components ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-card-md transition-all hover:-translate-y-px">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
      {trend && (
        <p className={`text-xs font-semibold mt-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    scheduled: "bg-teal-50 text-teal",
    cancelled: "bg-accent-light text-accent",
    no_show: "bg-accent-light text-accent",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentProgress } from "@/lib/progress";
import { fmtMoney } from "@/lib/utils";
import { ProgressCard } from "@/components/progress-card";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client") redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!client) redirect("/login");

  const students = await prisma.student.findMany({
    where: { clientId: client.id },
    include: {
      tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { firstName: "asc" },
  });

  const activeStudents = students.filter((s) => s.status === "active");

  // Get progress + upcoming lessons for each active student
  const studentProgressData = await Promise.all(
    activeStudents.map(async (s) => {
      const progress = await getStudentProgress(s.id);

      const upcoming = await prisma.lesson.findMany({
        where: { studentId: s.id, status: "scheduled", date: { gte: new Date() } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 3,
        include: {
          tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
          job: { select: { subject: true } },
        },
      });

      return {
        student: {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          curriculum: s.curriculum,
          tutorName: s.tutor ? `${s.tutor.user.firstName} ${s.tutor.user.lastName}` : null,
        },
        progress: {
          mastery: progress.mastery,
          progressPoints: progress.progressPoints,
          trackStatus: progress.trackStatus,
          overallAvg: progress.overallAvg,
          totalAssessments: progress.totalAssessments,
          completedLessons: progress.completedLessons,
          upcomingLessons: progress.upcomingLessons,
        },
        upcomingLessons: upcoming.map((l) => ({
          date: l.date.toISOString().split("T")[0],
          subject: l.job?.subject ?? null,
          tutorName: `${l.tutor.user.firstName} ${l.tutor.user.lastName}`,
          startTime: `${String(l.startTime.getUTCHours()).padStart(2, "0")}:${String(l.startTime.getUTCMinutes()).padStart(2, "0")}`,
        })),
      };
    })
  );

  // Outstanding invoices
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { clientId: client.id, status: { in: ["sent", "overdue"] } },
    include: { lineItems: true },
  });

  const totalUpcoming = studentProgressData.reduce((s, d) => s + d.progress.upcomingLessons, 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">
        Welcome, {client.user.firstName}
      </h1>
      <p className="text-sm text-gray-500 mb-8">Your family&apos;s tutoring overview.</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Students" value={activeStudents.length} />
        <StatCard label="Upcoming Lessons" value={totalUpcoming} trendUp />
        <StatCard label="Account Balance" value={fmtMoney(Number(client.balance))} trendUp={Number(client.balance) === 0} trend={Number(client.balance) > 0 ? "credit" : "✓ No balance"} />
        <StatCard
          label="Outstanding"
          value={fmtMoney(outstandingInvoices.reduce((s, i) => s + Number(i.amount), 0))}
          trendUp={outstandingInvoices.length === 0}
          trend={outstandingInvoices.length > 0 ? `${outstandingInvoices.length} invoice(s)` : "✓ All clear"}
        />
      </div>

      {/* Outstanding invoice banner */}
      {outstandingInvoices.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              You have {outstandingInvoices.length} outstanding invoice{outstandingInvoices.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Total due: {fmtMoney(outstandingInvoices.reduce((s, i) => s + Number(i.amount), 0))}
            </p>
          </div>
          <a
            href="/dashboard/client/invoices"
            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
          >
            View &amp; Pay
          </a>
        </div>
      )}

      {/* Progress cards */}
      <div className="space-y-6">
        {studentProgressData.map((data) => (
          <ProgressCard
            key={data.student.id}
            student={data.student}
            progress={data.progress}
            upcomingLessons={data.upcomingLessons}
          />
        ))}
        {activeStudents.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-4">👨‍👩‍👧</p>
            <p className="text-sm text-gray-400">No active students yet. Your admin will set up your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp }: { label: string; value: string | number; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
      {trend && <p className={`text-xs font-semibold mt-1 ${trendUp ? "text-green-600" : "text-amber-600"}`}>{trend}</p>}
    </div>
  );
}

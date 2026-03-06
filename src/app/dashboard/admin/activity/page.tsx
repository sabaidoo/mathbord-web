import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtMoney } from "@/lib/utils";
import CalendarWidget from "@/components/calendar-widget";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const tab = searchParams.tab ?? "calendar";

  const [lessons, jobs, activeJobs] = await Promise.all([
    prisma.lesson.findMany({
      include: {
        student: { select: { firstName: true, lastName: true } },
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true, title: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    }),
    prisma.job.findMany({
      include: {
        student: { select: { firstName: true, lastName: true } },
        client: { include: { user: { select: { firstName: true, lastName: true } } } },
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.findMany({
      where: { status: { in: ["active", "enquiry"] } },
      select: { id: true, studentId: true, tutorId: true, student: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  // Serialize lessons for the calendar widget
  const calendarLessons = lessons.map((l) => ({
    id: l.id,
    date: l.date.toISOString().split("T")[0],
    startTime: `${String(l.startTime.getUTCHours()).padStart(2, "0")}:${String(l.startTime.getUTCMinutes()).padStart(2, "0")}`,
    durationMinutes: l.durationMinutes,
    status: l.status,
    studentName: `${l.student.firstName} ${l.student.lastName}`,
    tutorName: `${l.tutor.user.firstName} ${l.tutor.user.lastName}`,
    subject: l.job?.subject ?? null,
  }));

  const bookableStudents = activeJobs.map((j) => ({
    id: j.studentId,
    name: `${j.student.firstName} ${j.student.lastName}`,
    jobId: j.id,
    tutorId: j.tutorId,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Activity</h1>
      <p className="text-sm text-gray-500 mb-6">Calendar, jobs, and lesson records.</p>

      {/* Tab Bar */}
      <div className="flex border-b-2 border-gray-200 mb-6">
        {[
          { key: "calendar", label: "📅 Calendar" },
          { key: "jobs", label: `📋 Jobs (${jobs.length})` },
          { key: "lessons", label: `📚 Lessons (${lessons.length})` },
        ].map(({ key, label }) => (
          <a
            key={key}
            href={`/dashboard/admin/activity?tab=${key}`}
            className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
              tab === key ? "text-teal border-teal" : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* ── Calendar ───────────────────────────────────────────────────────── */}
      {tab === "calendar" && (
        <CalendarWidget lessons={calendarLessons} canBook role="admin" bookableStudents={bookableStudents} />
      )}

      {/* ── Jobs ───────────────────────────────────────────────────────────── */}
      {tab === "jobs" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Job</Th>
                  <Th>Student</Th>
                  <Th>Client</Th>
                  <Th>Tutor</Th>
                  <Th>Rate</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td>
                      <p className="font-semibold text-navy">{j.title}</p>
                      <p className="text-xs text-gray-400">{j.subject}</p>
                    </Td>
                    <Td>{j.student.firstName} {j.student.lastName}</Td>
                    <Td>{j.client.user.firstName} {j.client.user.lastName}</Td>
                    <Td>
                      {j.tutor ? `${j.tutor.user.firstName} ${j.tutor.user.lastName}` : <span className="text-gray-400 italic">Unassigned</span>}
                    </Td>
                    <Td>{fmtMoney(Number(j.rate))}/hr</Td>
                    <Td><Badge status={j.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Lessons ────────────────────────────────────────────────────────── */}
      {tab === "lessons" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Student</Th>
                  <Th>Subject</Th>
                  <Th>Tutor</Th>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td className="font-semibold text-navy">{l.student.firstName} {l.student.lastName}</Td>
                    <Td>{l.job?.subject ?? "—"}</Td>
                    <Td>{l.tutor.user.firstName} {l.tutor.user.lastName}</Td>
                    <Td>{fmtDate(l.date)}</Td>
                    <Td className="font-mono text-xs text-teal">
                      {String(l.startTime.getUTCHours()).padStart(2, "0")}:{String(l.startTime.getUTCMinutes()).padStart(2, "0")}
                    </Td>
                    <Td>{l.durationMinutes}m</Td>
                    <Td><Badge status={l.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-bold uppercase tracking-wide text-gray-400 px-4 py-3">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-sm text-gray-700 ${className ?? ""}`}>{children}</td>;
}
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    scheduled: "bg-teal-50 text-teal",
    enquiry: "bg-teal-50 text-teal",
    paused: "bg-amber-100 text-amber-700",
    cancelled: "bg-gray-100 text-gray-600",
    no_show: "bg-accent-light text-accent",
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status.replace(/_/g, " ")}</span>;
}

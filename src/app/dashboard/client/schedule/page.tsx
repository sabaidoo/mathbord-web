import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CalendarWidget from "@/components/calendar-widget";

export default async function ClientSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client") redirect("/login");

  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client) redirect("/login");

  // All students belonging to this client
  const students = await prisma.student.findMany({
    where: { clientId: client.id },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  const [lessons, activeJobs] = await Promise.all([
    prisma.lesson.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: { select: { firstName: true, lastName: true } },
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.job.findMany({
      where: { studentId: { in: studentIds }, status: { in: ["active", "enquiry"] } },
      select: { id: true, studentId: true, tutorId: true, student: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const calLessons = lessons.map((l) => ({
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
      <h1 className="font-display text-3xl text-navy mb-1">Schedule</h1>
      <p className="text-sm text-gray-500 mb-8">
        Sessions for all {students.length} student{students.length !== 1 ? "s" : ""}.
      </p>
      <CalendarWidget lessons={calLessons} canBook role="client" bookableStudents={bookableStudents} />
    </div>
  );
}

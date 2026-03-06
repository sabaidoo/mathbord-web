import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CalendarWidget from "@/components/calendar-widget";

export const dynamic = "force-dynamic";

export default async function TutorSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/login");

  const tutor = await prisma.tutor.findUnique({ where: { userId: session.user.id } });
  if (!tutor) redirect("/login");

  const [lessons, activeJobs] = await Promise.all([
    prisma.lesson.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
        job: { select: { subject: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.job.findMany({
      where: { tutorId: tutor.id, status: { in: ["active", "enquiry"] } },
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
      <h1 className="font-display text-3xl text-navy mb-1">My Schedule</h1>
      <p className="text-sm text-gray-500 mb-8">
        {lessons.filter((l) => l.status === "scheduled").length} upcoming session{lessons.filter((l) => l.status === "scheduled").length !== 1 ? "s" : ""}
      </p>
      <CalendarWidget lessons={calLessons} canBook role="tutor" bookableStudents={bookableStudents} />
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CalendarWidget from "@/components/calendar-widget";

export default async function StudentSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  const student = await prisma.student.findFirst({ where: { userId: session.user.id } });
  if (!student) redirect("/dashboard/student");

  const lessons = await prisma.lesson.findMany({
    where: { studentId: student.id },
    include: {
      student: { select: { firstName: true, lastName: true } },
      tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
      job: { select: { subject: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

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

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">My Schedule</h1>
      <p className="text-sm text-gray-500 mb-8">
        {lessons.filter((l) => l.status === "scheduled").length} upcoming session{lessons.filter((l) => l.status === "scheduled").length !== 1 ? "s" : ""}.
      </p>
      {/* canBook=false for students — they can view but not book directly */}
      <CalendarWidget lessons={calLessons} canBook={false} role="student" />
    </div>
  );
}

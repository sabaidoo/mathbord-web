import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgress } from "@/lib/progress";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  const studentId = params.id;

  // RBAC checks
  if (role === "tutor") {
    const tutor = await prisma.tutor.findUnique({ where: { userId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
    }
    const student = await prisma.student.findFirst({
      where: { id: studentId, tutorId: tutor.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (role === "client") {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      return NextResponse.json({ error: "Client record not found" }, { status: 404 });
    }
    const student = await prisma.student.findFirst({
      where: { id: studentId, clientId: client.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (role === "student") {
    const student = await prisma.student.findFirst({
      where: { id: studentId, userId },
    });
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // admin: no additional check needed

  // Verify student exists
  const studentRecord = await prisma.student.findUnique({ where: { id: studentId } });
  if (!studentRecord) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Compute progress using the shared library function
  const progress = await getStudentProgress(studentId);

  // Fetch the next 3 upcoming scheduled lessons for this student
  const now = new Date();
  const upcomingLessons = await prisma.lesson.findMany({
    where: {
      studentId,
      status: "scheduled",
      date: { gte: now },
    },
    include: {
      tutor: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      job: { select: { subject: true, title: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 3,
  });

  return NextResponse.json({ progress, upcomingLessons });
}

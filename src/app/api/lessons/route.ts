import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmation } from "@/lib/email";

const VALID_DURATIONS = [45, 60, 90, 120];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  const { searchParams } = new URL(req.url);
  const tutorIdParam = searchParams.get("tutor_id");
  const studentIdParam = searchParams.get("student_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  // Build base where clause
  const where: Record<string, unknown> = {};

  // Scope by role
  if (role === "tutor") {
    const tutor = await prisma.tutor.findUnique({ where: { userId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
    }
    where.tutorId = tutor.id;
  } else if (role === "client") {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      return NextResponse.json({ error: "Client record not found" }, { status: 404 });
    }
    const children = await prisma.student.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });
    where.studentId = { in: children.map((c) => c.id) };
  } else if (role === "student") {
    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }
    where.studentId = student.id;
  }
  // admin: no role-based restriction

  // Apply optional query filters (admin can filter by tutor_id or student_id freely;
  // other roles can further narrow within their already-scoped results)
  if (tutorIdParam) {
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: tutor_id filter is admin only" }, { status: 403 });
    }
    where.tutorId = tutorIdParam;
  }
  if (studentIdParam) {
    if (role === "admin") {
      where.studentId = studentIdParam;
    } else if (role === "tutor") {
      // Tutor can narrow to a specific student, but only one they're assigned to
      where.studentId = studentIdParam;
    } else if (role === "client") {
      // The client where clause already limits to their children; ensure the
      // requested student belongs to them
      const client = await prisma.client.findUnique({ where: { userId } });
      if (!client) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const student = await prisma.student.findFirst({
        where: { id: studentIdParam, clientId: client.id },
      });
      if (!student) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      where.studentId = studentIdParam;
    }
    // student role: ignore student_id param (already scoped to self)
  }

  // Date range filter
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.date = dateFilter;
  }

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });

  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId } = session.user;

  let body: {
    studentId?: unknown;
    jobId?: unknown;
    date?: unknown;
    startTime?: unknown;
    durationMinutes?: unknown;
    tutorId?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { studentId, jobId, date, startTime, durationMinutes, tutorId: tutorIdFromBody } = body;

  // Validate required fields
  if (!studentId || !jobId || !date || !startTime || durationMinutes === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: studentId, jobId, date, startTime, durationMinutes" },
      { status: 400 }
    );
  }

  // Validate durationMinutes
  const durationNum = Number(durationMinutes);
  if (!VALID_DURATIONS.includes(durationNum)) {
    return NextResponse.json(
      { error: `durationMinutes must be one of: ${VALID_DURATIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate startTime format HH:MM
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(String(startTime))) {
    return NextResponse.json({ error: "startTime must be in HH:MM format" }, { status: 400 });
  }

  // Fetch the job to infer tutorId if not provided
  const job = await prisma.job.findUnique({
    where: { id: String(jobId) },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Resolve tutorId: use provided value or fall back to job's tutor
  const resolvedTutorId = tutorIdFromBody ? String(tutorIdFromBody) : job.tutorId;
  if (!resolvedTutorId) {
    return NextResponse.json(
      { error: "tutorId could not be resolved: provide tutorId or assign a tutor to the job" },
      { status: 400 }
    );
  }

  // Parse date and startTime into proper DB types
  const lessonDate = new Date(String(date));
  const [hours, minutes] = String(startTime).split(":").map(Number);
  // Store startTime as a DateTime with arbitrary epoch date, always in UTC
  const startTimeDt = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

  // TODO: Lessonspace virtual classroom URL — skip for now, set to null
  // When implemented: POST to https://api.thelessonspace.com/v2/demo/ and use the response URL
  const lessonspaceUrl: string | null = null;

  const lesson = await prisma.lesson.create({
    data: {
      studentId: String(studentId),
      jobId: String(jobId),
      tutorId: resolvedTutorId,
      date: lessonDate,
      startTime: startTimeDt,
      durationMinutes: durationNum,
      status: "scheduled",
      lessonspaceUrl,
      createdById: userId,
    },
    include: {
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
    },
  });

  // Email: send booking confirmation to both tutor and client
  try {
    // Fetch tutor's email (user record linked via tutor)
    const tutorWithEmail = await prisma.tutor.findUnique({
      where: { id: resolvedTutorId },
      select: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    // Fetch client email via student → client → user
    const studentWithClient = await prisma.student.findUnique({
      where: { id: String(studentId) },
      select: {
        client: {
          select: { user: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (tutorWithEmail?.user && studentWithClient?.client?.user) {
      const tutorUser = tutorWithEmail.user;
      const clientUser = studentWithClient.client.user;

      // Format date as YYYY-MM-DD and startTime as HH:MM from stored DateTime values
      const lessonDateStr = lessonDate.toISOString().split("T")[0];
      const startHH = String(hours).padStart(2, "0");
      const startMM = String(minutes).padStart(2, "0");
      const startTimeStr = `${startHH}:${startMM}`;

      await sendBookingConfirmation({
        tutorEmail: tutorUser.email,
        tutorName: `${tutorUser.firstName} ${tutorUser.lastName}`,
        clientEmail: clientUser.email,
        clientName: `${clientUser.firstName} ${clientUser.lastName}`,
        studentName: `${lesson.student.firstName} ${lesson.student.lastName}`,
        subject: lesson.job?.subject ?? null,
        date: lessonDateStr,
        startTime: startTimeStr,
        durationMinutes: durationNum,
        lessonspaceUrl: lessonspaceUrl,
      });
    }
  } catch (e) {
    console.error("Failed to send booking confirmation email:", e);
  }

  return NextResponse.json(lesson, { status: 201 });
}

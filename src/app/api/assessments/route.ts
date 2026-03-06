import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json({ error: "student_id query parameter is required" }, { status: 400 });
  }

  // RBAC access checks
  if (role === "tutor") {
    // Tutor can only access assessments for their assigned students
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
    // Client can only access assessments for their children
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
    // Student can only access their own assessments
    const student = await prisma.student.findFirst({
      where: { id: studentId, userId },
    });
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // admin: no additional check needed

  const assessments = await prisma.assessment.findMany({
    where: { studentId },
    include: {
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role !== "tutor") {
    return NextResponse.json({ error: "Forbidden: only tutors can create assessments" }, { status: 403 });
  }

  const tutor = await prisma.tutor.findUnique({ where: { userId } });
  if (!tutor) {
    return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
  }

  let body: {
    studentId?: unknown;
    jobId?: unknown;
    topic?: unknown;
    type?: unknown;
    score?: unknown;
    maxScore?: unknown;
    date?: unknown;
    notes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { studentId, jobId, topic, type, score, maxScore, date, notes } = body;

  // Validate required fields
  if (!studentId || !jobId || !topic || !type || score === undefined || score === null || !maxScore || !date) {
    return NextResponse.json(
      { error: "Missing required fields: studentId, jobId, topic, type, score, maxScore, date" },
      { status: 400 }
    );
  }

  const scoreNum = Number(score);
  const maxScoreNum = Number(maxScore);

  if (isNaN(scoreNum) || isNaN(maxScoreNum)) {
    return NextResponse.json({ error: "score and maxScore must be numbers" }, { status: 400 });
  }

  if (scoreNum < 0 || scoreNum > maxScoreNum) {
    return NextResponse.json(
      { error: `score must be between 0 and maxScore (${maxScoreNum})` },
      { status: 400 }
    );
  }

  if (maxScoreNum <= 0) {
    return NextResponse.json({ error: "maxScore must be greater than 0" }, { status: 400 });
  }

  // Verify tutor is assigned to this student
  const student = await prisma.student.findFirst({
    where: { id: String(studentId), tutorId: tutor.id },
  });
  if (!student) {
    return NextResponse.json({ error: "Forbidden: student is not assigned to you" }, { status: 403 });
  }

  const assessment = await prisma.assessment.create({
    data: {
      studentId: String(studentId),
      jobId: String(jobId),
      tutorId: tutor.id,
      topic: String(topic),
      type: type as Parameters<typeof prisma.assessment.create>[0]["data"]["type"],
      score: scoreNum,
      maxScore: maxScoreNum,
      date: new Date(String(date)),
      notes: notes ? String(notes) : null,
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}

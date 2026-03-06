import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role !== "tutor" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Tutor can only update their own assessments
  if (role === "tutor") {
    const tutor = await prisma.tutor.findUnique({ where: { userId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
    }
    if (assessment.tutorId !== tutor.id) {
      return NextResponse.json({ error: "Forbidden: you can only update your own assessments" }, { status: 403 });
    }
  }

  let body: {
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

  const { topic, type, score, maxScore, date, notes } = body;

  // Validate score range if score or maxScore is being updated
  const newScore = score !== undefined ? Number(score) : Number(assessment.score);
  const newMaxScore = maxScore !== undefined ? Number(maxScore) : Number(assessment.maxScore);

  if ((score !== undefined || maxScore !== undefined)) {
    if (isNaN(newScore) || isNaN(newMaxScore)) {
      return NextResponse.json({ error: "score and maxScore must be numbers" }, { status: 400 });
    }
    if (newScore < 0 || newScore > newMaxScore) {
      return NextResponse.json(
        { error: `score must be between 0 and maxScore (${newMaxScore})` },
        { status: 400 }
      );
    }
    if (newMaxScore <= 0) {
      return NextResponse.json({ error: "maxScore must be greater than 0" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (topic !== undefined) updateData.topic = String(topic);
  if (type !== undefined) updateData.type = type;
  if (score !== undefined) updateData.score = newScore;
  if (maxScore !== undefined) updateData.maxScore = newMaxScore;
  if (date !== undefined) updateData.date = new Date(String(date));
  if (notes !== undefined) updateData.notes = notes ? String(notes) : null;

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: updateData,
    include: {
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role !== "admin" && role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Tutor can only delete their own assessments
  if (role === "tutor") {
    const tutor = await prisma.tutor.findUnique({ where: { userId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
    }
    if (assessment.tutorId !== tutor.id) {
      return NextResponse.json({ error: "Forbidden: you can only delete your own assessments" }, { status: 403 });
    }
  }

  await prisma.assessment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

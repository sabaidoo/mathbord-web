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

  if (role !== "admin" && role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Tutor can only update their own lessons
  if (role === "tutor") {
    const tutor = await prisma.tutor.findUnique({ where: { userId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor record not found" }, { status: 404 });
    }
    if (lesson.tutorId !== tutor.id) {
      return NextResponse.json({ error: "Forbidden: you can only update your own lessons" }, { status: 403 });
    }
  }

  let body: {
    status?: unknown;
    report?: unknown;
    date?: unknown;
    startTime?: unknown;
    durationMinutes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, report, date, startTime, durationMinutes } = body;

  const VALID_DURATIONS = [45, 60, 90, 120];
  const VALID_STATUSES = ["scheduled", "completed", "cancelled", "no_show"];

  const updateData: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(String(status))) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.status = status;
  }

  if (report !== undefined) {
    updateData.report = report ? String(report) : null;
  }

  if (date !== undefined) {
    updateData.date = new Date(String(date));
  }

  if (startTime !== undefined) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(String(startTime))) {
      return NextResponse.json({ error: "startTime must be in HH:MM format" }, { status: 400 });
    }
    const [hours, minutes] = String(startTime).split(":").map(Number);
    updateData.startTime = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
  }

  if (durationMinutes !== undefined) {
    const durationNum = Number(durationMinutes);
    if (!VALID_DURATIONS.includes(durationNum)) {
      return NextResponse.json(
        { error: `durationMinutes must be one of: ${VALID_DURATIONS.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.durationMinutes = durationNum;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: updateData,
    include: {
      tutor: { select: { user: { select: { firstName: true, lastName: true } } } },
      student: { select: { firstName: true, lastName: true } },
      job: { select: { title: true, subject: true } },
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
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can cancel lessons" }, { status: 403 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (lesson.status === "cancelled") {
    return NextResponse.json({ error: "Lesson is already cancelled" }, { status: 400 });
  }

  // Soft cancel — do not hard-delete
  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json(updated);
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  const where: Record<string, unknown> = {};

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
    // Client sees jobs for their children
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
  // admin: no additional filter

  const jobs = await prisma.job.findMany({
    where,
    include: {
      student: { select: { firstName: true, lastName: true } },
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      tutor: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can create jobs" }, { status: 403 });
  }

  let body: {
    title?: unknown;
    subject?: unknown;
    studentId?: unknown;
    clientId?: unknown;
    tutorId?: unknown;
    rate?: unknown;
    status?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, subject, studentId, clientId, tutorId, rate, status } = body;

  if (!title || !studentId || !clientId || rate === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: title, studentId, clientId, rate" },
      { status: 400 }
    );
  }

  const rateNum = Number(rate);
  if (isNaN(rateNum) || rateNum < 0) {
    return NextResponse.json({ error: "rate must be a non-negative number" }, { status: 400 });
  }

  const VALID_STATUSES = ["enquiry", "active", "paused", "completed", "cancelled"];
  if (status !== undefined && !VALID_STATUSES.includes(String(status))) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const job = await prisma.job.create({
    data: {
      title: String(title),
      subject: subject ? String(subject) : null,
      studentId: String(studentId),
      clientId: String(clientId),
      tutorId: tutorId ? String(tutorId) : null,
      rate: rateNum,
      status: (status as Parameters<typeof prisma.job.create>[0]["data"]["status"]) ?? "enquiry",
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      tutor: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json(job, { status: 201 });
}

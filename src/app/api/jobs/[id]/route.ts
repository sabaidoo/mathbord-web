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
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can update jobs" }, { status: 403 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  let body: {
    status?: unknown;
    tutorId?: unknown;
    rate?: unknown;
    title?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, tutorId, rate, title } = body;

  const VALID_STATUSES = ["enquiry", "active", "paused", "completed", "cancelled"];
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

  if (tutorId !== undefined) {
    // Allow explicitly unsetting tutor by passing null
    updateData.tutorId = tutorId === null ? null : String(tutorId);
  }

  if (rate !== undefined) {
    const rateNum = Number(rate);
    if (isNaN(rateNum) || rateNum < 0) {
      return NextResponse.json({ error: "rate must be a non-negative number" }, { status: 400 });
    }
    updateData.rate = rateNum;
  }

  if (title !== undefined) {
    updateData.title = String(title);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: updateData,
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

  return NextResponse.json(updated);
}

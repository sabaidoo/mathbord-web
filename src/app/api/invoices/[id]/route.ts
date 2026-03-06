import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role === "tutor" || role === "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      lineItems: true,
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Client can only view their own invoice
  if (role === "client") {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client || invoice.clientId !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(invoice);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can update invoices" }, { status: 403 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  let body: {
    status?: unknown;
    dueDate?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, dueDate } = body;

  const VALID_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];
  const updateData: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(String(status))) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.status = status;
    // Record paidAt if marking as paid manually
    if (status === "paid" && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }
  }

  if (dueDate !== undefined) {
    updateData.dueDate = new Date(String(dueDate));
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: updateData,
    include: {
      lineItems: true,
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}

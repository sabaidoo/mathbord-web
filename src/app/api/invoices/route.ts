import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role === "tutor" || role === "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clientIdParam = searchParams.get("client_id");

  if (role === "admin") {
    const where: Record<string, unknown> = {};
    if (clientIdParam) {
      where.clientId = clientIdParam;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        lineItems: true,
        client: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { issuedDate: "desc" },
    });

    return NextResponse.json(invoices);
  }

  // role === "client"
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    return NextResponse.json({ error: "Client record not found" }, { status: 404 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    include: {
      lineItems: true,
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { issuedDate: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can create invoices" }, { status: 403 });
  }

  let body: {
    clientId?: unknown;
    issuedDate?: unknown;
    dueDate?: unknown;
    lineItems?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { clientId, issuedDate, dueDate, lineItems } = body;

  if (!clientId || !issuedDate || !dueDate || !lineItems) {
    return NextResponse.json(
      { error: "Missing required fields: clientId, issuedDate, dueDate, lineItems" },
      { status: 400 }
    );
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: "lineItems must be a non-empty array" }, { status: 400 });
  }

  // Validate each line item
  for (const item of lineItems) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("description" in item) ||
      !("amount" in item)
    ) {
      return NextResponse.json(
        { error: "Each line item must have description and amount" },
        { status: 400 }
      );
    }
    if (isNaN(Number(item.amount)) || Number(item.amount) < 0) {
      return NextResponse.json({ error: "Line item amount must be a non-negative number" }, { status: 400 });
    }
  }

  // Auto-compute total from line items
  const totalAmount = (lineItems as Array<{ description: string; amount: number | string }>).reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  // Verify the client exists
  const clientRecord = await prisma.client.findUnique({ where: { id: String(clientId) } });
  if (!clientRecord) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const invoice = await prisma.invoice.create({
    data: {
      clientId: String(clientId),
      amount: totalAmount,
      issuedDate: new Date(String(issuedDate)),
      dueDate: new Date(String(dueDate)),
      status: "draft",
      lineItems: {
        create: (lineItems as Array<{ description: string; amount: number | string }>).map((item) => ({
          description: String(item.description),
          amount: Number(item.amount),
        })),
      },
    },
    include: {
      lineItems: true,
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}

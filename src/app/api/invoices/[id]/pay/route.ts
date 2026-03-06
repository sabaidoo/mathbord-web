import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role !== "client") {
    return NextResponse.json({ error: "Forbidden: only clients can pay invoices" }, { status: 403 });
  }

  // Verify the client record and ownership
  const client = await prisma.client.findUnique({
    where: { userId },
    include: { user: { select: { email: true } } },
  });
  if (!client) {
    return NextResponse.json({ error: "Client record not found" }, { status: 404 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { lineItems: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Verify this invoice belongs to the authenticated client
  if (invoice.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow payment of "sent" invoices
  if (invoice.status !== "sent") {
    return NextResponse.json(
      { error: `Invoice cannot be paid: current status is "${invoice.status}"` },
      { status: 400 }
    );
  }

  if (invoice.lineItems.length === 0) {
    return NextResponse.json({ error: "Invoice has no line items" }, { status: 400 });
  }

  const userEmail = client.user.email;

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: userEmail,
    line_items: invoice.lineItems.map((item) => ({
      price_data: {
        currency: "cad",
        product_data: { name: item.description },
        unit_amount: Math.round(Number(item.amount) * 100),
      },
      quantity: 1,
    })),
    metadata: { invoiceId: invoice.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client/invoices?paid=${invoice.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client/invoices`,
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}

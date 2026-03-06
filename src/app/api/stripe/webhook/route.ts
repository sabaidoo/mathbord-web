import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

// Required for Stripe webhook signature verification — Next.js must not parse the body
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature header" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle known event types
  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object;
      const invoiceId = checkoutSession.metadata?.invoiceId;

      if (invoiceId) {
        try {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "paid",
              paidAt: new Date(),
              stripeInvoiceId: checkoutSession.id,
            },
          });
          console.log(`[stripe/webhook] Invoice ${invoiceId} marked as paid`);
        } catch (err) {
          console.error(`[stripe/webhook] Failed to update invoice ${invoiceId}:`, err);
          // Return 500 so Stripe retries the event
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      } else {
        console.warn("[stripe/webhook] checkout.session.completed received with no invoiceId in metadata");
      }
      break;
    }

    default:
      // Return 200 for unhandled events — Stripe requires 200 to stop retries
      console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true, unhandled: true });
  }

  return NextResponse.json({ received: true });
}

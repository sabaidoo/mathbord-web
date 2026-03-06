import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateResetToken } from "@/lib/password-reset";
import { sendPasswordReset } from "@/lib/email";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// PUBLIC — no auth required
export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Missing required field: email" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Security: always return 200 — never reveal whether the email exists
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  if (user) {
    try {
      const token = generateResetToken(user.id);
      const resetUrl = `${APP_URL}/reset-password?token=${token}`;

      await sendPasswordReset({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        resetUrl,
      });
    } catch (e) {
      // Log server-side but don't reveal the error to the client
      console.error("[forgot-password] Failed to send reset email:", e);
    }
  }

  return NextResponse.json({
    message: "If that email exists, a reset link has been sent.",
  });
}

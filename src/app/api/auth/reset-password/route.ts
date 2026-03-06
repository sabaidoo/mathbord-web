import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/password-reset";
import { hash } from "bcryptjs";

// PUBLIC — no auth required
export async function POST(req: NextRequest) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, password } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { error: "Missing required field: token" },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Missing required field: password" },
      { status: 400 }
    );
  }

  // Validate minimum length
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  // Verify the reset token
  const result = verifyResetToken(token);
  if (!result) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const { userId } = result;

  // Confirm the user still exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 400 }
    );
  }

  // Hash the new password (12 rounds)
  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Password updated successfully." });
}

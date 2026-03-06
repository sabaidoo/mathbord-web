import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PUBLIC — no auth required; used by the registration page to validate an invite token
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token) {
    return NextResponse.json({ valid: false, reason: "Token is required" }, { status: 400 });
  }

  const now = new Date();

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      email: true,
      personalNote: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, reason: "Invite not found" });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({
      valid: false,
      reason: invite.status === "accepted" ? "Invite has already been used" : "Invite is no longer valid",
    });
  }

  if (invite.expiresAt <= now) {
    // Mark expired in DB so future checks are fast
    await prisma.invite.update({
      where: { token },
      data: { status: "expired" },
    });
    return NextResponse.json({ valid: false, reason: "Invite has expired" });
  }

  return NextResponse.json({
    valid: true,
    invite: {
      name: invite.name,
      email: invite.email,
      personalNote: invite.personalNote,
    },
  });
}

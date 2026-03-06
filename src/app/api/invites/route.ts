import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can view invites" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can send invites" }, { status: 403 });
  }

  let body: {
    email?: unknown;
    name?: unknown;
    personalNote?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, name, personalNote } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "Missing required fields: email, name" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Generate a secure URL-safe token
  const token = crypto.randomUUID();

  // Invite expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: {
      email: String(email).toLowerCase().trim(),
      name: String(name),
      personalNote: personalNote ? String(personalNote) : null,
      token,
      expiresAt,
      status: "pending",
    },
  });

  // Email: send invite to client
  try {
    await sendInviteEmail({
      to: invite.email,
      toName: invite.name,
      personalNote: invite.personalNote,
      token: invite.token,
      adminName: session.user.name ?? "The Mathbord Team",
    });
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  return NextResponse.json(invite, { status: 201 });
}

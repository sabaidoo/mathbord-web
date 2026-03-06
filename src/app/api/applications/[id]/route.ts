import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendApplicationStatus } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can update applications" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: "Missing required field: status" }, { status: 400 });
  }

  const VALID_STATUSES = ["pending", "interview", "approved", "rejected"];
  if (!VALID_STATUSES.includes(String(status))) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const previousStatus = application.status;

  // When approving, provision a User + Tutor account if one doesn't exist yet
  if (String(status) === "approved" && previousStatus !== "approved") {
    const existingUser = await prisma.user.findUnique({ where: { email: application.email } });
    if (!existingUser) {
      // Split name into first/last (everything after last space → lastName)
      const nameParts = application.name.trim().split(/\s+/);
      const lastName = nameParts.length > 1 ? nameParts.pop()! : "";
      const firstName = nameParts.join(" ") || application.name.trim();

      // Generate a cryptographically random temporary password
      const tempPassword = crypto.randomBytes(9).toString("base64"); // 12 chars
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: application.email,
            passwordHash,
            role: "tutor",
            firstName,
            lastName,
            phone: application.phone ?? undefined,
            country: application.country ?? undefined,
            status: "active",
          },
        });

        await tx.tutor.create({
          data: {
            userId: newUser.id,
            subjects: Array.isArray(application.subjects)
              ? JSON.stringify(application.subjects)
              : (application.subjects ?? "[]"),
            levels: "[]",
            hourlyRate: 0,
            payRate: 0,
            country: application.country ?? undefined,
            city: application.city ?? undefined,
            degree: application.degree ?? undefined,
          },
        });
      });
    }
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: {
      status: status as Parameters<typeof prisma.application.update>[0]["data"]["status"],
      reviewedBy: userId,
    },
  });

  // Email: notify applicant if their status changed to a notifiable state
  const notifiableStatuses = ["interview", "approved", "rejected"] as const;
  type NotifiableStatus = (typeof notifiableStatuses)[number];
  const isNotifiable = (s: string): s is NotifiableStatus =>
    notifiableStatuses.includes(s as NotifiableStatus);

  if (
    String(status) !== String(previousStatus) &&
    isNotifiable(String(status))
  ) {
    try {
      await sendApplicationStatus({
        to: application.email,
        applicantName: application.name,
        newStatus: String(status) as NotifiableStatus,
      });
    } catch (e) {
      console.error("Failed to send application status email:", e);
    }
  }

  return NextResponse.json(updated);
}

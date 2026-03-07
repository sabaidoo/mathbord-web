import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendAdminConsultationAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

// PUBLIC — no auth required; submitted from the marketing/landing page
export async function POST(req: NextRequest) {
  let body: {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    phone?: unknown;
    province?: unknown;
    subjects?: unknown;
    gradeLevel?: unknown;
    goals?: unknown;
    marketingConsent?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    province,
    subjects,
    gradeLevel,
    goals,
    marketingConsent,
  } = body;

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "Missing required fields: firstName, lastName, email" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Normalize subjects to array
  let subjectsArray: string[] = [];
  if (Array.isArray(subjects)) {
    subjectsArray = subjects.map((s) => String(s));
  } else if (subjects) {
    subjectsArray = [String(subjects)];
  }

  const consultation = await prisma.consultation.create({
    data: {
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone) : null,
      province: province ? String(province) : null,
      subjects: subjectsArray,
      gradeLevel: gradeLevel ? String(gradeLevel) : null,
      goals: goals ? String(goals) : null,
      marketingConsent: Boolean(marketingConsent),
    },
  });

  // Email: alert admin of new consultation request
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ?? process.env.FROM_EMAIL ?? "hello@mathbord.com";
    await sendAdminConsultationAlert({
      adminEmail,
      firstName: consultation.firstName,
      lastName: consultation.lastName,
      email: consultation.email,
      phone: consultation.phone,
      province: consultation.province,
      subjects: consultation.subjects as string[],
      gradeLevel: consultation.gradeLevel,
      goals: consultation.goals,
    });
  } catch (e) {
    console.error("Failed to send consultation alert email:", e);
  }

  return NextResponse.json({ id: consultation.id }, { status: 201 });
}

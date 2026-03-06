import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendApplicationReceived } from "@/lib/email";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { role } = session.user;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only admins can view applications" }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json(applications);
}

// PUBLIC — no auth required for tutor applications submitted from the marketing site
export async function POST(req: NextRequest) {
  let body: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    country?: unknown;
    city?: unknown;
    degree?: unknown;
    subjects?: unknown;
    experience?: unknown;
    approach?: unknown;
    source?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, country, city, degree, subjects, experience, approach, source } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Missing required fields: name, email" }, { status: 400 });
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

  const application = await prisma.application.create({
    data: {
      name: String(name),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone) : null,
      country: country ? String(country) : null,
      city: city ? String(city) : null,
      degree: degree ? String(degree) : null,
      subjects: JSON.stringify(subjectsArray),
      experience: experience ? String(experience) : null,
      approach: approach ? String(approach) : null,
      source: source ? String(source) : null,
      status: "pending",
    },
  });

  // Email: notify applicant that their application was received
  try {
    await sendApplicationReceived({
      to: application.email,
      applicantName: application.name,
      subjects: JSON.parse(application.subjects) as string[],
    });
  } catch (e) {
    console.error("Failed to send application received email:", e);
  }

  return NextResponse.json(application, { status: 201 });
}

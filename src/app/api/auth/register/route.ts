import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

interface StudentInput {
  firstName: string;
  lastName: string;
  grade?: string;
  curriculum?: string;
  goals?: string;
}

// PUBLIC — no auth required; called from the invite registration page
export async function POST(req: NextRequest) {
  let body: {
    token?: unknown;
    email?: unknown;
    password?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    phone?: unknown;
    students?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, email, password, firstName, lastName, phone, students } = body;

  // Validate required fields
  if (!token || !email || !password || !firstName || !lastName) {
    return NextResponse.json(
      { error: "Missing required fields: token, email, password, firstName, lastName" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Validate password length
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Validate students array
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json(
      { error: "students must be a non-empty array" },
      { status: 400 }
    );
  }

  for (const s of students) {
    if (
      typeof s !== "object" ||
      s === null ||
      !("firstName" in s) ||
      !("lastName" in s) ||
      !s.firstName ||
      !s.lastName
    ) {
      return NextResponse.json(
        { error: "Each student must have firstName and lastName" },
        { status: 400 }
      );
    }
  }

  // Validate invite token (exists, status=pending, not expired)
  const now = new Date();
  const invite = await prisma.invite.findUnique({
    where: { token: String(token) },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      {
        error:
          invite.status === "accepted"
            ? "This invite link has already been used"
            : "This invite link is no longer valid",
      },
      { status: 400 }
    );
  }

  if (invite.expiresAt <= now) {
    // Mark expired
    await prisma.invite.update({ where: { token: String(token) }, data: { status: "expired" } });
    return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
  }

  // Check if the email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
  });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Hash the password with bcryptjs (12 rounds)
  const passwordHash = await hash(String(password), 12);

  // Run everything in a single transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create the User with role=client
    const newUser = await tx.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash,
        role: "client",
        firstName: String(firstName),
        lastName: String(lastName),
        phone: phone ? String(phone) : null,
        status: "active",
      },
    });

    // 2. Create the Client record
    const newClient = await tx.client.create({
      data: {
        userId: newUser.id,
        clientSince: now,
        inviteId: invite.id,
        balance: 0,
      },
    });

    // 3. Create Student record(s) for each student in the array
    const studentInputs = students as StudentInput[];
    for (const student of studentInputs) {
      await tx.student.create({
        data: {
          userId: null, // Young students may not have their own login
          clientId: newClient.id,
          firstName: String(student.firstName),
          lastName: String(student.lastName),
          grade: student.grade ? String(student.grade) : null,
          curriculum: student.curriculum ? String(student.curriculum) : null,
          goals: student.goals ? String(student.goals) : null,
          status: "prospect",
        },
      });
    }

    // 4. Mark the invite as accepted
    await tx.invite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: now,
      },
    });
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

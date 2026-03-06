/**
 * prisma/seed.ts
 * Populates the database with all mock data from mathbord-saas-prototype.html.
 *
 * Run with:  npm run db:seed
 * Requires:  DATABASE_URL set in .env.local and `prisma generate` already run.
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Default password for all seed accounts — change in production!
const DEFAULT_PASSWORD = "mathbord2026";

async function main() {
  console.log("🌱  Seeding Mathbord database…");

  const passwordHash = await hash(DEFAULT_PASSWORD, 12);

  // ─── Clean slate (order matters for FK constraints) ──────────────────────
  await prisma.$transaction([
    prisma.assessment.deleteMany(),
    prisma.curriculumTopic.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.job.deleteMany(),
    prisma.application.deleteMany(),
    prisma.student.deleteMany(),
    prisma.tutor.deleteMany(),
    prisma.client.deleteMany(),
    prisma.invite.deleteMany(),
    prisma.consultation.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ─── Admin user ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      id: "u-admin",
      email: "admin@mathbord.com",
      passwordHash,
      role: "admin",
      firstName: "Alex",
      lastName: "Admin",
      phone: "604-555-0001",
      country: "CA",
      status: "active",
    },
  });
  console.log("  ✓ Admin user:", adminUser.email);

  // ─── Tutor users + profiles ──────────────────────────────────────────────
  const tutorSeeds = [
    {
      userId: "u-t1", tutorId: "t1",
      email: "sarah@mathbord.com", firstName: "Sarah", lastName: "Chen",
      phone: "604-555-1001", status: "active", country: "CA",
      subjects: ["Calculus", "Linear Algebra"],
      levels: ["University"],
      hourlyRate: 65, payRate: 48,
      city: "Vancouver", province: "BC",
      degree: "BSc Mathematics, UBC",
      bio: "Former TA at UBC. Specializes in making abstract math concrete.",
      rating: 4.9, totalHours: 142,
    },
    {
      userId: "u-t2", tutorId: "t2",
      email: "james@mathbord.com", firstName: "James", lastName: "Okafor",
      phone: "416-555-1002", status: "active", country: "CA",
      subjects: ["Functions", "Trigonometry"],
      levels: ["High School"],
      hourlyRate: 55, payRate: 40,
      city: "Toronto", province: "ON",
      degree: "BEd Mathematics, U of T",
      bio: "High school math teacher with 6 years classroom experience.",
      rating: 4.8, totalHours: 98,
    },
    {
      userId: "u-t3", tutorId: "t3",
      email: "priya@mathbord.com", firstName: "Priya", lastName: "Sharma",
      phone: "604-555-1003", status: "active", country: "CA",
      subjects: ["SAT Math", "GRE Quant"],
      levels: ["Exam Prep"],
      hourlyRate: 70, payRate: 52,
      city: "Vancouver", province: "BC",
      degree: "MSc Statistics, SFU",
      bio: "Helped 100+ students boost SAT Math scores by 50-100 points.",
      rating: 4.7, totalHours: 76,
    },
    {
      userId: "u-t4", tutorId: "t4",
      email: "michael@mathbord.com", firstName: "Michael", lastName: "Park",
      phone: "778-555-1004", status: "active", country: "CA",
      subjects: ["IB Math AA", "AP Calculus"],
      levels: ["IB/AP"],
      hourlyRate: 60, payRate: 45,
      city: "Burnaby", province: "BC",
      degree: "BSc Applied Math, SFU",
      bio: "IB graduate. Knows the curriculum inside out.",
      rating: 4.9, totalHours: 64,
    },
    {
      userId: "u-t5", tutorId: "t5",
      email: "emily@mathbord.com", firstName: "Emily", lastName: "Torres",
      phone: "514-555-1005", status: "prospect", country: "CA",
      subjects: ["Grade 7-10 Math"],
      levels: ["Middle School", "High School"],
      hourlyRate: 45, payRate: 32,
      city: "Montreal", province: "QC",
      degree: "BEd Elementary, McGill",
      bio: "Patient and encouraging teacher specializing in building foundations.",
      rating: 0, totalHours: 0,
    },
    {
      userId: "u-t6", tutorId: "t6",
      email: "oliver@mathbord.com", firstName: "Oliver", lastName: "Hughes",
      phone: "+44-20-7946-0958", status: "active", country: "UK",
      subjects: ["GCSE Maths", "A-Level Maths"],
      levels: ["GCSE", "A-Level"],
      hourlyRate: 55, payRate: 40,
      city: "London", province: null,
      degree: "BSc Mathematics, Imperial College London",
      bio: "Experienced UK maths tutor specialising in GCSE and A-Level exam preparation across all exam boards.",
      rating: 4.8, totalHours: 52,
    },
    {
      userId: "u-t7", tutorId: "t7",
      email: "charlotte@mathbord.com", firstName: "Charlotte", lastName: "Webb",
      phone: "+44-7911-123456", status: "active", country: "UK",
      subjects: ["A-Level Further Maths", "Decision Maths"],
      levels: ["A-Level", "Further Maths"],
      hourlyRate: 65, payRate: 48,
      city: "Cambridge", province: null,
      degree: "MMath Mathematics, University of Cambridge",
      bio: "Cambridge graduate specialising in Further Maths and university entrance preparation.",
      rating: 4.9, totalHours: 38,
    },
    {
      userId: "u-t8", tutorId: "t8",
      email: "marcus@mathbord.com", firstName: "Marcus", lastName: "Johnson",
      phone: "+1-212-555-0147", status: "active", country: "US",
      subjects: ["Algebra I", "Geometry", "Pre-Calculus"],
      levels: ["High School"],
      hourlyRate: 60, payRate: 44,
      city: "New York", province: "NY",
      degree: "M.Ed. Mathematics Education, Columbia University",
      bio: "NYC-based math educator with 5 years of experience in Common Core aligned instruction.",
      rating: 4.7, totalHours: 45,
    },
    {
      userId: "u-t9", tutorId: "t9",
      email: "jennifer@mathbord.com", firstName: "Jennifer", lastName: "Martinez",
      phone: "+1-415-555-0198", status: "active", country: "US",
      subjects: ["GMAT Quant", "MBA Admissions"],
      levels: ["MBA Prep"],
      hourlyRate: 85, payRate: 62,
      city: "San Francisco", province: "CA",
      degree: "MBA, Stanford GSB; BS Mathematics, UC Berkeley",
      bio: "Former McKinsey consultant and Stanford MBA. Helps candidates with GMAT Quant prep and MBA admissions strategy.",
      rating: 4.9, totalHours: 30,
    },
  ];

  for (const t of tutorSeeds) {
    const user = await prisma.user.create({
      data: {
        id: t.userId,
        email: t.email,
        passwordHash,
        role: "tutor",
        firstName: t.firstName,
        lastName: t.lastName,
        phone: t.phone,
        country: t.country,
        status: t.status,
      },
    });
    await prisma.tutor.create({
      data: {
        id: t.tutorId,
        userId: user.id,
        subjects: JSON.stringify(t.subjects),
        levels: JSON.stringify(t.levels),
        hourlyRate: t.hourlyRate,
        payRate: t.payRate,
        country: t.country,
        city: t.city,
        province: t.province,
        degree: t.degree,
        bio: t.bio,
        rating: t.rating,
        totalHours: t.totalHours,
      },
    });
    console.log("  ✓ Tutor:", t.firstName, t.lastName);
  }

  // ─── Invites (must exist before clients that reference them) ─────────────
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const inviteSeeds = [
    { id: "inv1", email: "parks@email.com", name: "David & Lin Park", token: "inv-token-park-2025", status: "accepted", sentAt: new Date("2025-09-01"), acceptedAt: new Date("2025-09-03"), expiresAt: new Date("2025-09-08") },
    { id: "inv2", email: "rachel.m@email.com", name: "Rachel Morrison", token: "inv-token-morrison-2025", status: "accepted", sentAt: new Date("2025-06-15"), acceptedAt: new Date("2025-06-16"), expiresAt: new Date("2025-06-22") },
    { id: "inv3", email: "hassan.family@email.com", name: "Ahmad & Fatima Hassan", token: "inv-token-hassan-2025", status: "accepted", sentAt: new Date("2025-10-20"), acceptedAt: new Date("2025-10-22"), expiresAt: new Date("2025-10-27") },
    { id: "inv4", email: "j.liu@email.com", name: "Jennifer Liu", token: "inv-token-liu-2026", status: "pending", sentAt: new Date("2026-01-18"), acceptedAt: null, expiresAt: sevenDays },
    { id: "inv5", email: "new.prospect@email.com", name: "New Prospect", token: "inv-token-prospect-2026", status: "pending", sentAt: new Date("2026-02-28"), acceptedAt: null, expiresAt: sevenDays },
    { id: "inv6", email: "taylors@email.co.uk", name: "James & Sarah Taylor", token: "inv-token-taylor-2025", status: "accepted", sentAt: new Date("2025-12-01"), acceptedAt: new Date("2025-12-03"), expiresAt: new Date("2025-12-08") },
    { id: "inv7", email: "r.williams@email.com", name: "Robert Williams", token: "inv-token-williams-2026", status: "accepted", sentAt: new Date("2026-01-05"), acceptedAt: new Date("2026-01-07"), expiresAt: new Date("2026-01-12") },
  ];

  for (const inv of inviteSeeds) {
    await prisma.invite.create({ data: inv });
  }
  console.log("  ✓ Invites:", inviteSeeds.length);

  // ─── Client users + profiles ──────────────────────────────────────────────
  const clientSeeds = [
    { userId: "u-c1", clientId: "c1", email: "parks@email.com", firstName: "David & Lin", lastName: "Park", phone: "604-555-2001", country: "CA", balance: 0, clientSince: new Date("2025-09-01"), inviteId: "inv1" },
    { userId: "u-c2", clientId: "c2", email: "rachel.m@email.com", firstName: "Rachel", lastName: "Morrison", phone: "416-555-2002", country: "CA", balance: 125, clientSince: new Date("2025-07-01"), inviteId: "inv2" },
    { userId: "u-c3", clientId: "c3", email: "hassan.family@email.com", firstName: "Ahmad & Fatima", lastName: "Hassan", phone: "604-555-2003", country: "CA", balance: 0, clientSince: new Date("2025-11-01"), inviteId: "inv3" },
    { userId: "u-c4", clientId: "c4", email: "j.liu@email.com", firstName: "Jennifer", lastName: "Liu", phone: "778-555-2004", country: "CA", balance: 0, clientSince: new Date("2026-01-01"), inviteId: null },
    { userId: "u-c5", clientId: "c5", email: "taylors@email.co.uk", firstName: "James & Sarah", lastName: "Taylor", phone: "+44-20-7946-0234", country: "UK", balance: 0, clientSince: new Date("2025-12-01"), inviteId: "inv6" },
    { userId: "u-c6", clientId: "c6", email: "r.williams@email.com", firstName: "Robert", lastName: "Williams", phone: "+1-212-555-0321", country: "US", balance: 0, clientSince: new Date("2026-01-01"), inviteId: "inv7" },
  ];

  for (const c of clientSeeds) {
    const user = await prisma.user.create({
      data: {
        id: c.userId,
        email: c.email,
        passwordHash,
        role: "client",
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        country: c.country,
        status: "active",
      },
    });
    await prisma.client.create({
      data: {
        id: c.clientId,
        userId: user.id,
        country: c.country,
        balance: c.balance,
        clientSince: c.clientSince,
        inviteId: c.inviteId,
      },
    });
    console.log("  ✓ Client:", c.firstName, c.lastName);
  }

  // ─── Student records ──────────────────────────────────────────────────────
  const studentSeeds = [
    { id: "s1", userId: "u-s1", email: "amara.park@email.com",   firstName: "Amara",  lastName: "Park",     grade: "Grade 10",   curriculum: "Ontario",         goals: "Improve to 80%+",   clientId: "c1", tutorId: "t2", status: "active",  startDate: new Date("2025-09-15") },
    { id: "s2", userId: "u-s2", email: "ethan.morrison@email.com", firstName: "Ethan",  lastName: "Morrison", grade: "Grade 11",   curriculum: "Ontario",         goals: "University prep",   clientId: "c2", tutorId: "t4", status: "active",  startDate: new Date("2025-10-01") },
    { id: "s3", userId: "u-s3", email: "sophie.morrison@email.com", firstName: "Sophie", lastName: "Morrison", grade: "First Year", curriculum: "UBC Engineering", goals: "Pass Calculus I",   clientId: "c2", tutorId: "t1", status: "active",  startDate: new Date("2025-09-20") },
    { id: "s4", userId: "u-s4", email: "zara.hassan@email.com",   firstName: "Zara",   lastName: "Hassan",   grade: "Grade 12",   curriculum: "BC",              goals: "SAT Math 750+",    clientId: "c3", tutorId: "t3", status: "active",  startDate: new Date("2025-11-05") },
    { id: "s5", userId: "u-s5", email: "lily.liu@email.com",      firstName: "Lily",   lastName: "Liu",      grade: "Grade 8",    curriculum: "BC",              goals: "High school prep", clientId: "c4", tutorId: null,  status: "prospect", startDate: null },
    { id: "s6", userId: "u-s6", email: "george.taylor@email.co.uk", firstName: "George", lastName: "Taylor",  grade: "Year 11",    curriculum: "UK GCSE",         goals: "GCSE Grade 8+",    clientId: "c5", tutorId: "t6", status: "active",  startDate: new Date("2025-12-10") },
    { id: "s7", userId: "u-s7", email: "sofia.williams@email.com",  firstName: "Sofia",  lastName: "Williams", grade: "Grade 10",   curriculum: "US Common Core",  goals: "Pre-Calculus readiness", clientId: "c6", tutorId: "t8", status: "active",  startDate: new Date("2026-01-15") },
  ];

  for (const s of studentSeeds) {
    await prisma.user.create({
      data: {
        id: s.userId,
        email: s.email,
        passwordHash,
        role: "student",
        firstName: s.firstName,
        lastName: s.lastName,
        status: "active",
      },
    });
    await prisma.student.create({
      data: {
        id: s.id,
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        grade: s.grade,
        curriculum: s.curriculum,
        goals: s.goals,
        clientId: s.clientId,
        tutorId: s.tutorId,
        status: s.status,
        startDate: s.startDate,
      },
    });
    console.log("  ✓ Student:", s.firstName, s.lastName, `(${s.email})`);
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  const jobSeeds = [
    { id: "j1", title: "Grade 10 Math Recovery", subject: "Functions & Trig", studentId: "s1", clientId: "c1", tutorId: "t2", rate: 55, status: "active", createdAt: new Date("2025-09-15") },
    { id: "j2", title: "IB Math AA HL Support", subject: "IB Math AA", studentId: "s2", clientId: "c2", tutorId: "t4", rate: 60, status: "active", createdAt: new Date("2025-10-01") },
    { id: "j3", title: "Calculus I Rescue", subject: "Calculus I", studentId: "s3", clientId: "c2", tutorId: "t1", rate: 65, status: "active", createdAt: new Date("2025-09-20") },
    { id: "j4", title: "SAT Math Target 750", subject: "SAT Math", studentId: "s4", clientId: "c3", tutorId: "t3", rate: 70, status: "active", createdAt: new Date("2025-11-05") },
    { id: "j5", title: "Grade 8 Foundations", subject: "Pre-Algebra", studentId: "s5", clientId: "c4", tutorId: null, rate: 45, status: "enquiry", createdAt: new Date("2026-01-20") },
    { id: "j6", title: "GCSE Maths Higher", subject: "GCSE Maths (Higher)", studentId: "s6", clientId: "c5", tutorId: "t6", rate: 55, status: "active", createdAt: new Date("2025-12-10") },
    { id: "j7", title: "Algebra & Geometry", subject: "Common Core Algebra", studentId: "s7", clientId: "c6", tutorId: "t8", rate: 60, status: "active", createdAt: new Date("2026-01-15") },
  ];

  for (const j of jobSeeds) {
    await prisma.job.create({ data: j });
  }
  console.log("  ✓ Jobs:", jobSeeds.length);

  // ─── Curriculum topics ────────────────────────────────────────────────────
  const curriculumData: Record<string, string[]> = {
    j1: ["Linear Relations", "Statistics & Probability", "Quadratic Functions", "Trigonometry", "Analytic Geometry"],
    j2: ["Vectors", "Sequences & Series", "Integration", "Differential Equations", "Complex Numbers"],
    j3: ["Limits & Continuity", "Differentiation", "Integration", "Series & Sequences", "Applications"],
    j4: ["Heart of Algebra", "Problem Solving & Data", "Passport to Advanced Math", "Additional Topics"],
    j5: ["Number Sense", "Fractions & Decimals", "Ratios & Proportions", "Pre-Algebra", "Geometry Basics"],
    j6: ["GCSE Algebra (Higher)", "GCSE Geometry (Circle Theorems)", "GCSE Trigonometry", "GCSE Probability", "GCSE Statistics (Histograms)"],
    j7: ["Linear Equations", "Systems of Equations", "Quadratic Functions", "Geometric Proofs", "Coordinate Geometry"],
  };

  for (const [jobId, topics] of Object.entries(curriculumData)) {
    for (let i = 0; i < topics.length; i++) {
      await prisma.curriculumTopic.create({
        data: { jobId, topicName: topics[i], displayOrder: i + 1 },
      });
    }
  }
  console.log("  ✓ Curriculum topics");

  // ─── Lessons ──────────────────────────────────────────────────────────────
  const lessonSeeds = [
    { id: "l1", jobId: "j1", date: new Date("2026-02-25"), startTime: new Date("1970-01-01T16:00:00.000Z"), duration: 60, tutorId: "t2", studentId: "s1", status: "completed", report: "Reviewed quadratic formula. Amara showed strong improvement on factoring." },
    { id: "l2", jobId: "j3", date: new Date("2026-02-25"), startTime: new Date("1970-01-01T17:00:00.000Z"), duration: 90, tutorId: "t1", studentId: "s3", status: "completed", report: "Limits and continuity. Sophie needs more practice with epsilon-delta." },
    { id: "l3", jobId: "j2", date: new Date("2026-02-26"), startTime: new Date("1970-01-01T15:30:00.000Z"), duration: 60, tutorId: "t4", studentId: "s2", status: "completed", report: "Worked through integration by parts. Ethan is progressing well." },
    { id: "l4", jobId: "j4", date: new Date("2026-02-26"), startTime: new Date("1970-01-01T18:00:00.000Z"), duration: 90, tutorId: "t3", studentId: "s4", status: "completed", report: "Practice test #4 completed. Score improved to 710 from 680." },
    { id: "l5", jobId: "j1", date: new Date("2026-02-27"), startTime: new Date("1970-01-01T16:00:00.000Z"), duration: 60, tutorId: "t2", studentId: "s1", status: "scheduled", report: null },
    { id: "l6", jobId: "j3", date: new Date("2026-02-27"), startTime: new Date("1970-01-01T17:30:00.000Z"), duration: 90, tutorId: "t1", studentId: "s3", status: "scheduled", report: null },
    { id: "l7", jobId: "j2", date: new Date("2026-03-03"), startTime: new Date("1970-01-01T15:30:00.000Z"), duration: 60, tutorId: "t4", studentId: "s2", status: "scheduled", report: null },
    { id: "l8", jobId: "j4", date: new Date("2026-03-04"), startTime: new Date("1970-01-01T18:00:00.000Z"), duration: 90, tutorId: "t3", studentId: "s4", status: "scheduled", report: null },
    { id: "l9", jobId: "j1", date: new Date("2026-03-05"), startTime: new Date("1970-01-01T16:00:00.000Z"), duration: 60, tutorId: "t2", studentId: "s1", status: "scheduled", report: null },
    { id: "l10", jobId: "j3", date: new Date("2026-03-06"), startTime: new Date("1970-01-01T17:00:00.000Z"), duration: 90, tutorId: "t1", studentId: "s3", status: "scheduled", report: null },
  ];

  for (const l of lessonSeeds) {
    await prisma.lesson.create({
      data: {
        id: l.id,
        jobId: l.jobId,
        tutorId: l.tutorId,
        studentId: l.studentId,
        date: l.date,
        startTime: l.startTime,
        durationMinutes: l.duration,
        status: l.status,
        report: l.report,
        createdById: adminUser.id,
      },
    });
  }
  console.log("  ✓ Lessons:", lessonSeeds.length);

  // ─── Assessments ──────────────────────────────────────────────────────────
  const assessmentSeeds = [
    // Amara Park (s1) - Grade 10 Ontario - tutor t2
    { id: "a1", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Linear Relations", type: "quiz", score: 82, maxScore: 100, date: new Date("2025-10-10"), notes: "Strong grasp of slope-intercept form." },
    { id: "a2", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Linear Relations", type: "assignment", score: 88, maxScore: 100, date: new Date("2025-11-05"), notes: "Solved all word problems correctly." },
    { id: "a3", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Statistics & Probability", type: "quiz", score: 75, maxScore: 100, date: new Date("2025-11-20"), notes: "Good on mean/median, needs work on standard deviation." },
    { id: "a4", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Statistics & Probability", type: "test", score: 84, maxScore: 100, date: new Date("2025-12-12"), notes: "Big improvement on probability questions." },
    { id: "a5", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Quadratic Functions", type: "quiz", score: 55, maxScore: 100, date: new Date("2026-01-15"), notes: "Struggling with factoring trinomials." },
    { id: "a6", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Quadratic Functions", type: "assignment", score: 68, maxScore: 100, date: new Date("2026-02-05"), notes: "Improving on vertex form, still shaky on completing the square." },
    { id: "a7", studentId: "s1", jobId: "j1", tutorId: "t2", topic: "Trigonometry", type: "diagnostic", score: 32, maxScore: 100, date: new Date("2026-02-20"), notes: "First exposure. Needs foundational work on SOHCAHTOA." },
    // Sophie Morrison (s3) - Calculus I - tutor t1
    { id: "a8", studentId: "s3", jobId: "j3", tutorId: "t1", topic: "Limits & Continuity", type: "quiz", score: 52, maxScore: 100, date: new Date("2025-10-15"), notes: "Needs more practice with epsilon-delta proofs." },
    { id: "a9", studentId: "s3", jobId: "j3", tutorId: "t1", topic: "Limits & Continuity", type: "test", score: 61, maxScore: 100, date: new Date("2025-11-10"), notes: "Improved on limit laws but still weak on squeeze theorem." },
    { id: "a10", studentId: "s3", jobId: "j3", tutorId: "t1", topic: "Differentiation", type: "quiz", score: 48, maxScore: 100, date: new Date("2025-12-01"), notes: "Chain rule and product rule need drilling." },
    { id: "a11", studentId: "s3", jobId: "j3", tutorId: "t1", topic: "Differentiation", type: "assignment", score: 63, maxScore: 100, date: new Date("2026-01-20"), notes: "Better on power rule and basic derivatives." },
    { id: "a12", studentId: "s3", jobId: "j3", tutorId: "t1", topic: "Integration", type: "diagnostic", score: 28, maxScore: 100, date: new Date("2026-02-15"), notes: "Barely started. We need to build up from anti-derivatives." },
    // Ethan Morrison (s2) - IB Math AA - tutor t4
    { id: "a13", studentId: "s2", jobId: "j2", tutorId: "t4", topic: "Vectors", type: "test", score: 85, maxScore: 100, date: new Date("2025-11-15"), notes: "Excellent spatial reasoning." },
    { id: "a14", studentId: "s2", jobId: "j2", tutorId: "t4", topic: "Sequences & Series", type: "quiz", score: 78, maxScore: 100, date: new Date("2025-12-10"), notes: "Solid on arithmetic, building geometric." },
    { id: "a15", studentId: "s2", jobId: "j2", tutorId: "t4", topic: "Sequences & Series", type: "test", score: 82, maxScore: 100, date: new Date("2026-01-20"), notes: "Good improvement on convergence tests." },
    { id: "a16", studentId: "s2", jobId: "j2", tutorId: "t4", topic: "Integration", type: "quiz", score: 60, maxScore: 100, date: new Date("2026-02-10"), notes: "Integration by parts is tricky. Needs more practice." },
    { id: "a17", studentId: "s2", jobId: "j2", tutorId: "t4", topic: "Differential Equations", type: "diagnostic", score: 35, maxScore: 100, date: new Date("2026-02-25"), notes: "First introduction. Separable equations only." },
    // Zara Hassan (s4) - SAT Math - tutor t3
    { id: "a18", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Heart of Algebra", type: "practice_test", score: 190, maxScore: 200, date: new Date("2025-12-01"), notes: "Very strong. Minor errors on systems of equations." },
    { id: "a19", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Problem Solving & Data", type: "practice_test", score: 165, maxScore: 200, date: new Date("2025-12-15"), notes: "Needs work on scatterplot interpretation." },
    { id: "a20", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Problem Solving & Data", type: "practice_test", score: 178, maxScore: 200, date: new Date("2026-01-20"), notes: "Significant improvement on data analysis." },
    { id: "a21", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Passport to Advanced Math", type: "practice_test", score: 155, maxScore: 200, date: new Date("2026-02-01"), notes: "Polynomial long division and rational expressions need work." },
    { id: "a22", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Passport to Advanced Math", type: "practice_test", score: 170, maxScore: 200, date: new Date("2026-02-20"), notes: "Good progress. Focus on non-linear systems next." },
    { id: "a23", studentId: "s4", jobId: "j4", tutorId: "t3", topic: "Additional Topics", type: "quiz", score: 42, maxScore: 50, date: new Date("2026-02-25"), notes: "Geometry and trig are solid." },
  ];

  for (const a of assessmentSeeds) {
    await prisma.assessment.create({ data: a });
  }
  console.log("  ✓ Assessments:", assessmentSeeds.length);

  // ─── Invoices ─────────────────────────────────────────────────────────────
  const invoiceSeeds = [
    {
      id: "inv-1",
      clientId: "c1",
      amount: 220,
      status: "paid",
      issuedDate: new Date("2025-10-01"),
      dueDate: new Date("2025-10-15"),
      paidAt: new Date("2025-10-10"),
      lineItems: [{ description: "4x 1hr Lessons — Grade 10 Math (Oct)", amount: 220 }],
    },
    {
      id: "inv-2",
      clientId: "c2",
      amount: 507.50,
      status: "paid",
      issuedDate: new Date("2025-11-01"),
      dueDate: new Date("2025-11-15"),
      paidAt: new Date("2025-11-08"),
      lineItems: [
        { description: "4x 1hr Lessons — IB Math AA (Nov)", amount: 240 },
        { description: "4x 1.5hr Lessons — Calculus I (Nov)", amount: 267.50 },
      ],
    },
    {
      id: "inv-3",
      clientId: "c3",
      amount: 280,
      status: "sent",
      issuedDate: new Date("2026-02-01"),
      dueDate: new Date("2026-02-15"),
      paidAt: null,
      lineItems: [{ description: "4x 1hr Lessons — SAT Math (Feb)", amount: 280 }],
    },
    {
      id: "inv-4",
      clientId: "c1",
      amount: 220,
      status: "draft",
      issuedDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-15"),
      paidAt: null,
      lineItems: [{ description: "4x 1hr Lessons — Grade 10 Math (Mar)", amount: 220 }],
    },
  ];

  for (const inv of invoiceSeeds) {
    await prisma.invoice.create({
      data: {
        id: inv.id,
        clientId: inv.clientId,
        amount: inv.amount,
        status: inv.status,
        issuedDate: inv.issuedDate,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        lineItems: {
          create: inv.lineItems,
        },
      },
    });
  }
  console.log("  ✓ Invoices:", invoiceSeeds.length);

  // ─── Tutor applications ───────────────────────────────────────────────────
  const applicationSeeds = [
    { name: "Emily Torres", email: "emily@email.com", phone: "514-555-1005", country: "CA", city: "Montreal, QC", degree: "B.Sc. Mathematics, McGill University", subjects: ["Grade 7-10 Math", "High School Functions"], experience: "3-5 years", approach: "I focus on building conceptual understanding before drilling procedures. I use visual models and real-world examples to make abstract concepts click.", source: "LinkedIn", status: "interview", appliedAt: new Date("2026-02-20") },
    { name: "Daniel Kim", email: "d.kim@email.com", phone: "604-555-3001", country: "CA", city: "Vancouver, BC", degree: "M.Sc. Applied Mathematics, UBC", subjects: ["University Calculus", "Linear Algebra", "Statistics / Probability"], experience: "5+ years", approach: "Former TA at UBC. I specialize in helping struggling university students pass their courses with structured review sessions and practice tests.", source: "Google Search", status: "pending", appliedAt: new Date("2026-02-25") },
    { name: "Aisha Mohammed", email: "aisha.m@email.com", phone: "416-555-3002", country: "CA", city: "Toronto, ON", degree: "B.Ed. & B.Sc. Mathematics, University of Toronto", subjects: ["High School Functions", "High School Calculus", "IB Math (AA / AI)"], experience: "5+ years", approach: "Certified Ontario teacher with 6 years of classroom experience. I bring structured lesson plans and formative assessment to every session.", source: "Referral from a friend", status: "pending", appliedAt: new Date("2026-02-26") },
    { name: "Ryan Fletcher", email: "ryan.f@email.com", phone: "250-555-3003", country: "CA", city: "Victoria, BC", degree: "B.Eng. Mechanical Engineering, UVic", subjects: ["SAT / PSAT Math", "AP Calculus (AB / BC)"], experience: "1-2 years", approach: "I scored 800 on the SAT Math and 5 on AP Calc BC. I help students master test strategy alongside content.", source: "University job board", status: "pending", appliedAt: new Date("2026-02-27") },
    { name: "Lisa Wang", email: "l.wang@email.com", phone: "778-555-3004", country: "CA", city: "Burnaby, BC", degree: "B.Sc. Actuarial Science, SFU", subjects: ["High School Functions", "Statistics / Probability", "GRE / GMAT Quant"], experience: "3-5 years", approach: "I combine actuarial problem-solving skills with patience for foundational math. My students consistently exceed their target scores.", source: "LinkedIn", status: "rejected", appliedAt: new Date("2026-02-15") },
    { name: "Hannah Clarke", email: "h.clarke@email.co.uk", phone: "+44-7700-900123", country: "UK", city: "London, UK", degree: "MMath Mathematics, University of Warwick", subjects: ["UK GCSE Maths", "UK A-Level Maths", "UK Further Maths"], experience: "3-5 years", approach: "Former head of maths at a London secondary school. I specialize in GCSE and A-Level exam technique across all exam boards — AQA, Edexcel, and OCR.", source: "LinkedIn", status: "pending", appliedAt: new Date("2026-03-01") },
    { name: "David Chen", email: "d.chen.tutor@email.com", phone: "+1-617-555-0142", country: "US", city: "Boston, MA", degree: "M.S. Mathematics Education, Boston University", subjects: ["US Common Core (K-8)", "US Algebra / Geometry", "GMAT Quant", "MBA Admissions Advisory"], experience: "5+ years", approach: "Former math department chair with 8 years of teaching experience. I also coach GMAT candidates and provide MBA admissions consulting for Harvard, MIT Sloan, and Wharton applicants.", source: "Google Search", status: "pending", appliedAt: new Date("2026-03-02") },
  ];

  for (const app of applicationSeeds) {
    await prisma.application.create({
      data: { ...app, subjects: JSON.stringify(app.subjects) },
    });
  }
  console.log("  ✓ Applications:", applicationSeeds.length);

  console.log("\n✅  Seed complete! Log in with any seed email + password: mathbord2026");
  console.log("    Admin:   admin@mathbord.com");
  console.log("    Tutor:   sarah@mathbord.com  (or james, priya, michael, emily, oliver, charlotte, marcus, jennifer)");
  console.log("    Client:  parks@email.com  (or rachel.m, hassan.family, j.liu, taylors@email.co.uk, r.williams)");
  console.log("    Student: amara.park@email.com  (or ethan.morrison, sophie.morrison, zara.hassan, lily.liu, george.taylor, sofia.williams)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

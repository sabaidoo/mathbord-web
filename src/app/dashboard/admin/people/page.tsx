import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtMoney, initials, parseArr } from "@/lib/utils";
import { ApplicationActions } from "./application-actions";
import { InviteButton } from "./invite-button";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const tab = searchParams.tab ?? "clients";

  const [clients, students, tutors, applications, invites] = await Promise.all([
    prisma.client.findMany({
      include: {
        user: true,
        students: true,
        invoices: { where: { status: { in: ["sent", "overdue"] } } },
      },
      orderBy: { clientSince: "desc" },
    }),
    prisma.student.findMany({
      include: {
        client: { include: { user: true } },
        tutor: { include: { user: true } },
      },
      orderBy: { startDate: "desc" },
    }),
    prisma.tutor.findMany({
      include: { user: true },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.application.findMany({ orderBy: { appliedAt: "desc" } }),
    prisma.invite.findMany({ orderBy: { sentAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">People</h1>
      <p className="text-sm text-gray-500 mb-6">Manage clients, students, tutors, and the application pipeline.</p>

      {/* Tab Bar */}
      <div className="flex border-b-2 border-gray-200 mb-6 gap-0">
        {[
          { key: "clients", label: `Clients (${clients.length})` },
          { key: "students", label: `Students (${students.length})` },
          { key: "tutors", label: `Tutors (${tutors.length})` },
          { key: "applications", label: `Applications (${applications.filter((a) => a.status === "pending").length} new)` },
          { key: "invites", label: "Invites" },
        ].map(({ key, label }) => (
          <a
            key={key}
            href={`/dashboard/admin/people?tab=${key}`}
            className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
              tab === key
                ? "text-teal border-teal"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* ── Clients ────────────────────────────────────────────────────────── */}
      {tab === "clients" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Client</Th>
                  <Th>Email</Th>
                  <Th>Students</Th>
                  <Th>Balance</Th>
                  <Th>Since</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                          {initials(`${c.user.firstName} ${c.user.lastName}`)}
                        </div>
                        <span className="font-semibold text-navy">{c.user.firstName} {c.user.lastName}</span>
                      </div>
                    </Td>
                    <Td>{c.user.email}</Td>
                    <Td>{c.students.length} student{c.students.length !== 1 ? "s" : ""}</Td>
                    <Td>
                      {Number(c.balance) > 0 ? (
                        <span className="text-green-600 font-semibold">{fmtMoney(Number(c.balance))}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Td>
                    <Td>{fmtDate(c.clientSince)}</Td>
                    <Td><Badge status={c.user.status} /></Td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No clients yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Students ───────────────────────────────────────────────────────── */}
      {tab === "students" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Student</Th>
                  <Th>Grade / Curriculum</Th>
                  <Th>Client</Th>
                  <Th>Tutor</Th>
                  <Th>Started</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td>
                      <span className="font-semibold text-navy">{s.firstName} {s.lastName}</span>
                    </Td>
                    <Td>
                      <span className="text-gray-600">{s.grade}</span>
                      {s.curriculum && <span className="text-gray-400 ml-1">· {s.curriculum}</span>}
                    </Td>
                    <Td>{s.client.user.firstName} {s.client.user.lastName}</Td>
                    <Td>
                      {s.tutor ? (
                        `${s.tutor.user.firstName} ${s.tutor.user.lastName}`
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </Td>
                    <Td>{s.startDate ? fmtDate(s.startDate) : "—"}</Td>
                    <Td><Badge status={s.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tutors ─────────────────────────────────────────────────────────── */}
      {tab === "tutors" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Tutor</Th>
                  <Th>Subjects</Th>
                  <Th>Rate / Pay</Th>
                  <Th>Hours</Th>
                  <Th>Rating</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                          {initials(`${t.user.firstName} ${t.user.lastName}`)}
                        </div>
                        <div>
                          <p className="font-semibold text-navy">{t.user.firstName} {t.user.lastName}</p>
                          <p className="text-xs text-gray-400">{t.city}{t.province ? `, ${t.province}` : ""}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {parseArr(t.subjects).slice(0, 2).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-teal-50 text-teal text-xs font-semibold rounded-full">{s}</span>
                        ))}
                        {parseArr(t.subjects).length > 2 && (
                          <span className="text-xs text-gray-400">+{parseArr(t.subjects).length - 2}</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="font-semibold">{fmtMoney(Number(t.hourlyRate))}/hr</span>
                      <span className="text-gray-400 text-xs ml-1">({fmtMoney(Number(t.payRate))} pay)</span>
                    </Td>
                    <Td>{Number(t.totalHours).toFixed(0)}h</Td>
                    <Td>
                      {Number(t.rating) > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          <span className="font-semibold">{Number(t.rating).toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Td>
                    <Td><Badge status={t.user.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Applications ───────────────────────────────────────────────────── */}
      {tab === "applications" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Applicant</Th>
                  <Th>Subjects</Th>
                  <Th>Experience</Th>
                  <Th>City</Th>
                  <Th>Applied</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td>
                      <p className="font-semibold text-navy">{app.name}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {parseArr(app.subjects).slice(0, 2).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{s}</span>
                        ))}
                        {parseArr(app.subjects).length > 2 && (
                          <span className="text-xs text-gray-400">+{parseArr(app.subjects).length - 2}</span>
                        )}
                      </div>
                    </Td>
                    <Td>{app.experience ?? "—"}</Td>
                    <Td>{app.city ?? "—"}</Td>
                    <Td>{fmtDate(app.appliedAt)}</Td>
                    <Td><Badge status={app.status} /></Td>
                    <Td>
                      <ApplicationActions applicationId={app.id} currentStatus={app.status} />
                    </Td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No applications yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Invites ────────────────────────────────────────────────────────── */}
      {tab === "invites" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-navy">Client Invites</span>
            <InviteButton />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Sent</Th>
                  <Th>Expires</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Td className="font-semibold text-navy">{inv.name}</Td>
                    <Td>{inv.email}</Td>
                    <Td>{fmtDate(inv.sentAt)}</Td>
                    <Td>
                      <span className={inv.expiresAt < new Date() && inv.status === "pending" ? "text-red-500" : ""}>
                        {fmtDate(inv.expiresAt)}
                      </span>
                    </Td>
                    <Td><Badge status={inv.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny table helpers ────────────────────────────────────────────────────────
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-bold uppercase tracking-wide text-gray-400 px-4 py-3">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-sm text-gray-700 ${className ?? ""}`}>{children}</td>;
}

function Badge({ status }: { status: string }) {
  const greenSet = new Set(["active", "paid", "approved", "on-track", "completed", "accepted"]);
  const blueSet = new Set(["scheduled", "sent", "developing", "interview", "pending"]);
  const redSet = new Set(["needs-attention", "overdue", "gap", "cancelled", "rejected", "suspended", "no_show", "expired"]);
  let cls = "bg-gray-100 text-gray-600";
  if (greenSet.has(status)) cls = "bg-green-100 text-green-700";
  else if (blueSet.has(status)) cls = "bg-teal-50 text-teal";
  else if (redSet.has(status)) cls = "bg-accent-light text-accent";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

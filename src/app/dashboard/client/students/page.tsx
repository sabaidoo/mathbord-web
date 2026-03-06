import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ClientStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client") redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });
  if (!client) redirect("/login");

  const students = await prisma.student.findMany({
    where: { clientId: client.id },
    include: {
      tutor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { firstName: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Students</h1>
      <p className="text-sm text-gray-500 mb-8">
        {students.length} student{students.length !== 1 ? "s" : ""} in your account.
      </p>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-4">👨‍👩‍👧</p>
          <p className="text-sm text-gray-400">No students yet. Your admin will set up your account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Curriculum
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="font-semibold text-navy">
                        {s.firstName} {s.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.grade ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{s.curriculum ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.tutor
                      ? `${s.tutor.user.firstName} ${s.tutor.user.lastName}`
                      : <span className="text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    pending: "bg-teal-50 text-teal",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

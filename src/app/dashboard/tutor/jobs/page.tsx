import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/utils";

export default async function TutorJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/login");

  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
  });
  if (!tutor) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: { tutorId: tutor.id },
    include: {
      student: { select: { firstName: true, lastName: true, grade: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Jobs</h1>
      <p className="text-sm text-gray-500 mb-8">
        {jobs.length} job{jobs.length !== 1 ? "s" : ""} assigned to you.
      </p>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-4">📌</p>
          <p className="text-sm text-gray-400">No jobs assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-navy">{job.title}</td>
                  <td className="px-6 py-4 text-gray-600">{job.subject}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {job.student
                      ? `${job.student.firstName} ${job.student.lastName}${job.student.grade ? ` (${job.student.grade})` : ""}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-600">
                    {fmtMoney(Number(job.rate))}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
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
    enquiry: "bg-teal-50 text-teal",
    closed: "bg-gray-100 text-gray-600",
    cancelled: "bg-accent-light text-accent",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

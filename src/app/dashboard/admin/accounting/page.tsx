import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAccountingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const invoices = await prisma.invoice.findMany({
    include: {
      client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      lineItems: true,
    },
    orderBy: { issuedDate: "desc" },
  });

  const stats = {
    totalRevenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0),
    outstanding: invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.amount), 0),
    overdue: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0),
    draft: invoices.filter((i) => i.status === "draft").length,
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Accounting</h1>
      <p className="text-sm text-gray-500 mb-8">Invoices, revenue, and payment tracking.</p>

      {/* Revenue Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={fmtMoney(stats.totalRevenue)} trendUp trend="all time" />
        <StatCard label="Outstanding" value={fmtMoney(stats.outstanding)} trendUp={stats.outstanding === 0} trend={stats.outstanding > 0 ? "awaiting payment" : "✓ All clear"} />
        <StatCard label="Overdue" value={fmtMoney(stats.overdue)} trendUp={stats.overdue === 0} trend={stats.overdue > 0 ? "⚠ Action needed" : "✓ None"} />
        <StatCard label="Draft Invoices" value={stats.draft} trendUp={stats.draft === 0} trend={`${stats.draft} unsent`} />
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-bold text-navy">All Invoices</span>
          <button className="px-4 py-2 bg-teal text-white text-xs font-bold rounded-lg hover:bg-teal-dark transition-colors">
            + New Invoice
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Client</Th>
                <Th>Items</Th>
                <Th>Amount</Th>
                <Th>Issued</Th>
                <Th>Due</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <Td>
                    <p className="font-semibold text-navy">{inv.client.user.firstName} {inv.client.user.lastName}</p>
                    <p className="text-xs text-gray-400">{inv.client.user.email}</p>
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      {inv.lineItems.slice(0, 2).map((li, idx) => (
                        <p key={idx} className="text-xs text-gray-500 truncate max-w-[200px]">{li.description}</p>
                      ))}
                      {inv.lineItems.length > 2 && (
                        <p className="text-xs text-gray-400">+{inv.lineItems.length - 2} more</p>
                      )}
                    </div>
                  </Td>
                  <Td className="font-semibold">{fmtMoney(Number(inv.amount))}</Td>
                  <Td>{fmtDate(inv.issuedDate)}</Td>
                  <Td>
                    <span className={inv.status === "overdue" ? "text-red-600 font-semibold" : ""}>
                      {fmtDate(inv.dueDate)}
                    </span>
                  </Td>
                  <Td><Badge status={inv.status} /></Td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp }: { label: string; value: string | number; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
      {trend && <p className={`text-xs font-semibold mt-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>{trend}</p>}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-bold uppercase tracking-wide text-gray-400 px-4 py-3">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-sm text-gray-700 ${className ?? ""}`}>{children}</td>;
}
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    sent: "bg-teal-50 text-teal",
    overdue: "bg-accent-light text-accent",
    draft: "bg-gray-100 text-gray-600",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

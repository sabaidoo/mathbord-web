import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtMoney, fmtDate } from "@/lib/utils";
import InvoicePayButton from "./pay-button";

export default async function ClientInvoicesPage({
  searchParams,
}: {
  searchParams: { paid?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client") redirect("/login");

  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    include: { lineItems: true },
    orderBy: { issuedDate: "desc" },
  });

  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.amount), 0);

  // Show success banner if redirected back from Stripe
  const justPaid = searchParams.paid;

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Invoices</h1>
      <p className="text-sm text-gray-500 mb-8">Your billing history and outstanding balances.</p>

      {/* Success banner */}
      {justPaid && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Payment received — thank you!</p>
            <p className="text-xs text-green-600 mt-0.5">Your invoice has been marked as paid.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Outstanding" value={fmtMoney(totalOutstanding)} trendUp={totalOutstanding === 0} trend={outstanding.length > 0 ? `${outstanding.length} invoice(s)` : "✓ All paid"} />
        <StatCard label="Total Paid" value={fmtMoney(paid.reduce((s, i) => s + Number(i.amount), 0))} trendUp trend="all time" />
        <StatCard label="Total Invoices" value={invoices.length} />
      </div>

      {/* Outstanding invoices */}
      {outstanding.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-navy mb-3">Action Required</h2>
          <div className="space-y-4">
            {outstanding.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-navy">Invoice #{inv.id.slice(-6).toUpperCase()}</span>
                    <span className={`ml-3 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${inv.status === "overdue" ? "bg-accent-light text-accent" : "bg-teal-50 text-teal"}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display text-xl text-navy">{fmtMoney(Number(inv.amount))}</p>
                      <p className="text-xs text-gray-500">Due {fmtDate(inv.dueDate)}</p>
                    </div>
                    <InvoicePayButton invoiceId={inv.id} amount={Number(inv.amount)} />
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Line Items</p>
                  <div className="space-y-1">
                    {inv.lineItems.map((li) => (
                      <div key={li.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{li.description}</span>
                        <span className="font-semibold text-navy">{fmtMoney(Number(li.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All invoices history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-bold text-navy">Billing History</span>
        </div>
        <div className="divide-y divide-gray-100">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No invoices yet.</div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">
                    Invoice #{inv.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Issued {fmtDate(inv.issuedDate)} · Due {fmtDate(inv.dueDate)}
                    {inv.paidAt && ` · Paid ${fmtDate(inv.paidAt)}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-4">
                  <span className="font-semibold text-navy">{fmtMoney(Number(inv.amount))}</span>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </div>
            ))
          )}
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
      {trend && <p className={`text-xs font-semibold mt-1 ${trendUp ? "text-green-600" : "text-amber-600"}`}>{trend}</p>}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    sent: "bg-teal-50 text-teal",
    overdue: "bg-accent-light text-accent",
    draft: "bg-gray-100 text-gray-600",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

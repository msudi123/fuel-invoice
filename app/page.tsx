import Link from "next/link";
import { db } from "@/lib/db";
import { formatAmount, calcInvoiceTotal } from "@/lib/calculations";
import { Plus, FileText } from "lucide-react";
import NavBar from "@/components/NavBar";

export default async function DashboardPage() {
  const invoices = await db.invoice.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + calcInvoiceTotal(inv.sellingAmount, inv.vatEnabled, inv.vatRate), 0);

  const unpaidCount = invoices.filter((inv) => inv.status === "unpaid").length;
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  const statusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
    if (status === "paid") return `${base} bg-green-100 text-green-700`;
    if (status === "overdue") return `${base} bg-red-100 text-red-700`;
    return `${base} bg-yellow-100 text-yellow-700`;
  };

  return (
    <>
    <NavBar />
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⛽</span> Fuel Invoice Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your fuel reseller invoices</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Paid (KES)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatAmount(totalRevenue, "KES")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Unpaid</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{unpaidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Overdue</p>
          <p className="text-xl font-bold text-red-600 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-700">Invoices ({invoices.length})</span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No invoices yet. Create your first one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Fuel</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Due</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Amount</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const total = calcInvoiceTotal(inv.sellingAmount, inv.vatEnabled, inv.vatRate);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-blue-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{inv.customer.name}</td>
                    <td className="px-5 py-3 text-gray-500">{inv.fuelType} · {inv.quantity} {inv.unit}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString("en-KE")}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString("en-KE")}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatAmount(total, inv.currency)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={statusBadge(inv.status)}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
}

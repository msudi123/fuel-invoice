import { db } from "@/lib/db";
import Link from "next/link";
import { Users, FileText } from "lucide-react";
import NavBar from "@/components/NavBar";
import { calcInvoiceTotal } from "@/lib/calculations";

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    include: {
      _count: { select: { invoices: true } },
      invoices: {
        select: { status: true, sellingAmount: true, vatEnabled: true, vatRate: true, currency: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" /> Customers
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} customer{customers.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No customers yet. They are created automatically when you add an invoice.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">KRA PIN</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Invoices</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Total Billed</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const totalBilled = c.invoices.reduce(
                    (sum, inv) => sum + calcInvoiceTotal(inv.sellingAmount, inv.vatEnabled, inv.vatRate),
                    0
                  );
                  const unpaid = c.invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length;
                  const currency = c.invoices[0]?.currency ?? "USD";
                  const symbol = currency === "KES" ? "KSh" : "USD";
                  const fmt = (n: number) =>
                    `${symbol} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        {c.address && <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {c.email && <p>{c.email}</p>}
                        {c.phone && <p>{c.phone}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-mono text-xs">{c.kraPin || "—"}</td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/?customer=${c.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {c._count.invoices}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-900">
                        {fmt(totalBilled)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {unpaid > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            {unpaid} unpaid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            All paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

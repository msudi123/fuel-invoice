import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatAmount, calcInvoiceTotal, calcVat, fuelLabel } from "@/lib/calculations";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InvoiceActions from "./InvoiceActions";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { customer: true, bankAccount: true },
  });

  if (!invoice) notFound();

  const vat = calcVat(invoice.sellingAmount, invoice.vatEnabled ? invoice.vatRate : 0);
  const total = calcInvoiceTotal(invoice.sellingAmount, invoice.vatEnabled, invoice.vatRate);

  const statusBadge = (status: string) => {
    if (status === "paid") return "bg-green-100 text-green-700";
    if (status === "overdue") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const fmt = (n: number) => formatAmount(n, invoice.currency);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</h1>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(invoice.status)}`}>
          {invoice.status}
        </span>
      </div>

      {/* Actions */}
      <InvoiceActions invoice={{ id: invoice.id, status: invoice.status, customerEmail: invoice.customer.email ?? "" }} />

      {/* Invoice card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-5 space-y-6">
        {/* Header meta */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
            {invoice.customer.kraPin && <p className="text-gray-500">KRA PIN: {invoice.customer.kraPin}</p>}
            {invoice.customer.email && <p className="text-gray-500">{invoice.customer.email}</p>}
            {invoice.customer.phone && <p className="text-gray-500">{invoice.customer.phone}</p>}
            {invoice.customer.address && <p className="text-gray-500">{invoice.customer.address}</p>}
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-gray-400 text-xs mb-0.5">Invoice Date</p>
              <p className="text-gray-700">{new Date(invoice.invoiceDate).toLocaleDateString("en-KE")}</p>
            </div>
            <div className="mb-2">
              <p className="text-gray-400 text-xs mb-0.5">Due Date</p>
              <p className="text-gray-700">{new Date(invoice.dueDate).toLocaleDateString("en-KE")}</p>
            </div>
            {invoice.customerRef && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Customer Ref</p>
                <p className="text-gray-700 font-mono">{invoice.customerRef}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fuel details */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium uppercase">Fuel Type</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium uppercase">Trans. Type</th>
                {invoice.destination && <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium uppercase">Destination</th>}
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium uppercase">Quantity</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">{fuelLabel(invoice.fuelType)}</td>
                <td className="px-4 py-3 text-gray-600">{invoice.transType}</td>
                {invoice.destination && <td className="px-4 py-3 text-gray-600">{invoice.destination}</td>}
                <td className="px-4 py-3 text-right text-gray-700">
                  {invoice.quantity.toLocaleString()} {invoice.unit}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(invoice.sellingAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{fmt(invoice.sellingAmount)}</span>
          </div>
          {invoice.vatEnabled && (
            <div className="flex justify-between text-gray-500">
              <span>VAT ({invoice.vatRate}%)</span>
              <span>{fmt(vat)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total Due</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        {/* Payment info */}
        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment Terms</p>
            <p className="text-gray-700">{invoice.paymentTerms}</p>
          </div>
          {invoice.bankAccount && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bank Account</p>
              <p className="text-gray-700 font-medium">{invoice.bankAccount.bankName}</p>
              <p className="text-gray-500">{invoice.bankAccount.accountName}</p>
              <p className="text-gray-500 font-mono">{invoice.bankAccount.accountNumber}</p>
              {invoice.bankAccount.branch && <p className="text-gray-500">{invoice.bankAccount.branch}</p>}
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Notes</p>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

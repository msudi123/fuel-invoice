"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  currency: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerKraPin, setCustomerKraPin] = useState("");

  // Invoice reference
  const [customerRef, setCustomerRef] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  // Fuel fields
  const [fuelType, setFuelType] = useState("AGO");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("MT");
  const [transType, setTransType] = useState("Local");
  const [destination, setDestination] = useState("");

  // Pricing
  const [currency, setCurrency] = useState("USD");
  const [sellingAmount, setSellingAmount] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("16");

  // Invoice settings
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState("CASH");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBankAccounts(data);
      })
      .catch(() => {});
  }, []);

  const selling = parseFloat(sellingAmount) || 0;
  const vat = vatEnabled ? (selling * (parseFloat(vatRate) || 0)) / 100 : 0;
  const total = selling + vat;
  const purchase = parseFloat(purchaseAmount) || 0;
  const grossProfit = selling - purchase;

  const fmt = (n: number, cur = currency) => {
    const symbol = cur === "KES" ? "KSh" : "USD";
    return `${symbol} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          customerKraPin: customerKraPin || null,
          customerRef: customerRef || null,
          bankAccountId: bankAccountId || null,
          fuelType,
          quantity: parseFloat(quantity),
          unit,
          transType,
          destination: destination || null,
          currency,
          sellingAmount: parseFloat(sellingAmount),
          purchaseAmount: parseFloat(purchaseAmount) || 0,
          vatEnabled,
          vatRate: parseFloat(vatRate) || 16,
          dueDate,
          paymentTerms,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }

      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs text-gray-500 mb-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Fuel Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Customer Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Full Name / Company *</label>
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} placeholder="e.g. Mombasa Transporters Ltd" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} placeholder="customer@example.com" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} placeholder="+254 700 000 000" />
            </div>
            <div>
              <label className={labelCls}>KRA PIN</label>
              <input value={customerKraPin} onChange={(e) => setCustomerKraPin(e.target.value)} className={inputCls} placeholder="A000000000X" />
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className={inputCls} placeholder="Street, City, County" />
            </div>
          </div>
        </section>

        {/* Fuel Details */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Fuel Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fuel Type *</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={inputCls}>
                <option value="AGO">AGO (Automotive Gas Oil / Diesel)</option>
                <option value="PMS">PMS (Premium Motor Spirit / Petrol)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Transaction Type *</label>
              <select value={transType} onChange={(e) => setTransType(e.target.value)} className={inputCls}>
                <option value="Local">Local</option>
                <option value="Transit">Transit</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantity *</label>
              <input required type="number" step="0.001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} placeholder="0.000" />
            </div>
            <div>
              <label className={labelCls}>Unit *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
                <option value="MT">MT (Metric Tonnes)</option>
                <option value="CBM">CBM (Cubic Metres)</option>
                <option value="Litres">Litres</option>
              </select>
            </div>
            {transType === "Transit" && (
              <div className="col-span-2">
                <label className={labelCls}>Destination</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputCls}>
                  <option value="">— Select —</option>
                  <option value="COMGO">COMGO</option>
                  <option value="Sudan">Sudan</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Burundi">Burundi</option>
                  <option value="DRC">DRC</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Currency *</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Selling Amount (customer sees) *</label>
              <input required type="number" step="0.01" min="0" value={sellingAmount} onChange={(e) => setSellingAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Purchase Cost (internal)</label>
              <input type="number" step="0.01" min="0" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="w-4 h-4 rounded" />
                VAT Applicable
              </label>
              {vatEnabled && (
                <div className="flex-1">
                  <label className={labelCls}>VAT Rate (%)</label>
                  <input type="number" step="0.1" min="0" max="100" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </div>

          {/* Totals preview */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Selling Amount</span>
              <span>{fmt(selling)}</span>
            </div>
            {vatEnabled && (
              <div className="flex justify-between text-gray-500">
                <span>VAT ({vatRate}%)</span>
                <span>{fmt(vat)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-100">
              <span>Invoice Total</span>
              <span>{fmt(total)}</span>
            </div>
            {purchaseAmount && (
              <div className={`flex justify-between text-xs mt-1 ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                <span>Gross Profit</span>
                <span>{fmt(grossProfit)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Invoice Settings */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Invoice Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Due Date *</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Payment Terms</label>
              <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputCls}>
                <option value="CASH">Cash</option>
                <option value="NET7">Net 7</option>
                <option value="NET14">Net 14</option>
                <option value="NET30">Net 30</option>
                <option value="NET60">Net 60</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Customer LPO / Reference #</label>
              <input value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} className={inputCls} placeholder="LPO-12345" />
            </div>
            <div>
              <label className={labelCls}>Bank Account</label>
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {bankAccounts.map((ba) => (
                  <option key={ba.id} value={ba.id}>
                    {ba.bankName} — {ba.accountName} ({ba.currency})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="Payment instructions, delivery details, etc." />
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Link href="/" className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

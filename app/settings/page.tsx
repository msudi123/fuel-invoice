"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Save, Plus, Trash2, Loader2, CheckCircle, Star } from "lucide-react";

interface Settings {
  companyName: string;
  companyTagline: string;
  physicalAddress: string;
  postalAddress: string;
  phone: string;
  email: string;
  website: string;
  kraPin: string;
  vatPin: string;
  epraLicense: string;
  logoUrl: string;
  vatEnabled: boolean;
  vatRate: number;
  paymentTerms: string;
  invoicePrefix: string;
  defaultCurrency: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
  currency: string;
  isDefault: boolean;
}

const emptyBank = (): Omit<BankAccount, "id" | "isDefault"> => ({
  bankName: "",
  accountName: "",
  accountNumber: "",
  branch: "",
  swiftCode: "",
  currency: "KES",
});

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    companyTagline: "",
    physicalAddress: "",
    postalAddress: "",
    phone: "",
    email: "",
    website: "",
    kraPin: "",
    vatPin: "",
    epraLicense: "",
    logoUrl: "",
    vatEnabled: false,
    vatRate: 16,
    paymentTerms: "CASH",
    invoicePrefix: "LL",
    defaultCurrency: "USD",
  });
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // new bank form
  const [showBankForm, setShowBankForm] = useState(false);
  const [newBank, setNewBank] = useState(emptyBank());
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d && !d.error) setSettings((prev) => ({ ...prev, ...d, logoUrl: d.logoUrl ?? "" }));
    });
    fetch("/api/bank-accounts").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setBanks(d);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addBank = async () => {
    if (!newBank.bankName || !newBank.accountName || !newBank.accountNumber) return;
    setSavingBank(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBank, isDefault: banks.length === 0 }),
      });
      const data = await res.json();
      setBanks((prev) => [...prev, data]);
      setNewBank(emptyBank());
      setShowBankForm(false);
    } finally {
      setSavingBank(false);
    }
  };

  const deleteBank = async (id: string) => {
    await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
    setBanks((prev) => prev.filter((b) => b.id !== id));
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setBanks((prev) => prev.map((b) => ({ ...b, isDefault: b.id === id })));
  };

  const set = (field: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings((prev) => ({ ...prev, [field]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <>
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Company details, billing defaults, and bank accounts</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Company */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">Company Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Company Name</label>
                <input value={settings.companyName} onChange={set("companyName")} className={inputCls} placeholder="Likoni Logistics Ltd" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tagline</label>
                <input value={settings.companyTagline} onChange={set("companyTagline")} className={inputCls} placeholder="Fuel Reseller & Transport Solutions" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Physical Address</label>
                <input value={settings.physicalAddress} onChange={set("physicalAddress")} className={inputCls} placeholder="123 Mombasa Road, Nairobi" />
              </div>
              <div>
                <label className={labelCls}>Postal Address</label>
                <input value={settings.postalAddress} onChange={set("postalAddress")} className={inputCls} placeholder="P.O. Box 1234-80100, Mombasa" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={settings.phone} onChange={set("phone")} className={inputCls} placeholder="+254 700 000 000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={settings.email} onChange={set("email")} className={inputCls} placeholder="info@likonil.co.ke" />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input value={settings.website} onChange={set("website")} className={inputCls} placeholder="www.likonil.co.ke" />
              </div>
              <div>
                <label className={labelCls}>Logo URL (optional)</label>
                <input value={settings.logoUrl} onChange={set("logoUrl")} className={inputCls} placeholder="https://..." />
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">Tax & Compliance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>KRA PIN</label>
                <input value={settings.kraPin} onChange={set("kraPin")} className={inputCls} placeholder="A000000000X" />
              </div>
              <div>
                <label className={labelCls}>VAT PIN</label>
                <input value={settings.vatPin} onChange={set("vatPin")} className={inputCls} placeholder="VAT/001/12345" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>EPRA License Number</label>
                <input value={settings.epraLicense} onChange={set("epraLicense")} className={inputCls} placeholder="EPRA/PL/12345" />
              </div>
            </div>
          </section>

          {/* Invoice defaults */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">Invoice Defaults</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Invoice Prefix</label>
                <input value={settings.invoicePrefix} onChange={set("invoicePrefix")} className={inputCls} placeholder="LL" />
              </div>
              <div>
                <label className={labelCls}>Default Currency</label>
                <select value={settings.defaultCurrency} onChange={set("defaultCurrency")} className={inputCls}>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Default Payment Terms</label>
                <select value={settings.paymentTerms} onChange={set("paymentTerms")} className={inputCls}>
                  <option value="CASH">Cash</option>
                  <option value="NET7">Net 7</option>
                  <option value="NET14">Net 14</option>
                  <option value="NET30">Net 30</option>
                  <option value="NET60">Net 60</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.vatEnabled}
                    onChange={set("vatEnabled")}
                    className="w-4 h-4 rounded"
                  />
                  VAT Enabled by default
                </label>
                {settings.vatEnabled && (
                  <div className="mt-2">
                    <label className={labelCls}>VAT Rate (%)</label>
                    <input
                      type="number"
                      value={settings.vatRate}
                      onChange={(e) => setSettings((prev) => ({ ...prev, vatRate: parseFloat(e.target.value) || 16 }))}
                      className={inputCls}
                      min="0" max="100" step="0.1"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Bank Accounts */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bank Accounts</h2>
            <button
              onClick={() => setShowBankForm(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Account
            </button>
          </div>

          {banks.length === 0 && !showBankForm && (
            <p className="text-sm text-gray-400 text-center py-6">No bank accounts yet. Add one to include payment details on invoices.</p>
          )}

          <div className="space-y-3">
            {banks.map((b) => (
              <div key={b.id} className="flex items-start justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{b.bankName}</p>
                    {b.isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">{b.currency}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{b.accountName}</p>
                  <p className="text-sm font-mono text-gray-500">{b.accountNumber}</p>
                  {b.branch && <p className="text-xs text-gray-400 mt-0.5">{b.branch}</p>}
                  {b.swiftCode && <p className="text-xs text-gray-400">SWIFT: {b.swiftCode}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!b.isDefault && (
                    <button onClick={() => setDefault(b.id)} className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      Set default
                    </button>
                  )}
                  <button onClick={() => deleteBank(b.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showBankForm && (
            <div className="mt-4 p-4 rounded-lg border border-blue-100 bg-blue-50 space-y-3">
              <p className="text-sm font-medium text-gray-700">New Bank Account</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Bank Name *</label>
                  <input value={newBank.bankName} onChange={(e) => setNewBank((p) => ({ ...p, bankName: e.target.value }))} className={inputCls} placeholder="Equity Bank" />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={newBank.currency} onChange={(e) => setNewBank((p) => ({ ...p, currency: e.target.value }))} className={inputCls}>
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Account Name *</label>
                  <input value={newBank.accountName} onChange={(e) => setNewBank((p) => ({ ...p, accountName: e.target.value }))} className={inputCls} placeholder="Likoni Logistics Ltd" />
                </div>
                <div>
                  <label className={labelCls}>Account Number *</label>
                  <input value={newBank.accountNumber} onChange={(e) => setNewBank((p) => ({ ...p, accountNumber: e.target.value }))} className={inputCls} placeholder="0123456789" />
                </div>
                <div>
                  <label className={labelCls}>Branch</label>
                  <input value={newBank.branch} onChange={(e) => setNewBank((p) => ({ ...p, branch: e.target.value }))} className={inputCls} placeholder="Mombasa Branch" />
                </div>
                <div>
                  <label className={labelCls}>SWIFT Code</label>
                  <input value={newBank.swiftCode} onChange={(e) => setNewBank((p) => ({ ...p, swiftCode: e.target.value }))} className={inputCls} placeholder="EQBLKENA" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowBankForm(false); setNewBank(emptyBank()); }} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={addBank} disabled={savingBank} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {savingBank ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

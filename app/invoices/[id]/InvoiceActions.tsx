"use client";

import { useState } from "react";
import { Download, Mail, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  invoice: {
    id: string;
    status: string;
    customerEmail: string;
  };
}

export default function InvoiceActions({ invoice }: Props) {
  const [marking, setMarking] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const markPaid = async () => {
    setMarking(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setMarking(false);
    }
  };

  const sendEmail = async () => {
    setEmailing(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/email`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }
      setEmailSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEmailing(false);
    }
  };

  const downloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={downloadPdf}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>

        <button
          onClick={sendEmail}
          disabled={emailing || emailSent}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {emailing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {emailSent ? "Email Sent!" : `Email to ${invoice.customerEmail}`}
        </button>

        {invoice.status !== "paid" && (
          <button
            onClick={markPaid}
            disabled={marking}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {marking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Mark as Paid
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</p>
      )}
    </div>
  );
}

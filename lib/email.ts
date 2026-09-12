import nodemailer from "nodemailer";
import { calcInvoiceTotal, calcVat, fuelLabel, formatAmount } from "./calculations";

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface InvoiceEmailData {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  fuelType: string;
  quantity: number;
  unit: string;
  transType: string;
  destination?: string | null;
  currency: string;
  sellingAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  paymentTerms: string;
  notes?: string | null;
  customer: { name: string; email?: string | null };
}

export async function sendInvoiceEmail(
  invoice: InvoiceEmailData,
  pdfBuffer: Buffer
) {
  if (!invoice.customer.email) {
    throw new Error("Customer has no email address");
  }

  const transporter = createTransporter();

  const vat = calcVat(invoice.sellingAmount, invoice.vatEnabled ? invoice.vatRate : 0);
  const total = calcInvoiceTotal(invoice.sellingAmount, invoice.vatEnabled, invoice.vatRate);
  const fmt = (n: number) => formatAmount(n, invoice.currency);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#111827;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#1d4ed8;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Invoice ${invoice.invoiceNumber}</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Due: ${new Date(invoice.dueDate).toLocaleDateString("en-KE")}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;">Dear <strong>${invoice.customer.name}</strong>,</p>
      <p style="color:#6b7280;margin:0 0 24px;line-height:1.6;">Please find attached your invoice. Below is a summary:</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Fuel Type</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Type</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;">Quantity</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${fuelLabel(invoice.fuelType)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${invoice.transType}${invoice.destination ? ` — ${invoice.destination}` : ""}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${invoice.quantity.toLocaleString()} ${invoice.unit}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">${fmt(invoice.sellingAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align:right;border-top:1px solid #e5e7eb;padding-top:16px;">
        <p style="margin:4px 0;color:#6b7280;">Subtotal: ${fmt(invoice.sellingAmount)}</p>
        ${invoice.vatEnabled ? `<p style="margin:4px 0;color:#6b7280;">VAT (${invoice.vatRate}%): ${fmt(vat)}</p>` : ""}
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#1d4ed8;">Total Due: ${fmt(total)}</p>
      </div>

      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Payment Terms: <strong>${invoice.paymentTerms}</strong></p>

      ${invoice.notes ? `<div style="margin-top:24px;padding:12px 16px;background:#f9fafb;border-radius:8px;"><p style="margin:0;color:#6b7280;font-size:13px;"><strong>Note:</strong> ${invoice.notes}</p></div>` : ""}

      <p style="margin-top:28px;color:#6b7280;font-size:13px;">The full invoice PDF is attached to this email.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#d1d5db;font-size:11px;margin:0;">Likoni Logistics Ltd — Fuel Reseller & Transport Solutions</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: invoice.customer.email,
    subject: `Invoice ${invoice.invoiceNumber} from Likoni Logistics Ltd`,
    html,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

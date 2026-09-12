import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { customer: true, bankAccount: true },
  });

  if (!invoice) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return Response.json(
      { error: "Email not configured. Add SMTP settings to .env.local" },
      { status: 503 }
    );
  }

  try {
    const pdfBuffer = await generateInvoicePDF(invoice);
    await sendInvoiceEmail(invoice, pdfBuffer);
    return Response.json({ ok: true, message: `Email sent to ${invoice.customer.email}` });
  } catch (err: any) {
    console.error("Email error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

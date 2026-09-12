import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(
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

  try {
    const pdfBuffer = await generateInvoicePDF(invoice);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

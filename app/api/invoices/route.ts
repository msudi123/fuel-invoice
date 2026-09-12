import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { calcGrossProfit } from "@/lib/calculations";
import { randomUUID } from "crypto";

export async function GET() {
  const invoices = await db.invoice.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(invoices);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerKraPin,
      customerRef,
      bankAccountId,
      fuelType,
      quantity,
      unit,
      transType,
      destination,
      currency,
      sellingAmount,
      purchaseAmount,
      vatEnabled,
      vatRate,
      dueDate,
      paymentTerms,
      notes,
    } = body;

    if (!customerName || !fuelType || !quantity || !sellingAmount || !dueDate) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find or create customer
    let customer = customerEmail
      ? await db.customer.findFirst({ where: { email: customerEmail } })
      : await db.customer.findFirst({ where: { name: customerName } });

    if (customer) {
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          phone: customerPhone ?? customer.phone,
          address: customerAddress ?? customer.address,
          kraPin: customerKraPin ?? customer.kraPin,
        },
      });
    } else {
      customer = await db.customer.create({
        data: {
          id: randomUUID(),
          name: customerName,
          email: customerEmail ?? null,
          phone: customerPhone ?? null,
          address: customerAddress ?? null,
          kraPin: customerKraPin ?? null,
        },
      });
    }

    const grossProfit = calcGrossProfit(sellingAmount, purchaseAmount ?? 0);

    const invoice = await db.invoice.create({
      data: {
        id: randomUUID(),
        invoiceNumber: await generateInvoiceNumber(),
        customerId: customer.id,
        customerRef: customerRef ?? null,
        bankAccountId: bankAccountId || null,
        fuelType,
        quantity,
        unit: unit ?? "MT",
        transType: transType ?? "Local",
        destination: destination ?? null,
        currency: currency ?? "USD",
        sellingAmount,
        purchaseAmount: purchaseAmount ?? 0,
        grossProfit,
        vatEnabled: vatEnabled ?? false,
        vatRate: vatRate ?? 16,
        dueDate: new Date(dueDate),
        paymentTerms: paymentTerms ?? "CASH",
        notes: notes ?? null,
      },
      include: { customer: true },
    });

    return Response.json(invoice, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

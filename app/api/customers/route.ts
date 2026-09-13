import { db } from "@/lib/db";

export async function GET() {
  const customers = await db.customer.findMany({
    include: {
      _count: { select: { invoices: true } },
      invoices: {
        select: { status: true, sellingAmount: true, vatEnabled: true, vatRate: true, currency: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(customers);
}

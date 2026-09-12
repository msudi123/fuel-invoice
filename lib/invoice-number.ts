import { db } from "./db";

export async function generateInvoiceNumber(): Promise<string> {
  // Atomic: read nextSequence, format, increment in one transaction
  const settings = await db.settings.findUniqueOrThrow({ where: { id: "singleton" } });
  const seq = settings.nextSequence;
  const year = new Date().getFullYear();
  const num = String(seq).padStart(4, "0");
  const invoiceNumber = `${settings.invoicePrefix}-${year}-${num}`;

  await db.settings.update({
    where: { id: "singleton" },
    data: { nextSequence: seq + 1 },
  });

  return invoiceNumber;
}

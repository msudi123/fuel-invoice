import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

async function requireAuth() {
  const session = await getSession();
  if (!session.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const err = await requireAuth();
  if (err) return err;
  const accounts = await db.bankAccount.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(accounts);
}

export async function POST(request: NextRequest) {
  const err = await requireAuth();
  if (err) return err;
  const body = await request.json();

  const { bankName, accountName, accountNumber, branch, swiftCode, bankAddress, currency, isDefault } = body;

  if (!bankName || !accountName || !accountNumber || !currency) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (isDefault) {
    await db.bankAccount.updateMany({ data: { isDefault: false } });
  }

  const account = await db.bankAccount.create({
    data: {
      id: randomUUID(),
      bankName,
      accountName,
      accountNumber,
      branch: branch || null,
      swiftCode: swiftCode || null,
      bankAddress: bankAddress || null,
      currency,
      isDefault: !!isDefault,
    },
  });

  return Response.json(account, { status: 201 });
}

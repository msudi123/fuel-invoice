import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireAuth() {
  const session = await getSession();
  if (!session.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAuth();
  if (err) return err;
  const { id } = await params;
  const body = await request.json();

  if (body.isDefault) {
    await db.bankAccount.updateMany({ data: { isDefault: false } });
  }

  const updated = await db.bankAccount.update({
    where: { id },
    data: { ...body, updatedAt: new Date() },
  });
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAuth();
  if (err) return err;
  const { id } = await params;
  await db.bankAccount.delete({ where: { id } });
  return Response.json({ ok: true });
}

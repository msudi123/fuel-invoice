import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireAuth() {
  const session = await getSession();
  if (!session.user) throw new Error("Unauthorized");
}

export async function GET() {
  await requireAuth();
  const settings = await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return Response.json(settings);
}

export async function PATCH(request: NextRequest) {
  await requireAuth();
  const body = await request.json();

  const { createdAt, updatedAt, id, ...data } = body;

  const updated = await db.settings.upsert({
    where: { id: "singleton" },
    update: { ...data, updatedAt: new Date() },
    create: { id: "singleton", ...data },
  });

  return Response.json(updated);
}

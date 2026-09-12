import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@likonil.co.ke";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "likoni2024";
  const adminName = process.env.ADMIN_NAME ?? "Administrator";

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatch = adminPassword.startsWith("$2")
    ? await bcrypt.compare(password, adminPassword)
    : password === adminPassword;

  if (!emailMatch || !passwordMatch) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.user = { id: "admin", email: adminEmail, name: adminName };
  await session.save();

  return Response.json({ ok: true });
}

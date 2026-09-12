import { getIronSession, IronSession, IronSessionData } from "iron-session";
import { cookies } from "next/headers";

declare module "iron-session" {
  interface IronSessionData {
    user?: { id: string; email: string; name: string };
  }
}

export const SESSION_OPTIONS = {
  cookieName: "likoni_session",
  password:
    process.env.SESSION_SECRET ??
    "likoni-logistics-internal-session-secret-key-minimum-32-chars",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<IronSession<IronSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<IronSessionData>(cookieStore, SESSION_OPTIONS);
}

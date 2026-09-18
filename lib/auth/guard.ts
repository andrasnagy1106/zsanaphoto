import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminUsers, type AdminUser } from "@/db/schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, payload.sub)).limit(1);
  return admin ?? null;
}

/** Server-side guard for admin pages/layouts. Redirects to the login page when unauthenticated. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

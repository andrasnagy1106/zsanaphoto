"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: unknown): Promise<LoginActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Adj meg érvényes e-mail címet és jelszót." };
  }

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email.trim().toLowerCase()))
    .limit(1);

  if (!admin) {
    return { success: false, error: "Hibás e-mail cím vagy jelszó." };
  }

  const passwordValid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!passwordValid) {
    return { success: false, error: "Hibás e-mail cím vagy jelszó." };
  }

  const token = createSessionToken(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

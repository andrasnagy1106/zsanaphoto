import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminUsers, type AdminUser } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { NotFoundError } from "@/lib/utils/errors";

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
}

export type SafeAdminUser = Pick<AdminUser, "id" | "email" | "name" | "createdAt" | "updatedAt">;

export async function listAdminUsers(): Promise<SafeAdminUser[]> {
  const users = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  return users;
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<SafeAdminUser> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (existing) {
    throw new Error("Ezzel az e-mail címmel már létezik adminisztrátor.");
  }

  const passwordHash = await hashPassword(input.password);

  const [created] = await db
    .insert(adminUsers)
    .values({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
    })
    .returning({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    });

  return created;
}

export async function deleteAdminUser(id: string, currentAdminId: string): Promise<boolean> {
  if (id === currentAdminId) {
    throw new Error("A saját fiókodat nem törölheted.");
  }

  const allAdmins = await db.select({ id: adminUsers.id }).from(adminUsers);
  if (allAdmins.length <= 1) {
    throw new Error("Az utolsó rendszergazda nem törölhető.");
  }

  const [deleted] = await db
    .delete(adminUsers)
    .where(eq(adminUsers.id, id))
    .returning({ id: adminUsers.id });

  if (!deleted) {
    throw new NotFoundError("Az adminisztrátor nem található.");
  }

  return true;
}

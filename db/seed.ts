import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { hashPassword } from "../lib/auth/password";
import { FAMILY_SERVICE_SLUG, INSTITUTION_SERVICE_SLUG } from "../lib/constants";

const DEV_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@zsanaphoto.dev";
const DEV_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local before seeding.",
    );
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log("Seeding services...");

  const [existingFamily] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.slug, FAMILY_SERVICE_SLUG))
    .limit(1);

  if (!existingFamily) {
    await db.insert(schema.services).values({
      name: "Családi fotózás",
      slug: FAMILY_SERVICE_SLUG,
      description: "Természetes, időtálló családi fotózás stúdióban vagy szabadtéren.",
      durationMinutes: 60,
      bufferMinutes: 15,
      approvalMode: "AUTO",
      active: true,
      sortOrder: 1,
    });
  }

  const [existingInstitution] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.slug, INSTITUTION_SERVICE_SLUG))
    .limit(1);

  if (!existingInstitution) {
    await db.insert(schema.services).values({
      name: "Intézményi fotózás",
      slug: INSTITUTION_SERVICE_SLUG,
      description: "Óvodai, iskolai és céges csoportos fotózás, egyedi ajánlat alapján.",
      durationMinutes: 60,
      bufferMinutes: 0,
      approvalMode: "MANUAL",
      active: true,
      sortOrder: 2,
    });
  }

  console.log("Seeding availability rules (Mon-Fri)...");

  const weekdayRules: { dayOfWeek: number; startTime: string; endTime: string }[] = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Monday
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tuesday
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wednesday
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "15:00" }, // Friday
    { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }, // Sunday (inactive)
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" }, // Saturday (inactive)
  ];

  for (const rule of weekdayRules) {
    const [existing] = await db
      .select()
      .from(schema.availabilityRules)
      .where(eq(schema.availabilityRules.dayOfWeek, rule.dayOfWeek))
      .limit(1);

    if (!existing) {
      await db.insert(schema.availabilityRules).values({
        ...rule,
        active: rule.dayOfWeek >= 1 && rule.dayOfWeek <= 5,
      });
    }
  }

  console.log("Seeding site settings...");

  const [existingSettings] = await db.select().from(schema.siteSettings).limit(1);
  if (!existingSettings) {
    await db.insert(schema.siteSettings).values({
      id: "default",
      timezone: "Europe/Budapest",
      adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@zsanaphoto.dev",
      siteContactEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@zsanaphoto.dev",
      minimumLeadTimeHours: 2,
      maxAdvanceDays: 90,
    });
  }

  console.log("Seeding development admin user...");

  const [existingAdmin] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, DEV_ADMIN_EMAIL))
    .limit(1);

  if (!existingAdmin) {
    const passwordHash = await hashPassword(DEV_ADMIN_PASSWORD);
    await db.insert(schema.adminUsers).values({
      email: DEV_ADMIN_EMAIL,
      passwordHash,
      name: "Zsana Photo Admin",
    });
    console.log(
      `Development admin created: ${DEV_ADMIN_EMAIL} / ${DEV_ADMIN_PASSWORD} (development only - change in production!)`,
    );
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

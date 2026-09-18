import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteSettings, type SiteSettings } from "@/db/schema";
import {
  DEFAULT_MAX_ADVANCE_DAYS,
  DEFAULT_MINIMUM_LEAD_TIME_HOURS,
} from "@/lib/constants";
import { BUSINESS_TIMEZONE } from "@/lib/utils/time";

const SETTINGS_ID = "default";

export async function getSettings(): Promise<SiteSettings> {
  const [existing] = await db.select().from(siteSettings).limit(1);
  if (existing) return existing;

  const now = new Date();
  return {
    id: SETTINGS_ID,
    timezone: BUSINESS_TIMEZONE,
    adminNotificationEmail: "",
    siteContactEmail: "",
    minimumLeadTimeHours: DEFAULT_MINIMUM_LEAD_TIME_HOURS,
    maxAdvanceDays: DEFAULT_MAX_ADVANCE_DAYS,
    createdAt: now,
    updatedAt: now,
  };
}

export interface UpdateSettingsInput {
  timezone: string;
  adminNotificationEmail: string;
  siteContactEmail: string;
  minimumLeadTimeHours: number;
  maxAdvanceDays: number;
}

export async function updateSettings(input: UpdateSettingsInput): Promise<SiteSettings> {
  const [existing] = await db.select().from(siteSettings).limit(1);

  if (!existing) {
    const [created] = await db
      .insert(siteSettings)
      .values({ id: SETTINGS_ID, ...input })
      .returning();
    return created;
  }

  const [updated] = await db
    .update(siteSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(siteSettings.id, existing.id))
    .returning();

  return updated;
}

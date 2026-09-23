import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteSettings, type SiteSettings } from "@/db/schema";
import {
  DEFAULT_MAX_ADVANCE_DAYS,
  DEFAULT_MINIMUM_LEAD_TIME_HOURS,
} from "@/lib/constants";
import type { PhotoPrintSize } from "@/lib/photo-order-catalog";
import {
  deletePhotoFromCloudinary,
  uploadSitePhotoToCloudinary,
} from "@/lib/providers/cloudinary/client";
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
    defaultPhotoPrices: null,
    aboutPhotoPublicId: null,
    aboutPhotoUrl: null,
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
  defaultPhotoPrices?: Partial<Record<PhotoPrintSize, number>> | null;
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

/** Replaces the homepage "about" portrait, deleting the previous Cloudinary asset if one exists. */
export async function updateAboutPhoto(file: Buffer, filename?: string): Promise<SiteSettings> {
  const previous = await getSettings();

  const uploadResult = await uploadSitePhotoToCloudinary({ file, key: "about", filename });

  const [existing] = await db.select().from(siteSettings).limit(1);
  const [updated] = existing
    ? await db
        .update(siteSettings)
        .set({
          aboutPhotoPublicId: uploadResult.publicId,
          aboutPhotoUrl: uploadResult.secureUrl,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, existing.id))
        .returning()
    : await db
        .insert(siteSettings)
        .values({
          id: SETTINGS_ID,
          adminNotificationEmail: "",
          siteContactEmail: "",
          aboutPhotoPublicId: uploadResult.publicId,
          aboutPhotoUrl: uploadResult.secureUrl,
        })
        .returning();

  if (previous.aboutPhotoPublicId) {
    await deletePhotoFromCloudinary(previous.aboutPhotoPublicId);
  }

  return updated;
}

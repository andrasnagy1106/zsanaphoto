import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { sitePhotos } from "@/db/schema";
import {
  deletePhotoFromCloudinary,
  uploadSitePhotoToCloudinary,
} from "@/lib/providers/cloudinary/client";

/** Returns a { key -> secureUrl (or null if not uploaded yet) } map for the given keys. */
export async function getSitePhotoUrls(keys: string[]): Promise<Record<string, string | null>> {
  const urlByKey: Record<string, string | null> = {};
  for (const key of keys) urlByKey[key] = null;

  if (keys.length === 0) return urlByKey;

  const rows = await db.select().from(sitePhotos).where(inArray(sitePhotos.key, keys));
  for (const row of rows) urlByKey[row.key] = row.secureUrl;
  return urlByKey;
}

/** Uploads (or replaces) the site-wide photo stored under `key`, deleting the previous asset. */
export async function uploadSitePhoto(key: string, file: Buffer, filename?: string): Promise<string> {
  const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.key, key)).limit(1);
  const uploadResult = await uploadSitePhotoToCloudinary({ file, key, filename });

  if (existing) {
    await db
      .update(sitePhotos)
      .set({ publicId: uploadResult.publicId, secureUrl: uploadResult.secureUrl, updatedAt: new Date() })
      .where(eq(sitePhotos.key, key));
    await deletePhotoFromCloudinary(existing.publicId);
  } else {
    await db.insert(sitePhotos).values({ key, publicId: uploadResult.publicId, secureUrl: uploadResult.secureUrl });
  }

  return uploadResult.secureUrl;
}

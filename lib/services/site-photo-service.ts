import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { sitePhotos } from "@/db/schema";
import {
  deletePhotoFromCloudinary,
  uploadSitePhotoToCloudinary,
} from "@/lib/providers/cloudinary/client";
import type { PhotoFocusInput } from "@/lib/validation/photo-edit";

export interface SitePhotoView {
  url: string;
  focusX: number;
  focusY: number;
}

/** Returns a { key -> photo (or null if not uploaded yet) } map for the given keys. */
export async function getSitePhotos(keys: string[]): Promise<Record<string, SitePhotoView | null>> {
  const photoByKey: Record<string, SitePhotoView | null> = {};
  for (const key of keys) photoByKey[key] = null;

  if (keys.length === 0) return photoByKey;

  const rows = await db.select().from(sitePhotos).where(inArray(sitePhotos.key, keys));
  for (const row of rows) {
    photoByKey[row.key] = { url: row.secureUrl, focusX: row.focusX, focusY: row.focusY };
  }
  return photoByKey;
}

export async function updateSitePhotoFocus(key: string, focus: PhotoFocusInput): Promise<boolean> {
  const updated = await db
    .update(sitePhotos)
    .set({ focusX: focus.focusX, focusY: focus.focusY, updatedAt: new Date() })
    .where(eq(sitePhotos.key, key))
    .returning({ key: sitePhotos.key });

  return updated.length > 0;
}

/** Uploads (or replaces) the site-wide photo stored under `key`, deleting the previous asset. */
export async function uploadSitePhoto(key: string, file: Buffer, filename?: string): Promise<string> {
  const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.key, key)).limit(1);
  const uploadResult = await uploadSitePhotoToCloudinary({ file, key, filename });

  if (existing) {
    await db
      .update(sitePhotos)
      .set({
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        focusX: 50,
        focusY: 50,
        updatedAt: new Date(),
      })
      .where(eq(sitePhotos.key, key));
    await deletePhotoFromCloudinary(existing.publicId);
  } else {
    await db.insert(sitePhotos).values({ key, publicId: uploadResult.publicId, secureUrl: uploadResult.secureUrl });
  }

  return uploadResult.secureUrl;
}

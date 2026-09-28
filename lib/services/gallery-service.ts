import { asc, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { galleryPhotos, type GalleryPhoto } from "@/db/schema";
import {
  deletePhotoFromCloudinary,
  uploadGalleryPhotoToCloudinary,
} from "@/lib/providers/cloudinary/client";
import {
  GALLERY_CATEGORY_DEFAULT_CAPTIONS,
  type GalleryCategory,
} from "@/lib/gallery-categories";
import type { ServicePagePhotoKey } from "@/lib/service-page-photos";
import { reorderIdsByMove, toObjectPosition } from "@/lib/utils/photo-layout";
import type { GalleryPhotoEditInput, PhotoMoveDirection } from "@/lib/validation/photo-edit";

export interface GalleryPhotoDisplay {
  id?: string;
  /** A gallery category or a service page collection key. */
  category: string;
  /** Empty string means no caption is rendered on the photo. */
  caption: string;
  src?: string | null;
  width?: number | null;
  height?: number | null;
  objectPosition?: string;
}

export function toGalleryPhotoDisplay(photo: GalleryPhoto): GalleryPhotoDisplay {
  return {
    id: photo.id,
    category: photo.category,
    caption: photo.showCaption ? photo.caption : "",
    src: photo.secureUrl,
    width: photo.width,
    height: photo.height,
    objectPosition: toObjectPosition(photo.focusX, photo.focusY),
  };
}

/** Returns every uploaded gallery photo, ordered by category then sort order. */
export async function listAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  return db
    .select()
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.category), asc(galleryPhotos.sortOrder), asc(galleryPhotos.createdAt));
}

export async function listGalleryPhotosByCategory(category: string): Promise<GalleryPhoto[]> {
  return db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.category, category))
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.createdAt));
}

/**
 * Returns one display entry per category (the first uploaded photo, oldest sort order first).
 * Categories without an uploaded photo yet fall back to a placeholder entry (no `src`), so
 * calling UI can render a neutral filler image instead of breaking.
 */
export async function getFeaturedGalleryPhotos(
  categories: readonly GalleryCategory[],
): Promise<GalleryPhotoDisplay[]> {
  const allPhotos = await listAllGalleryPhotos();

  return categories.map((category) => {
    const firstPhoto = allPhotos.find((photo) => photo.category === category);
    if (firstPhoto) return toGalleryPhotoDisplay(firstPhoto);
    return { category, caption: GALLERY_CATEGORY_DEFAULT_CAPTIONS[category], src: null };
  });
}

/**
 * Returns the photos uploaded specifically for a service page; until the admin uploads any,
 * falls back to the featured gallery photos of the given categories.
 */
export async function getServicePagePhotos(
  pageKey: ServicePagePhotoKey,
  fallbackCategories: readonly GalleryCategory[],
): Promise<GalleryPhotoDisplay[]> {
  const pagePhotos = await listGalleryPhotosByCategory(pageKey);
  if (pagePhotos.length > 0) return pagePhotos.map(toGalleryPhotoDisplay);
  return getFeaturedGalleryPhotos(fallbackCategories);
}

export interface UploadGalleryPhotoInput {
  category: string;
  file: Buffer;
  filename?: string;
  caption?: string;
}

export async function uploadGalleryPhoto(input: UploadGalleryPhotoInput): Promise<GalleryPhoto> {
  const uploadResult = await uploadGalleryPhotoToCloudinary({
    file: input.file,
    category: input.category,
    filename: input.filename,
  });

  const [{ maxSortOrder }] = await db
    .select({ maxSortOrder: max(galleryPhotos.sortOrder) })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.category, input.category));

  const [created] = await db
    .insert(galleryPhotos)
    .values({
      category: input.category,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      // No filename fallback: camera file names (e.g. "IMG_1234") shouldn't appear on the site.
      caption: input.caption?.trim() ?? "",
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      sortOrder: (maxSortOrder ?? -1) + 1,
    })
    .returning();

  return created;
}

export async function updateGalleryPhotoDetails(
  photoId: string,
  input: GalleryPhotoEditInput,
): Promise<boolean> {
  const updated = await db
    .update(galleryPhotos)
    .set({
      caption: input.caption,
      showCaption: input.showCaption,
      focusX: input.focusX,
      focusY: input.focusY,
      updatedAt: new Date(),
    })
    .where(eq(galleryPhotos.id, photoId))
    .returning({ id: galleryPhotos.id });

  return updated.length > 0;
}

/** Moves a photo one position within its category and renumbers the category's sort order. */
export async function moveGalleryPhoto(photoId: string, direction: PhotoMoveDirection): Promise<boolean> {
  const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, photoId)).limit(1);
  if (!photo) return false;

  const siblings = await listGalleryPhotosByCategory(photo.category);
  const reorderedIds = reorderIdsByMove(siblings.map((sibling) => sibling.id), photoId, direction);
  if (!reorderedIds) return false;

  await db.transaction(async (tx) => {
    for (const [index, id] of reorderedIds.entries()) {
      await tx.update(galleryPhotos).set({ sortOrder: index }).where(eq(galleryPhotos.id, id));
    }
  });
  return true;
}

export async function deleteGalleryPhotoById(photoId: string): Promise<boolean> {
  const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, photoId)).limit(1);
  if (!photo) return false;

  await deletePhotoFromCloudinary(photo.publicId);
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, photoId));
  return true;
}

import { asc, eq } from "drizzle-orm";
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

export interface GalleryPhotoDisplay {
  id?: string;
  category: GalleryCategory;
  caption: string;
  src?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Returns every uploaded gallery photo, ordered by category then sort order. */
export async function listAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  return db
    .select()
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.category), asc(galleryPhotos.sortOrder), asc(galleryPhotos.createdAt));
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
    if (firstPhoto) {
      return {
        id: firstPhoto.id,
        category,
        caption: firstPhoto.caption,
        src: firstPhoto.secureUrl,
        width: firstPhoto.width,
        height: firstPhoto.height,
      };
    }
    return { category, caption: GALLERY_CATEGORY_DEFAULT_CAPTIONS[category], src: null };
  });
}

export interface UploadGalleryPhotoInput {
  category: GalleryCategory;
  file: Buffer;
  filename?: string;
  caption?: string;
  sortOrder?: number;
}

export async function uploadGalleryPhoto(input: UploadGalleryPhotoInput): Promise<GalleryPhoto> {
  const uploadResult = await uploadGalleryPhotoToCloudinary({
    file: input.file,
    category: input.category,
    filename: input.filename,
  });

  const caption =
    input.caption?.trim() ||
    input.filename?.replace(/\.[^/.]+$/, "") ||
    GALLERY_CATEGORY_DEFAULT_CAPTIONS[input.category];

  const [created] = await db
    .insert(galleryPhotos)
    .values({
      category: input.category,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      caption,
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return created;
}

export async function deleteGalleryPhotoById(photoId: string): Promise<boolean> {
  const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, photoId)).limit(1);
  if (!photo) return false;

  await deletePhotoFromCloudinary(photo.publicId);
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, photoId));
  return true;
}

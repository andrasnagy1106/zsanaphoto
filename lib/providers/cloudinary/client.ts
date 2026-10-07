import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const DEFAULT_WATERMARK_TEXT = process.env.CLOUDINARY_WATERMARK_TEXT ?? "ZsaNa Photo";
const FOLDER_PREFIX = process.env.CLOUDINARY_FOLDER_PREFIX ?? "zsanaphoto/events";

export function getCloudinaryFolderForPin(pin: string): string {
  const normalizedPin = pin.trim().toUpperCase();
  return `${FOLDER_PREFIX}/${normalizedPin}`;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET) ||
      process.env.CLOUDINARY_URL,
  );
}

export function configureCloudinary(): typeof cloudinary {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "demo",
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  return cloudinary;
}

export interface SignedEventPhotoUpload {
  apiKey: string;
  cloudName: string;
  assetFolder: string;
  publicId: string;
  overwrite: false;
  signature: string;
  tags: string;
  timestamp: number;
}

export function createSignedEventPhotoUpload(pin: string): SignedEventPhotoUpload {
  const normalizedPin = pin.trim().toUpperCase();
  const client = configureCloudinary();
  const { api_key: apiKey, api_secret: apiSecret, cloud_name: cloudName } = client.config();
  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Cloudinary is not fully configured for signed uploads.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const assetFolder = getCloudinaryFolderForPin(normalizedPin);
  const publicId = `${assetFolder}/${randomUUID()}`;
  const tags = normalizedPin;
  const overwrite = false;
  const paramsToSign = {
    asset_folder: assetFolder,
    overwrite,
    public_id: publicId,
    tags,
    timestamp,
  };
  const signature = client.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    apiKey,
    cloudName,
    assetFolder,
    publicId,
    overwrite,
    signature,
    tags,
    timestamp,
  };
}

export function verifyCloudinaryUploadResponseSignature(
  publicId: string,
  version: number,
  signature: string,
): boolean {
  const client = configureCloudinary();
  const utils = client.utils as typeof client.utils & {
    verify_api_response_signature?: (publicId: string, version: number, signature: string) => boolean;
  };
  return utils.verify_api_response_signature?.(publicId, version, signature) ?? false;
}

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
}

export function buildWatermarkedUrl(
  publicId: string,
  options: WatermarkOptions = {},
): string {
  const client = configureCloudinary();
  const text = options.text ?? DEFAULT_WATERMARK_TEXT;
  const opacity = options.opacity ?? 45;
  const fontSize = options.fontSize ?? 44;

  return client.url(publicId, {
    secure: true,
    transformation: [
      ...(options.width || options.height
        ? [
            {
              width: options.width,
              height: options.height,
              crop: options.crop ?? "limit",
              quality: options.quality ?? "auto",
            },
          ]
        : [{ quality: options.quality ?? "auto" }]),
      {
        overlay: {
          font_family: "Arial",
          font_size: fontSize,
          font_weight: "bold",
          text: encodeURIComponent(text),
        },
        color: "#ffffff",
        opacity,
        gravity: "center",
      },
    ],
  });
}

export interface UploadGalleryPhotoOptions {
  file: Buffer | string;
  category: string;
  filename?: string;
}

export interface GalleryUploadResult {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  originalFilename?: string;
}

const GALLERY_FOLDER_PREFIX = process.env.CLOUDINARY_GALLERY_FOLDER_PREFIX ?? "zsanaphoto/gallery";

function getGalleryCloudinaryFolder(category: string): string {
  const slug = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${GALLERY_FOLDER_PREFIX}/${slug || "egyeb"}`;
}

/** Uploads a public portfolio gallery photo (no watermark) under a category folder. */
export async function uploadGalleryPhotoToCloudinary(
  options: UploadGalleryPhotoOptions,
): Promise<GalleryUploadResult> {
  const folder = getGalleryCloudinaryFolder(options.category);
  const uploadResponse = await uploadToCloudinaryFolder({
    file: options.file,
    folder,
    filename: options.filename,
    tags: ["gallery", options.category],
  });

  return {
    publicId: uploadResponse.public_id,
    secureUrl: uploadResponse.secure_url,
    width: uploadResponse.width,
    height: uploadResponse.height,
    bytes: uploadResponse.bytes,
    format: uploadResponse.format,
    originalFilename: options.filename ?? uploadResponse.original_filename,
  };
}

const SITE_FOLDER_PREFIX = process.env.CLOUDINARY_SITE_FOLDER_PREFIX ?? "zsanaphoto/site";

export interface UploadSitePhotoOptions {
  file: Buffer | string;
  key: string;
  filename?: string;
}

export interface SitePhotoUploadResult {
  publicId: string;
  secureUrl: string;
}

/** Uploads a singleton site-wide marketing photo (e.g. the homepage "about" portrait). */
export async function uploadSitePhotoToCloudinary(
  options: UploadSitePhotoOptions,
): Promise<SitePhotoUploadResult> {
  const uploadResponse = await uploadToCloudinaryFolder({
    file: options.file,
    folder: SITE_FOLDER_PREFIX,
    filename: options.filename,
    tags: ["site", options.key],
  });

  return { publicId: uploadResponse.public_id, secureUrl: uploadResponse.secure_url };
}

interface UploadToCloudinaryFolderOptions {
  file: Buffer | string;
  folder: string;
  filename?: string;
  tags?: string[];
}

async function uploadToCloudinaryFolder(
  options: UploadToCloudinaryFolderOptions,
): Promise<UploadApiResponse> {
  const client = configureCloudinary();
  const uploadOptions = {
    folder: options.folder,
    resource_type: "image" as const,
    use_filename: Boolean(options.filename),
    filename_override: options.filename,
    unique_filename: true,
    tags: options.tags,
  };

  if (Buffer.isBuffer(options.file)) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = client.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed: empty result"));
        } else {
          resolve(result);
        }
      });
      stream.end(options.file);
    });
  }

  return client.uploader.upload(options.file, uploadOptions);
}

export async function deletePhotoFromCloudinary(publicId: string): Promise<boolean> {
  const client = configureCloudinary();
  const result = await client.uploader.destroy(publicId, { resource_type: "image" });
  return result?.result === "ok";
}

export async function deleteMultiplePhotosFromCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  const client = configureCloudinary();
  for (let offset = 0; offset < publicIds.length; offset += 100) {
    const batch = publicIds.slice(offset, offset + 100);
    const result = await client.api.delete_resources(batch, { resource_type: "image", invalidate: true });
    if (batch.some((publicId) => !["deleted", "not_found"].includes(result.deleted?.[publicId]))) {
      throw new Error("Nem sikerült minden képet törölni a Cloudinary tárhelyről. Próbáld újra a törlést.");
    }
  }
}

export async function deleteFolderFromCloudinary(pin: string): Promise<void> {
  const client = configureCloudinary();
  const folder = getCloudinaryFolderForPin(pin);
  try {
    // Delete all resources in the folder prefix first
    await client.api.delete_resources_by_prefix(`${folder}/`);
    // Then delete the folder itself
    await client.api.delete_folder(folder);
  } catch (error) {
    console.error(`[cloudinary] Failed to delete folder ${folder}:`, error);
  }
}

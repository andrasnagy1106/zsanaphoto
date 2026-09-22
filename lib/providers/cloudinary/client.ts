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

export interface UploadFileOptions {
  file: Buffer | string; // Buffer, base64 data URI, remote URL, or local path
  pin: string;
  filename?: string;
  tags?: string[];
  watermarkOptions?: WatermarkOptions;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  watermarkedUrl: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  originalFilename?: string;
}

export async function uploadPhotoToCloudinary(
  options: UploadFileOptions,
): Promise<UploadResult> {
  const client = configureCloudinary();
  const folder = getCloudinaryFolderForPin(options.pin);

  let uploadResponse: UploadApiResponse;

  if (Buffer.isBuffer(options.file)) {
    uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: Boolean(options.filename),
          filename_override: options.filename,
          unique_filename: true,
          tags: [options.pin, ...(options.tags ?? [])],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed: empty result"));
          } else {
            resolve(result);
          }
        },
      );
      stream.end(options.file);
    });
  } else {
    uploadResponse = await client.uploader.upload(options.file, {
      folder,
      resource_type: "image",
      use_filename: Boolean(options.filename),
      filename_override: options.filename,
      unique_filename: true,
      tags: [options.pin, ...(options.tags ?? [])],
    });
  }

  const watermarkedUrl = buildWatermarkedUrl(
    uploadResponse.public_id,
    options.watermarkOptions,
  );

  return {
    publicId: uploadResponse.public_id,
    secureUrl: uploadResponse.secure_url,
    watermarkedUrl,
    width: uploadResponse.width,
    height: uploadResponse.height,
    bytes: uploadResponse.bytes,
    format: uploadResponse.format,
    originalFilename: options.filename ?? uploadResponse.original_filename,
  };
}

export async function deletePhotoFromCloudinary(publicId: string): Promise<boolean> {
  const client = configureCloudinary();
  const result = await client.uploader.destroy(publicId, { resource_type: "image" });
  return result?.result === "ok";
}

export async function deleteMultiplePhotosFromCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  const client = configureCloudinary();
  await client.api.delete_resources(publicIds, { resource_type: "image" });
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

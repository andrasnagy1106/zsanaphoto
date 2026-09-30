export interface PrepareImageUploadOptions {
  maxDimension?: number;
  maxFileSizeBytes?: number;
  quality?: number;
}

export interface PreparedImageUpload {
  file: File;
  resized: boolean;
}

const DEFAULT_MAX_DIMENSION = 2560;
const DEFAULT_MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;
const DEFAULT_QUALITY = 0.88;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getTargetMimeType(sourceMimeType: string): string {
  if (sourceMimeType === "image/png") return "image/png";
  if (sourceMimeType === "image/webp") return "image/webp";
  return "image/jpeg";
}

function replaceFileExtension(fileName: string, mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType] ?? ".jpg";
  return fileName.replace(/\.[^/.]+$/, "") + extension;
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number; image: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight, image });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`A kép nem olvasható: ${file.name}`));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("A kép feldolgozása sikertelen volt."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Prepares an image file for upload by downscaling it on the client without cropping.
 * This keeps portrait/landscape orientation intact and avoids large payload upload failures.
 */
export async function prepareImageUpload(
  file: File,
  options: PrepareImageUploadOptions = {},
): Promise<PreparedImageUpload> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const { width, height, image } = await loadImageDimensions(file);
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  if (scale === 1 && file.size <= maxFileSizeBytes) {
    return { file, resized: false };
  }

  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return { file, resized: false };
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const targetMimeType = getTargetMimeType(file.type);
  const blob = await canvasToBlob(canvas, targetMimeType, quality);

  if (blob.size >= file.size && scale === 1) {
    return { file, resized: false };
  }

  const resizedFile = new File([blob], replaceFileExtension(file.name, targetMimeType), {
    type: targetMimeType,
    lastModified: Date.now(),
  });

  return { file: resizedFile, resized: true };
}

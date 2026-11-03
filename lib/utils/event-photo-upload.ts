export const MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_EVENT_PHOTO_SOURCE_SIZE_BYTES = 25 * 1024 * 1024;

export async function prepareEventPhotoForUpload(file: File): Promise<File> {
  if (file.size <= MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES) return file;
  if (file.size > MAX_EVENT_PHOTO_SOURCE_SIZE_BYTES) {
    throw new Error("A kiválasztott fájl nagyobb 25 MiB-nál.");
  }
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("A kép tömörítése ebben a környezetben nem érhető el.");
  }

  const outputType = file.type === "image/jpeg" || file.type === "image/jpg"
    ? "image/jpeg"
    : "image/webp";
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const loadedImage = new Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error("A kép nem olvasható vagy nem támogatott."));
      loadedImage.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("A kép felbontása nem olvasható.");
    }

    const context = canvas.getContext("2d");
    if (!context) throw new Error("A kép tömörítése nem sikerült.");
    context.drawImage(image, 0, 0);

    const encode = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("A kép tömörítése nem sikerült."));
          } else if (blob.type !== outputType) {
            reject(new Error("A böngésző nem támogatja a szükséges képkimeneti formátumot."));
          } else {
            resolve(blob);
          }
        },
        outputType,
        quality,
      );
    });

    let compressed = await encode(0.9);
    if (compressed.size > MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES) {
      let lowerQuality = 0.2;
      let upperQuality = 0.9;
      const lowestQuality = await encode(lowerQuality);
      compressed = lowestQuality.size <= MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES
        ? lowestQuality
        : compressed;

      if (lowestQuality.size <= MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES) {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const quality = (lowerQuality + upperQuality) / 2;
          const candidate = await encode(quality);
          if (candidate.size <= MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES) {
            compressed = candidate;
            lowerQuality = quality;
          } else {
            upperQuality = quality;
          }
        }
      } else {
        throw new Error("A kép tömörítés után is nagyobb 10 MiB-nál; kérlek, csökkentsd a kép méretét.");
      }
    }

    const extension = outputType === "image/jpeg" ? "jpg" : "webp";
    const filename = file.name.replace(/\.[^/.]+$/, "");
    return new File([compressed], `${filename}.${extension}`, {
      type: outputType,
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export interface SignedCloudinaryUploadParams {
  apiKey: string;
  assetFolder: string;
  cloudName: string;
  overwrite: false;
  publicId: string;
  signature: string;
  tags: string;
  timestamp: number;
}

export interface DirectCloudinaryUploadResult {
  publicId: string;
  version: number;
  signature: string;
}

interface CloudinaryUploadResponse {
  public_id?: unknown;
  version?: unknown;
  signature?: unknown;
  error?: { message?: unknown };
}

export async function uploadEventPhotoDirectlyToCloudinary(
  file: File,
  params: SignedCloudinaryUploadParams,
): Promise<DirectCloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", params.apiKey);
  formData.append("asset_folder", params.assetFolder);
  formData.append("overwrite", String(params.overwrite));
  formData.append("public_id", params.publicId);
  formData.append("signature", params.signature);
  formData.append("tags", params.tags);
  formData.append("timestamp", String(params.timestamp));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(params.cloudName)}/image/upload`,
    { method: "POST", body: formData },
  );
  const result = await response.json() as CloudinaryUploadResponse;

  if (!response.ok) {
    const errorMessage = typeof result.error?.message === "string"
      ? result.error.message
      : "A Cloudinary feltöltés sikertelen volt.";
    throw new Error(errorMessage);
  }

  if (
    typeof result.public_id !== "string" ||
    typeof result.version !== "number" ||
    typeof result.signature !== "string"
  ) {
    throw new Error("A Cloudinary érvénytelen feltöltési választ adott.");
  }

  return {
    publicId: result.public_id,
    version: result.version,
    signature: result.signature,
  };
}
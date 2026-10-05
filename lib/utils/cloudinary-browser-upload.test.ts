import { afterEach, describe, expect, it, vi } from "vitest";
import {
  uploadEventPhotoDirectlyToCloudinary,
  type SignedCloudinaryUploadParams,
} from "./cloudinary-browser-upload";

const signedParams: SignedCloudinaryUploadParams = {
  apiKey: "public-api-key",
  assetFolder: "zsanaphoto/events/AB12345",
  cloudName: "test-cloud",
  overwrite: false,
  publicId: "zsanaphoto/events/AB12345/photo_abc",
  signature: "signed-value",
  tags: "AB12345",
  timestamp: 1_700_000_000,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadEventPhotoDirectlyToCloudinary", () => {
  it("sends one original file to Cloudinary with the server-signed parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      public_id: "zsanaphoto/events/AB12345/photo_abc",
      version: 1_700_000_001,
      signature: "response-signature",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File([new Uint8Array([1, 2, 3])], "portrait.jpg", { type: "image/jpeg" });

    const result = await uploadEventPhotoDirectlyToCloudinary(file, signedParams);

    expect(result).toEqual({
      publicId: "zsanaphoto/events/AB12345/photo_abc",
      version: 1_700_000_001,
      signature: "response-signature",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
      expect.objectContaining({ method: "POST" }),
    );

    const requestBody = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(requestBody.get("file")).toBe(file);
    expect(requestBody.get("api_key")).toBe("public-api-key");
    expect(requestBody.get("asset_folder")).toBe("zsanaphoto/events/AB12345");
    expect(requestBody.get("public_id")).toBe("zsanaphoto/events/AB12345/photo_abc");
    expect(requestBody.get("overwrite")).toBe("false");
    expect(requestBody.get("tags")).toBe("AB12345");
    expect(requestBody.get("signature")).toBe("signed-value");
    expect(requestBody.get("api_secret")).toBeNull();
  });

  it("surfaces Cloudinary upload errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: "Invalid Signature" },
    }), { status: 401 })));
    const file = new File([new Uint8Array([1])], "photo.jpg", { type: "image/jpeg" });

    await expect(uploadEventPhotoDirectlyToCloudinary(file, signedParams))
      .rejects.toThrow("Invalid Signature");
  });
});
import { describe, expect, it } from "vitest";
import {
  buildWatermarkedUrl,
  createSignedEventPhotoUpload,
  getCloudinaryFolderForPin,
  isCloudinaryConfigured,
} from "./client";

describe("cloudinary client utilities", () => {
  it("formats the PIN folder correctly", () => {
    expect(getCloudinaryFolderForPin("ab12345")).toBe("zsanaphoto/events/AB12345");
    expect(getCloudinaryFolderForPin("DE99999")).toBe("zsanaphoto/events/DE99999");
  });

  it("checks if credentials are configured", () => {
    // In test environment without env vars it returns boolean
    expect(typeof isCloudinaryConfigured()).toBe("boolean");
  });

  it("creates a signed upload restricted to the normalized PIN folder", () => {
    const previousEnvironment = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      cloudinaryUrl: process.env.CLOUDINARY_URL,
    };
    process.env.CLOUDINARY_URL = "";
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-api-key";
    process.env.CLOUDINARY_API_SECRET = "test-api-secret";

    try {
      const upload = createSignedEventPhotoUpload("ab12345");

      expect(upload.apiKey).toBe("test-api-key");
      expect(upload.cloudName).toBe("test-cloud");
      expect(upload.assetFolder).toBe("zsanaphoto/events/AB12345");
      expect(upload.publicId).toMatch(/^zsanaphoto\/events\/AB12345\//);
      expect(upload.tags).toBe("AB12345");
      expect(upload.overwrite).toBe(false);
      expect(upload.signature).not.toContain("test-api-secret");
    } finally {
      if (previousEnvironment.cloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
      else process.env.CLOUDINARY_CLOUD_NAME = previousEnvironment.cloudName;
      if (previousEnvironment.apiKey === undefined) delete process.env.CLOUDINARY_API_KEY;
      else process.env.CLOUDINARY_API_KEY = previousEnvironment.apiKey;
      if (previousEnvironment.apiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
      else process.env.CLOUDINARY_API_SECRET = previousEnvironment.apiSecret;
      if (previousEnvironment.cloudinaryUrl === undefined) delete process.env.CLOUDINARY_URL;
      else process.env.CLOUDINARY_URL = previousEnvironment.cloudinaryUrl;
    }
  });

  it("builds watermarked URL with transformation overlay", () => {
    const url = buildWatermarkedUrl("zsanaphoto/events/AB12345/photo_1", {
      text: "ZsaNa Photo",
      opacity: 50,
    });

    expect(url).toContain("res.cloudinary.com");
    expect(url).toContain("zsanaphoto/events/AB12345/photo_1");
    expect(url).toContain("ZsaNa");
  });

  it("builds watermarked URL with custom dimensions and watermark text", () => {
    const url = buildWatermarkedUrl("sample_photo", {
      text: "MINTA",
      width: 800,
      height: 600,
    });

    expect(url).toContain("sample_photo");
    expect(url).toContain("w_800");
    expect(url).toContain("h_600");
  });
});

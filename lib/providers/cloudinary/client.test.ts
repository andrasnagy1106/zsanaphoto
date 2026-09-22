import { describe, expect, it } from "vitest";
import {
  buildWatermarkedUrl,
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

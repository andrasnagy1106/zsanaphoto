import { describe, expect, it } from "vitest";
import { getWatermarkedPhotoUrl } from "./photo-storage-service";

describe("photo-storage-service", () => {
  it("generates watermarked url from publicId", () => {
    const url = getWatermarkedPhotoUrl("zsanaphoto/events/AB12345/test_image", {
      text: "ZsaNa Photo",
      opacity: 40,
    });

    expect(url).toContain("zsanaphoto/events/AB12345/test_image");
    expect(url).toContain("res.cloudinary.com");
  });
});

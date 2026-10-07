import { afterEach, describe, expect, it, vi } from "vitest";
import { getWatermarkedPhotoUrl } from "./photo-storage-service";
import { configureCloudinary, deleteMultiplePhotosFromCloudinary } from "@/lib/providers/cloudinary/client";

afterEach(() => vi.restoreAllMocks());

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

describe("deleteMultiplePhotosFromCloudinary", () => {
  it("deletes in batches with CDN invalidation and accepts already missing assets", async () => {
    const ids = Array.from({ length: 101 }, (_, index) => `events/photo-${index}`);
    const remove = vi.spyOn(configureCloudinary().api, "delete_resources")
      .mockImplementation(async (publicIds) => ({
        deleted: Object.fromEntries((publicIds as string[]).map((publicId) => [publicId, publicId === ids[0] ? "not_found" : "deleted"])),
      }));
    await deleteMultiplePhotosFromCloudinary(ids);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenNthCalledWith(1, ids.slice(0, 100), { resource_type: "image", invalidate: true });
    expect(remove).toHaveBeenNthCalledWith(2, ids.slice(100), { resource_type: "image", invalidate: true });
  });

  it("rejects partial deletion rather than reporting success", async () => {
    vi.spyOn(configureCloudinary().api, "delete_resources").mockResolvedValue({ deleted: { "events/photo": "error" } });
    await expect(deleteMultiplePhotosFromCloudinary(["events/photo"])).rejects.toThrow("Nem sikerült minden képet törölni");
  });

  it("does not contact Cloudinary when there are no photos", async () => {
    const remove = vi.spyOn(configureCloudinary().api, "delete_resources");
    await deleteMultiplePhotosFromCloudinary([]);
    expect(remove).not.toHaveBeenCalled();
  });
});

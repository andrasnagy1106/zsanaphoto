import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES,
  prepareEventPhotoForUpload,
} from "./event-photo-upload";

afterEach(() => vi.unstubAllGlobals());

describe("prepareEventPhotoForUpload", () => {
  it("keeps files that fit Cloudinary's upload limit unchanged", async () => {
    const file = new File([new Uint8Array(100)], "portrait.jpg", { type: "image/jpeg" });

    await expect(prepareEventPhotoForUpload(file)).resolves.toBe(file);
  });

  it("compresses larger supported files without changing pixel dimensions", async () => {
    const file = new File([new Uint8Array(MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES + 1)], "portrait.jpg", {
      type: "image/jpeg",
      lastModified: 123,
    });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
        const size = Math.floor(8 * 1024 * 1024 + (quality ?? 0) * 4 * 1024 * 1024);
        callback(new Blob([new Uint8Array(size)], { type }));
      }),
    };
    class MockImage {
      naturalWidth = 2400;
      naturalHeight = 1600;
      onload: (() => void) | null = null;
      onerror: ((event: string | Event) => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL });
    vi.stubGlobal("document", { createElement: vi.fn(() => canvas) });

    const result = await prepareEventPhotoForUpload(file);

    expect(result).not.toBe(file);
    expect(result.name).toBe("portrait.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThanOrEqual(MAX_EVENT_PHOTO_UPLOAD_SIZE_BYTES);
    expect(canvas.width).toBe(2400);
    expect(canvas.height).toBe(1600);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("rejects source files above the supported maximum", async () => {
    const file = new File([new Uint8Array(26 * 1024 * 1024)], "portrait.jpg", { type: "image/jpeg" });

    await expect(prepareEventPhotoForUpload(file)).rejects.toThrow("nagyobb 25 MiB-nál");
  });
});

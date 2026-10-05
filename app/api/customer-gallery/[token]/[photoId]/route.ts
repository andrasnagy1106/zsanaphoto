import { getPhotoOrderAccessByToken } from "@/lib/services/photo-order-service";
import { getPhotoById } from "@/lib/services/photo-storage-service";

interface CustomerPhotoDownloadContext {
  params: Promise<{ token: string; photoId: string }>;
}

export async function GET(_request: Request, { params }: CustomerPhotoDownloadContext) {
  const { token, photoId } = await params;
  const access = await getPhotoOrderAccessByToken(token);

  if (!access || access.booking.customerPhotoViewMode !== "GALLERY_ONLY") {
    return new Response("Not found", { status: 404 });
  }

  const photo = await getPhotoById(photoId);
  if (!photo || photo.bookingId !== access.booking.id) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const originalResponse = await fetch(photo.secureUrl, { cache: "no-store" });
    if (!originalResponse.ok || !originalResponse.body) {
      return new Response("Photo download unavailable", { status: 502 });
    }

    const safeTitle = photo.title.trim().replace(/[\\/:*?"<>|\r\n]+/g, "-") || "foto";
    const extension = photo.format?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const fileName = `${safeTitle}.${extension}`;
    const headers = new Headers({
      "Content-Type": originalResponse.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const contentLength = originalResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(originalResponse.body, { headers });
  } catch (error) {
    console.error("[customer-photo-download] Failed to fetch original photo:", error);
    return new Response("Photo download unavailable", { status: 502 });
  }
}
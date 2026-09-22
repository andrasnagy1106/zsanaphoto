import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PhotoOrderForm } from "@/components/booking/PhotoOrderForm";
import { resolvePhotoPrices, STOCK_PHOTOS } from "@/lib/photo-order-catalog";
import { getSiteSettings } from "@/lib/services/availability-service";
import {
  getActivePhotoOrderForBooking,
  getPhotoOrderAccessByToken,
} from "@/lib/services/photo-order-service";
import { listPhotosByBookingId } from "@/lib/services/photo-storage-service";

export const metadata: Metadata = {
  title: "Fotók megtekintése és rendelés",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PhotoOrderPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PhotoOrderPage({ searchParams }: PhotoOrderPageProps) {
  const { token } = await searchParams;
  const access = token ? await getPhotoOrderAccessByToken(token) : null;

  if (!access) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase text-accent">Privát fotók</p>
        <h1 className="mt-3 font-display text-3xl">A hozzáférés nem érvényes</h1>
        <p className="mt-4 text-foreground/65">
          Nyisd meg újra a fejlécben a fotórendelést, és add meg az e-mailben kapott PIN-kódot.
        </p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center font-semibold text-accent hover:text-accent-dark">
          Vissza a főoldalra →
        </Link>
      </div>
    );
  }

  // If this event/booking is set to GALLERY_ONLY, redirect to the private gallery view
  if (access.booking.customerPhotoViewMode === "GALLERY_ONLY") {
    redirect(`/fotogaleria?token=${encodeURIComponent(token!)}`);
  }

  const [activeOrder, settings, uploadedPhotos] = await Promise.all([
    getActivePhotoOrderForBooking(access.booking.id),
    getSiteSettings(),
    listPhotosByBookingId(access.booking.id),
  ]);

  const prices = resolvePhotoPrices(
    access.booking.customPhotoPrices,
    settings.defaultPhotoPrices,
  );

  const photos =
    uploadedPhotos.length > 0
      ? uploadedPhotos.map((p) => ({
          id: p.id,
          title: p.title,
          src: p.watermarkedUrl,
          alt: p.title,
        }))
      : STOCK_PHOTOS.map((p) => ({
          id: p.id,
          title: p.title,
          src: p.src,
          alt: p.alt,
        }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <PhotoOrderForm
        accessToken={token!}
        customerName={access.booking.customerName}
        bookingNumber={access.booking.bookingNumber}
        pin={access.booking.pin ?? undefined}
        photos={photos}
        isRealEventPhotos={uploadedPhotos.length > 0}
        prices={prices}
        initialOrder={activeOrder ? {
          orderNumber: activeOrder.order.orderNumber,
          notes: activeOrder.order.notes,
          items: activeOrder.items,
        } : undefined}
      />
    </div>
  );
}
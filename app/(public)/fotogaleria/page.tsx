import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrivateCustomerGallery } from "@/components/public/PrivateCustomerGallery";
import { getPhotoOrderAccessByToken } from "@/lib/services/photo-order-service";
import { listPhotosByBookingId } from "@/lib/services/photo-storage-service";

export const metadata: Metadata = {
  title: "Privát képgaléria",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PhotoGalleryPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PhotoGalleryPage({ searchParams }: PhotoGalleryPageProps) {
  const { token } = await searchParams;
  const access = token ? await getPhotoOrderAccessByToken(token) : null;

  if (!access) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase text-accent">Privát fotók</p>
        <h1 className="mt-3 font-display text-3xl">A hozzáférés nem érvényes</h1>
        <p className="mt-4 text-foreground/65">
          Nyisd meg újra a fejlécben a fotórendelést / galériát, és add meg az e-mailben kapott PIN-kódot.
        </p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center font-semibold text-accent hover:text-accent-dark">
          Vissza a főoldalra →
        </Link>
      </div>
    );
  }

  // Security check: if customerPhotoViewMode is ORDER_ONLY, they are forbidden from the full gallery view and must be redirected to the order page
  if (access.booking.customerPhotoViewMode !== "GALLERY_ONLY") {
    redirect(`/fotorendeles?token=${encodeURIComponent(token!)}`);
  }

  const photos = await listPhotosByBookingId(access.booking.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <PrivateCustomerGallery
        customerName={access.booking.customerName}
        bookingNumber={access.booking.bookingNumber}
        pin={access.booking.pin!}
        serviceName={access.service.name}
        photos={photos}
      />
    </div>
  );
}

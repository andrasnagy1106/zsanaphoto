import type { Metadata } from "next";
import Link from "next/link";
import { PhotoOrderForm } from "@/components/booking/PhotoOrderForm";
import { resolvePhotoPrices } from "@/lib/photo-order-catalog";
import { getSiteSettings } from "@/lib/services/availability-service";
import {
  getActivePhotoOrderForBooking,
  getPhotoOrderAccessByToken,
} from "@/lib/services/photo-order-service";

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

  const [activeOrder, settings] = await Promise.all([
    getActivePhotoOrderForBooking(access.booking.id),
    getSiteSettings(),
  ]);
  const prices = resolvePhotoPrices(
    access.booking.customPhotoPrices,
    settings.defaultPhotoPrices,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <PhotoOrderForm
        accessToken={token!}
        customerName={access.booking.customerName}
        bookingNumber={access.booking.bookingNumber}
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
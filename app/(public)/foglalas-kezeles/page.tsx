import type { Metadata } from "next";
import { getBookingByManageToken } from "@/lib/services/booking-service";
import { BookingManagement } from "@/components/booking/BookingManagement";
import { SectionHeading } from "@/components/ui/SectionHeading";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Foglalás kezelése",
  description: "Időpont módosítása vagy lemondása - ZsaNa Photo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ManageBookingPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ManageBookingPage({ searchParams }: ManageBookingPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 text-center">
        <SectionHeading eyebrow="Hiba" title="Hiányzó azonosító" />
        <p className="mt-4 text-foreground/70">
          A megadott link érvénytelen vagy hiányzik belőle a foglalási azonosító token.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  const booking = await getBookingByManageToken(token);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 text-center">
        <SectionHeading eyebrow="Hiba" title="Foglalás nem található" />
        <p className="mt-4 text-foreground/70">
          Nem találtunk foglalást a megadott azonosítóhoz. Lehetséges, hogy a link hibás vagy a foglalás törlésre került.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Kezelés" title="Foglalás részletei" />
      <p className="mt-2 text-center text-sm text-foreground/60">
        Itt ellenőrizheted az időpontodat, vagy szükség esetén módosíthatod illetve lemondhatod a foglalást.
      </p>
      <div className="mt-8">
        <BookingManagement booking={booking} />
      </div>
    </div>
  );
}

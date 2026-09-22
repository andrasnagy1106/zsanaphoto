import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/services/booking-service";
import { getServiceById } from "@/lib/services/service-service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { BookingDetailActions } from "@/components/admin/BookingDetailActions";

interface AdminBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const service = await getServiceById(booking.serviceId);

  return (
    <div>
      <Link href="/admin/bookings" className="text-sm text-foreground/60 hover:text-accent">
        ← Vissza a foglalásokhoz
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-foreground">{booking.bookingNumber}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-foreground/60">Foglalás adatai</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Szolgáltatás</dt>
              <dd className="text-foreground">{service?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">PIN</dt>
              <dd className="font-mono font-semibold text-foreground">{booking.pin ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Dátum</dt>
              <dd className="text-foreground">{formatZonedHungarianDate(booking.startAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Időpont</dt>
              <dd className="text-foreground">
                {formatZonedTime(booking.startAt)} - {formatZonedTime(booking.endAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Létrehozva</dt>
              <dd className="text-foreground">{formatZonedHungarianDate(booking.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Módosítva</dt>
              <dd className="text-foreground">{formatZonedHungarianDate(booking.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-foreground/60">Ügyfél adatai</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Név</dt>
              <dd className="text-foreground">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">E-mail</dt>
              <dd className="text-foreground">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Telefon</dt>
              <dd className="text-foreground">{booking.customerPhone}</dd>
            </div>
            {booking.notes ? (
              <div>
                <dt className="text-foreground/60">Megjegyzés</dt>
                <dd className="mt-1 text-foreground">{booking.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="mt-6">
        <BookingDetailActions booking={booking} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/services/booking-service";
import { getServiceById } from "@/lib/services/service-service";
import { getPhotoOrdersForBooking } from "@/lib/services/photo-order-service";
import { getSiteSettings } from "@/lib/services/availability-service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { formatPrice } from "@/lib/photo-order-catalog";
import { BookingDetailActions } from "@/components/admin/BookingDetailActions";
import { BookingPhotoPricingForm } from "@/components/admin/BookingPhotoPricingForm";
import { PhotoOrderDetailsDialog } from "@/components/admin/PhotoOrderDetailsDialog";
import { PhotoOrderStatusControl } from "@/components/admin/PhotoOrderStatusControl";

interface AdminBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [service, photoOrders, settings] = await Promise.all([
    getServiceById(booking.serviceId),
    getPhotoOrdersForBooking(booking.id),
    getSiteSettings(),
  ]);

  const totalPhotoOrdersRevenue = photoOrders.reduce(
    (sum, o) => sum + (o.order.totalAmount > 0 ? o.order.totalAmount : o.items.reduce((s, i) => s + i.totalPrice, 0)),
    0,
  );

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
              <dd className="font-mono font-semibold text-foreground flex items-center gap-2">
                <span>{booking.pin ?? "-"}</span>
                {booking.pin && (
                  <Link
                    href={`/admin/event-photos?pin=${booking.pin}`}
                    className="text-xs font-sans font-semibold text-accent hover:underline"
                  >
                    (Fotók kezelése →)
                  </Link>
                )}
              </dd>
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
            {booking.childName ? (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Gyermek neve</dt>
                <dd className="text-foreground">{booking.childName}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">E-mail</dt>
              <dd className="text-foreground">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Telefon</dt>
              <dd className="text-foreground">{booking.customerPhone}</dd>
            </div>
            {booking.photoPublicationConsent !== null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Online képmegjelenés</dt>
                <dd className="text-right font-medium text-foreground">
                  {booking.photoPublicationConsent ? "Hozzájárult" : "Nem járult hozzá"}
                </dd>
              </div>
            ) : null}
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

      {/* Event Photo Pricing */}
      <div className="mt-6">
        <BookingPhotoPricingForm
          bookingId={booking.id}
          customPrices={booking.customPhotoPrices}
          defaultSitePrices={settings.defaultPhotoPrices}
        />
      </div>

      {/* Photo Orders for this booking/event */}
      {photoOrders.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Kapcsolódó fotórendelések ({photoOrders.length})</h2>
              <p className="mt-1 text-xs text-foreground/60">
                Ehhez az eseményhez leadott fotórendelések. Összérték: <strong className="text-accent">{formatPrice(totalPhotoOrdersRevenue)}</strong>
              </p>
            </div>
            <Link
              href="/admin/photo-orders"
              className="text-xs font-semibold text-accent hover:text-accent-dark hover:underline"
            >
              Összes fotórendelés →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-border border-t border-border">
            {photoOrders.map((orderRow) => (
              <div key={orderRow.order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <span className="font-mono text-sm font-semibold text-foreground">{orderRow.order.orderNumber}</span>
                  <span className="ml-3 text-xs text-foreground/60">
                    {formatZonedHungarianDate(orderRow.order.createdAt)} {formatZonedTime(orderRow.order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <PhotoOrderDetailsDialog
                    order={orderRow.order}
                    customerName={orderRow.booking.customerName}
                    bookingNumber={orderRow.booking.bookingNumber}
                    items={orderRow.items}
                  />
                  <PhotoOrderStatusControl order={orderRow.order} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

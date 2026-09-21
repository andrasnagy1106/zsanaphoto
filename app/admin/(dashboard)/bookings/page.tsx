import Link from "next/link";
import { listBookings } from "@/lib/services/booking-service";
import { listServices } from "@/lib/services/service-service";
import { AdminTable } from "@/components/admin/AdminTable";
import { BookingRowActions } from "@/components/admin/BookingRowActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { Booking } from "@/db/schema";

const STATUS_OPTIONS: { value: Booking["status"] | ""; label: string }[] = [
  { value: "", label: "Összes státusz" },
  { value: "PENDING", label: "Függőben" },
  { value: "CONFIRMED", label: "Megerősítve" },
  { value: "CANCELLED", label: "Lemondva" },
  { value: "COMPLETED", label: "Teljesítve" },
];

interface AdminBookingsPageProps {
  searchParams: Promise<{ status?: string; serviceId?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const status = params.status as Booking["status"] | undefined;
  const serviceId = params.serviceId;

  const [bookings, services] = await Promise.all([
    listBookings({ status, serviceId }),
    listServices(),
  ]);

  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (serviceId) exportParams.set("serviceId", serviceId);
  const exportUrl = `/api/admin/bookings/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Foglalások</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Összesen {bookings.length} foglalás a kiválasztott szűrés szerint.
          </p>
        </div>
        <a
          href={exportUrl}
          download
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportálás Excelbe (CSV)
        </a>
      </div>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="min-h-11 rounded-md border border-border bg-white px-3 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="serviceId"
          defaultValue={serviceId ?? ""}
          className="min-h-11 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Összes szolgáltatás</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-medium">
          Szűrés
        </button>
      </form>

      <div className="mt-6">
        {bookings.length === 0 ? (
          <EmptyState title="Jelenleg nincs foglalás." />
        ) : (
          <AdminTable
            rows={bookings}
            rowKey={(booking) => booking.id}
            columns={[
              {
                key: "number",
                header: "Azonosító",
                render: (b) => (
                  <Link href={`/admin/bookings/${b.id}`} className="font-medium text-accent hover:underline">
                    {b.bookingNumber}
                  </Link>
                ),
              },
              { key: "date", header: "Dátum", render: (b) => formatZonedHungarianDate(b.startAt) },
              { key: "time", header: "Időpont", render: (b) => `${formatZonedTime(b.startAt)} - ${formatZonedTime(b.endAt)}` },
              { key: "customer", header: "Ügyfél", render: (b) => b.customerName },
              { key: "service", header: "Szolgáltatás", render: (b) => serviceNameById.get(b.serviceId) ?? "-" },
              { key: "status", header: "Státusz", render: (b) => <StatusBadge status={b.status} /> },
              { key: "actions", header: "Műveletek", render: (b) => <BookingRowActions booking={b} /> },
            ]}
            mobileCard={(b) => (
              <div>
                <div className="flex items-center justify-between">
                  <Link href={`/admin/bookings/${b.id}`} className="font-medium text-accent hover:underline">
                    {b.bookingNumber}
                  </Link>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-sm text-foreground/70">{b.customerName}</p>
                <p className="text-sm text-foreground/70">
                  {formatZonedHungarianDate(b.startAt)} · {formatZonedTime(b.startAt)} - {formatZonedTime(b.endAt)}
                </p>
                <p className="text-sm text-foreground/50">{serviceNameById.get(b.serviceId) ?? "-"}</p>
                <div className="mt-3">
                  <BookingRowActions booking={b} />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

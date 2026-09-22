import Link from "next/link";
import { listBookings } from "@/lib/services/booking-service";
import { listServices } from "@/lib/services/service-service";
import { AdminTable } from "@/components/admin/AdminTable";
import { BookingRowActions } from "@/components/admin/BookingRowActions";
import { CreateEventUserModal } from "@/components/admin/CreateEventUserModal";
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

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "startAt-desc", label: "Időpont szerint (legkésőbbi elöl)" },
  { value: "startAt-asc", label: "Időpont szerint (legkorábbi elöl)" },
  { value: "createdAt-desc", label: "Rögzítés ideje szerint (legújabb)" },
  { value: "customerName-asc", label: "Ügyfél neve (A - Z)" },
  { value: "customerName-desc", label: "Ügyfél neve (Z - A)" },
];

interface AdminBookingsPageProps {
  searchParams: Promise<{
    status?: string;
    serviceId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
  }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const status = params.status as Booking["status"] | undefined;
  const serviceId = params.serviceId || undefined;
  const fromDate = params.fromDate || undefined;
  const toDate = params.toDate || undefined;
  const sortBy = params.sortBy || "startAt-desc";

  const [bookings, services] = await Promise.all([
    listBookings({ status, serviceId, fromDate, toDate, sortBy }),
    listServices(),
  ]);

  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (serviceId) exportParams.set("serviceId", serviceId);
  if (fromDate) exportParams.set("fromDate", fromDate);
  if (toDate) exportParams.set("toDate", toDate);
  if (sortBy) exportParams.set("sortBy", sortBy);
  const exportUrl = `/api/admin/bookings/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  const hasActiveFilters = Boolean(status || serviceId || fromDate || toDate || sortBy !== "startAt-desc");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Foglalások</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Összesen {bookings.length} foglalás a kiválasztott szűrés szerint.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CreateEventUserModal services={services} />
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
      </div>

      {/* Filter and Sort bar */}
      <form className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-foreground/70 mb-1">
              Státusz
            </label>
            <select
              id="filter-status"
              name="status"
              defaultValue={status ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-service" className="block text-xs font-medium text-foreground/70 mb-1">
              Szolgáltatás
            </label>
            <select
              id="filter-service"
              name="serviceId"
              defaultValue={serviceId ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">Összes szolgáltatás</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-fromDate" className="block text-xs font-medium text-foreground/70 mb-1">
              Kezdő dátum (tól)
            </label>
            <input
              id="filter-fromDate"
              type="date"
              name="fromDate"
              defaultValue={fromDate ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filter-toDate" className="block text-xs font-medium text-foreground/70 mb-1">
              Záró dátum (ig)
            </label>
            <input
              id="filter-toDate"
              type="date"
              name="toDate"
              defaultValue={toDate ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filter-sortBy" className="block text-xs font-medium text-foreground/70 mb-1">
              Rendezés
            </label>
            <select
              id="filter-sortBy"
              name="sortBy"
              defaultValue={sortBy}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm font-medium"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          {hasActiveFilters ? (
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-foreground/60 hover:text-accent hover:underline"
            >
              ✕ Szűrők törlése
            </Link>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="min-h-9 rounded-md bg-accent px-5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Szűrés és Rendezés
          </button>
        </div>
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
              { key: "pin", header: "PIN", render: (b) => <span className="font-mono">{b.pin ?? "-"}</span> },
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
                <p className="font-mono text-sm text-foreground/70">PIN: {b.pin ?? "-"}</p>
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

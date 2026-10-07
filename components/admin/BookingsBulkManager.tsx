"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Booking } from "@/db/schema";
import { bulkDeleteBookingsAction } from "@/app/actions/admin-booking-actions";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { AdminTable } from "./AdminTable";
import { BookingRowActions } from "./BookingRowActions";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface BookingListItem {
  booking: Pick<Booking, "id" | "bookingNumber" | "pin" | "startAt" | "endAt" | "customerName" | "serviceId" | "status">;
  serviceName: string;
}

export function BookingsBulkManager({ bookings }: { bookings: BookingListItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const allSelected = bookings.length > 0 && bookings.every(({ booking }) => selectedIds.has(booking.id));
  const selectedCount = bookings.filter(({ booking }) => selectedIds.has(booking.id)).length;

  function toggleBookingSelection(bookingId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  }

  function toggleAllDisplayedBookings() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) bookings.forEach(({ booking }) => next.delete(booking.id));
      else bookings.forEach(({ booking }) => next.add(booking.id));
      return next;
    });
  }

  function deleteSelectedBookings() {
    const bookingIds = bookings.map(({ booking }) => booking.id).filter((id) => selectedIds.has(id));
    if (bookingIds.length === 0) return;
    if (!window.confirm(
      `${bookingIds.length} kijelölt foglalás véglegesen törlődik a hozzájuk tartozó ügyféladatokkal, képekkel és fotórendelésekkel együtt. Az ügyfelek nem kapnak e-mailt. Ha lemondási értesítést szeretnél küldeni, a foglalásokat külön, a Lemondás gombbal mondd le. A törlés nem vonható vissza. Folytatod?`,
    )) return;

    setMessage(null);
    startTransition(async () => {
      const result = await bulkDeleteBookingsAction({ bookingIds });
      if (!result.success) {
        setMessage(result.error ?? "A kijelölt foglalások törlése nem sikerült.");
        return;
      }
      setSelectedIds(new Set());
      setMessage(`${result.deletedCount ?? 0} foglalás véglegesen törölve.`);
      router.refresh();
    });
  }

  function renderBookingSelection(booking: BookingListItem["booking"]) {
    return (
      <input
        type="checkbox"
        checked={selectedIds.has(booking.id)}
        disabled={isPending}
        onChange={() => toggleBookingSelection(booking.id)}
        aria-label={`${booking.bookingNumber} foglalás kijelölése`}
        className="size-4 cursor-pointer accent-accent disabled:cursor-not-allowed"
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={isPending || bookings.length === 0}
            onChange={toggleAllDisplayedBookings}
            aria-label="Az összes megjelenített foglalás kijelölése"
            className="size-4 cursor-pointer accent-accent disabled:cursor-not-allowed"
          />
          Összes megjelenített kijelölése
        </label>
        {selectedCount > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={deleteSelectedBookings}
            className="min-h-10 cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Törlés folyamatban..." : `Kijelöltek végleges törlése (${selectedCount})`}
          </button>
        ) : null}
      </div>
      {message ? <p role="status" className="mb-3 text-sm text-foreground/75">{message}</p> : null}
      <AdminTable
        rows={bookings}
        rowKey={(row) => row.booking.id}
        columns={[
          { key: "select", header: "", render: (row) => renderBookingSelection(row.booking) },
          {
            key: "number",
            header: "Azonosító",
            render: (row) => <Link href={`/admin/bookings/${row.booking.id}`} className="font-medium text-accent hover:underline">{row.booking.bookingNumber}</Link>,
          },
          { key: "pin", header: "PIN", render: (row) => <span className="font-mono">{row.booking.pin ?? "-"}</span> },
          { key: "date", header: "Dátum", render: (row) => formatZonedHungarianDate(row.booking.startAt) },
          { key: "time", header: "Időpont", render: (row) => `${formatZonedTime(row.booking.startAt)} - ${formatZonedTime(row.booking.endAt)}` },
          { key: "customer", header: "Ügyfél", render: (row) => row.booking.customerName },
          { key: "service", header: "Szolgáltatás", render: (row) => row.serviceName },
          { key: "status", header: "Státusz", render: (row) => <StatusBadge status={row.booking.status} /> },
          { key: "actions", header: "Műveletek", render: (row) => <BookingRowActions booking={row.booking} /> },
        ]}
        mobileCard={(row) => (
          <div>
            <div className="flex items-start justify-between gap-3">
              {renderBookingSelection(row.booking)}
              <div className="min-w-0 flex-1">
                <Link href={`/admin/bookings/${row.booking.id}`} className="font-medium text-accent hover:underline">{row.booking.bookingNumber}</Link>
                <p className="mt-1 text-sm text-foreground/70">{row.booking.customerName}</p>
                <p className="font-mono text-sm text-foreground/70">PIN: {row.booking.pin ?? "-"}</p>
                <p className="text-sm text-foreground/70">{formatZonedHungarianDate(row.booking.startAt)} · {formatZonedTime(row.booking.startAt)} - {formatZonedTime(row.booking.endAt)}</p>
                <p className="text-sm text-foreground/50">{row.serviceName}</p>
              </div>
              <StatusBadge status={row.booking.status} />
            </div>
            <div className="mt-3"><BookingRowActions booking={row.booking} /></div>
          </div>
        )}
      />
    </div>
  );
}
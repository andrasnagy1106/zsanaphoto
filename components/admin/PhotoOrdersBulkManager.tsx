"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Booking, PhotoOrder, PhotoOrderItem, Service } from "@/db/schema";
import { bulkDeletePhotoOrdersAction } from "@/app/actions/photo-order-actions";
import { AdminTable } from "./AdminTable";
import { PhotoOrderDetailsDialog } from "./PhotoOrderDetailsDialog";
import { PhotoOrderStatusControl } from "./PhotoOrderStatusControl";
import { formatPrice } from "@/lib/photo-order-catalog";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";

export interface PhotoOrderListItem {
  order: Pick<PhotoOrder, "id" | "orderNumber" | "status" | "createdAt" | "totalAmount" | "includesDigital" | "notes" | "billingName" | "billingPostalCode" | "billingCity" | "billingAddress">;
  booking: Pick<Booking, "customerName" | "customerEmail" | "bookingNumber">;
  service: Pick<Service, "name">;
  items: Array<Pick<PhotoOrderItem, "id" | "photoId" | "photoTitle" | "size" | "quantity" | "unitPrice" | "totalPrice">>;
}

export function PhotoOrdersBulkManager({ orders }: { orders: PhotoOrderListItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const allSelected = orders.length > 0 && orders.every(({ order }) => selectedIds.has(order.id));

  function toggleOrderSelection(orderId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function toggleAllOrderSelections() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) orders.forEach(({ order }) => next.delete(order.id));
      else orders.forEach(({ order }) => next.add(order.id));
      return next;
    });
  }

  function deleteSelectedOrders() {
    const orderIds = orders.map(({ order }) => order.id).filter((orderId) => selectedIds.has(orderId));
    if (orderIds.length === 0) return;
    const confirmed = window.confirm(
      `${orderIds.length} kijelölt fotórendelés és a hozzájuk tartozó tételek véglegesen törlődnek. A foglalások és képek megmaradnak. A várakozó értesítő e-mailek törlődnek, a már elküldött e-mailek nem vonhatók vissza. Folytatod?`,
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      const result = await bulkDeletePhotoOrdersAction({ orderIds });
      if (!result.success) {
        setMessage(result.error ?? "A kijelölt rendelések törlése nem sikerült.");
        return;
      }
      setSelectedIds(new Set());
      setMessage(`${result.deletedCount ?? 0} rendelés törölve.`);
      router.refresh();
    });
  }

  function renderOrderSelection(order: PhotoOrderListItem["order"]) {
    return (
      <input
        type="checkbox"
        checked={selectedIds.has(order.id)}
        disabled={isPending}
        onChange={() => toggleOrderSelection(order.id)}
        aria-label={`${order.orderNumber} rendelés kijelölése`}
        className="size-4 cursor-pointer accent-accent disabled:cursor-not-allowed"
      />
    );
  }

  function renderOrderDetails(row: PhotoOrderListItem) {
    return (
      <PhotoOrderDetailsDialog
        order={row.order}
        customerName={row.booking.customerName}
        bookingNumber={row.booking.bookingNumber}
        items={row.items}
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
            disabled={isPending || orders.length === 0}
            onChange={toggleAllOrderSelections}
            aria-label="Az összes megjelenített rendelés kijelölése"
            className="size-4 cursor-pointer accent-accent disabled:cursor-not-allowed"
          />
          Összes megjelenített kijelölése
        </label>
        {selectedIds.size > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={deleteSelectedOrders}
            className="min-h-10 cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Törlés folyamatban..." : `Kijelöltek törlése (${selectedIds.size})`}
          </button>
        ) : null}
      </div>
      {message ? <p role="status" className="mb-3 text-sm text-foreground/75">{message}</p> : null}
      <AdminTable
        rows={orders}
        rowKey={(row) => row.order.id}
        columns={[
          { key: "select", header: "", render: (row) => renderOrderSelection(row.order) },
          { key: "number", header: "Rendelés", render: (row) => <span className="font-mono font-medium">{row.order.orderNumber}</span> },
          { key: "booking", header: "Foglalás", render: (row) => <span className="font-mono">{row.booking.bookingNumber}</span> },
          { key: "customer", header: "Ügyfél", render: (row) => <span>{row.booking.customerName}<br /><span className="text-xs text-foreground/55">{row.booking.customerEmail}</span></span> },
          { key: "service", header: "Szolgáltatás", render: (row) => row.service.name },
          { key: "items", header: "Tételek & Összeg", render: renderOrderDetails },
          { key: "created", header: "Érkezett", render: (row) => `${formatZonedHungarianDate(row.order.createdAt)} ${formatZonedTime(row.order.createdAt)}` },
          { key: "status", header: "Állapot", render: (row) => <PhotoOrderStatusControl order={row.order} /> },
          { key: "total", header: "Összeg", render: (row) => formatPrice(row.order.totalAmount || row.items.reduce((sum, item) => sum + item.totalPrice, 0)) },
        ]}
        mobileCard={(row) => (
          <div>
            <div className="flex items-start justify-between gap-3">
              {renderOrderSelection(row.order)}
              <div className="min-w-0 flex-1">
                <p className="font-mono font-medium">{row.order.orderNumber}</p>
                <p className="mt-1 text-sm text-foreground/70">{row.booking.customerName}</p>
                <p className="text-xs text-foreground/50">{row.booking.bookingNumber} · {row.service.name}</p>
              </div>
              <PhotoOrderStatusControl order={row.order} />
            </div>
            <div className="mt-4 border-t border-border pt-3">{renderOrderDetails(row)}</div>
          </div>
        )}
      />
    </div>
  );
}
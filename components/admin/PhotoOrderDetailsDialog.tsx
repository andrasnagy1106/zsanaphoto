"use client";

import { useRef } from "react";
import type { PhotoOrder, PhotoOrderItem } from "@/db/schema";
import { formatPrice } from "@/lib/photo-order-catalog";

interface PhotoOrderDetailsDialogProps {
  order: Pick<PhotoOrder, "orderNumber" | "notes" | "totalAmount">;
  customerName: string;
  bookingNumber: string;
  items: Array<Pick<PhotoOrderItem, "id" | "photoId" | "photoTitle" | "size" | "quantity" | "unitPrice" | "totalPrice">>;
}

export function PhotoOrderDetailsDialog({
  order,
  customerName,
  bookingNumber,
  items,
}: PhotoOrderDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoCount = new Set(items.map((item) => item.photoId)).size;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = order.totalAmount > 0
    ? order.totalAmount
    : items.reduce((sum, item) => sum + item.totalPrice, 0);

  function openPhotoOrderDetails() {
    dialogRef.current?.showModal();
  }

  function closePhotoOrderDetails() {
    dialogRef.current?.close();
  }

  return (
    <>
      <div>
        <p className="text-sm font-medium text-foreground">
          {photoCount} kép · {totalQuantity} db
        </p>
        <p className="text-xs font-semibold text-accent">
          {formatPrice(totalAmount)}
        </p>
        <button
          type="button"
          onClick={openPhotoOrderDetails}
          className="mt-1 min-h-8 cursor-pointer text-xs font-semibold text-accent hover:text-accent-dark hover:underline block"
        >
          Részletek
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-lg border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45"
        onClick={(event) => {
          if (event.target === dialogRef.current) closePhotoOrderDetails();
        }}
      >
        <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Fotórendelés részletei</p>
              <h2 className="mt-2 font-mono text-xl font-semibold sm:text-2xl">{order.orderNumber}</h2>
              <p className="mt-2 text-sm text-foreground/60">
                {customerName} · {bookingNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={closePhotoOrderDetails}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-2xl text-foreground/60 hover:bg-muted hover:text-foreground"
              aria-label="Részletek bezárása"
            >
              ×
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_3.5rem_5rem] gap-2 sm:gap-3 border-b border-border bg-muted/40 px-3 sm:px-4 py-3 text-xs font-semibold text-foreground/60">
              <span>Fotó</span>
              <span>Méret</span>
              <span className="text-right">Egységár</span>
              <span className="text-right">Db</span>
              <span className="text-right">Összeg</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_3.5rem_5rem] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-sm"
                >
                  <span className="font-medium truncate">{item.photoTitle}</span>
                  <span className="text-foreground/70 text-xs sm:text-sm">{item.size}</span>
                  <span className="text-right text-xs sm:text-sm text-foreground/70">{formatPrice(item.unitPrice)}</span>
                  <span className="text-right font-medium text-xs sm:text-sm">{item.quantity} db</span>
                  <span className="text-right font-semibold text-xs sm:text-sm text-accent">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/25 px-4 py-3 text-sm font-semibold">
              <span>Összesen ({totalQuantity} db)</span>
              <span className="text-base font-bold text-accent">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-white p-4">
            <p className="text-xs font-semibold uppercase text-foreground/50">Megjegyzés</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
              {order.notes ?? "Nincs megjegyzés."}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
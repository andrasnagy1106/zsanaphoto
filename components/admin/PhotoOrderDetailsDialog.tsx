"use client";

import { useRef } from "react";
import type { PhotoOrder, PhotoOrderItem } from "@/db/schema";
import { formatPrice } from "@/lib/photo-order-catalog";

interface PhotoOrderDetailsDialogProps {
  order: Pick<
    PhotoOrder,
    "orderNumber" | "notes" | "totalAmount" | "billingName" | "billingPostalCode" | "billingCity" | "billingAddress"
  > & { includesDigital?: boolean | null };
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
        {order.includesDigital && (
          <span className="inline-block mt-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
            + Digitális változat
          </span>
        )}
        <p className="text-xs font-semibold text-accent mt-0.5">
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

          {order.includesDigital && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-foreground/80">
              <strong className="text-accent font-semibold block mb-0.5">Digitális változat kérve</strong>
              Kinyomtatott képek ebben a fotócsomagban nem készülnek (ha nincs papírkép választva), csak digitálisan átadott, megszerkesztett képek online galériában. Szabadon felhasználható, sokszorosítási lehetőség.
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_3.5rem_5rem] gap-2 sm:gap-3 border-b border-border bg-muted/40 px-3 sm:px-4 py-3 text-xs font-semibold text-foreground/60">
              <span>Fotó / Tétel</span>
              <span>Típus</span>
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
              {order.includesDigital && (
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_3.5rem_5rem] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-sm bg-accent/5">
                  <span className="font-medium text-foreground">Digitális változat</span>
                  <span className="text-accent text-xs sm:text-sm font-semibold">Online galéria</span>
                  <span className="text-right text-xs sm:text-sm text-foreground/70">-</span>
                  <span className="text-right font-medium text-xs sm:text-sm">1 csomag</span>
                  <span className="text-right font-semibold text-xs sm:text-sm text-accent">
                    {formatPrice(Math.max(0, totalAmount - items.reduce((sum, item) => sum + item.totalPrice, 0)))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/25 px-4 py-3 text-sm font-semibold">
              <span>Összesen {totalQuantity > 0 ? `(${totalQuantity} db papírkép${order.includesDigital ? ' + digitális' : ''})` : '(digitális csomag)'}</span>
              <span className="text-base font-bold text-accent">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {(order.billingName || order.billingAddress) && (
            <div className="mt-5 rounded-lg border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase text-foreground/50">Számlázási adatok</p>
              <div className="mt-2 text-sm text-foreground/80 space-y-1">
                {order.billingName && (
                  <p>
                    <span className="text-foreground/50">Név:</span> <strong>{order.billingName}</strong>
                  </p>
                )}
                {(order.billingPostalCode || order.billingCity || order.billingAddress) && (
                  <p>
                    <span className="text-foreground/50">Cím:</span>{" "}
                    {[order.billingPostalCode, order.billingCity].filter(Boolean).join(" ")}
                    {order.billingAddress ? `, ${order.billingAddress}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}

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
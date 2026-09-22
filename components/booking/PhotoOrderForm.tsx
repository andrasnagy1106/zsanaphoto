"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { savePhotoOrderAction } from "@/app/actions/photo-order-actions";
import {
  DEFAULT_PHOTO_PRICES,
  PHOTO_PRINT_SIZES,
  STOCK_PHOTOS,
  formatPrice,
  type PhotoPrintSize,
} from "@/lib/photo-order-catalog";

interface PhotoOrderFormProps {
  accessToken: string;
  customerName: string;
  bookingNumber: string;
  prices?: Record<PhotoPrintSize, number>;
  initialOrder?: {
    orderNumber: string;
    notes: string | null;
    items: Array<{ photoId: string; size: string; quantity: number }>;
  };
}

function getQuantityKey(photoId: string, size: string): string {
  return `${photoId}:${size}`;
}

function buildInitialQuantities(initialOrder: PhotoOrderFormProps["initialOrder"]): Record<string, number> {
  return Object.fromEntries(
    (initialOrder?.items ?? []).map((item) => [getQuantityKey(item.photoId, item.size), item.quantity]),
  );
}

export function PhotoOrderForm({
  accessToken,
  customerName,
  bookingNumber,
  prices = DEFAULT_PHOTO_PRICES,
  initialOrder,
}: PhotoOrderFormProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => buildInitialQuantities(initialOrder));
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState(initialOrder?.orderNumber ?? null);
  const [savedOrder, setSavedOrder] = useState<{
    orderNumber: string;
    wasUpdated: boolean;
    totalQuantity: number;
    totalAmount: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calculate per-size totals and grand totals
  const sizeBreakdown = PHOTO_PRINT_SIZES.map((size) => {
    const count = STOCK_PHOTOS.reduce((sum, photo) => {
      return sum + (quantities[getQuantityKey(photo.id, size)] ?? 0);
    }, 0);
    const unitPrice = prices[size] ?? 0;
    const subtotal = count * unitPrice;
    return { size, count, unitPrice, subtotal };
  });

  const activeSizeBreakdown = sizeBreakdown.filter((item) => item.count > 0);
  const totalQuantity = sizeBreakdown.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = sizeBreakdown.reduce((sum, item) => sum + item.subtotal, 0);

  function updatePhotoQuantity(photoId: string, size: string, quantity: number) {
    const key = getQuantityKey(photoId, size);
    setQuantities((current) => ({ ...current, [key]: Math.max(0, Math.min(99, quantity || 0)) }));
  }

  function submitPhotoOrder() {
    const items = STOCK_PHOTOS.flatMap((photo) =>
      PHOTO_PRINT_SIZES.flatMap((size) => {
        const quantity = quantities[getQuantityKey(photo.id, size)] ?? 0;
        return quantity > 0 ? [{ photoId: photo.id, size, quantity }] : [];
      }),
    );

    if (items.length === 0) {
      setError("Adj meg legalább egy darabot valamelyik képből.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await savePhotoOrderAction({ accessToken, notes, items });
      if (!result.success || !result.orderNumber) {
        setError(result.error ?? "A rendelés nem sikerült.");
        return;
      }
      setActiveOrderNumber(result.orderNumber);
      setSavedOrder({
        orderNumber: result.orderNumber,
        wasUpdated: result.wasUpdated ?? false,
        totalQuantity,
        totalAmount,
      });
    });
  }

  if (savedOrder) {
    return (
      <div className="border-y border-border bg-white px-5 py-12 text-center sm:px-8">
        <p className="text-sm font-semibold uppercase text-accent">
          {savedOrder.wasUpdated ? "Rendelés módosítva" : "Rendelés rögzítve"}
        </p>
        <h1 className="mt-3 font-display text-3xl">Köszönjük, {customerName}!</h1>
        <p className="mt-4 text-foreground/70">A visszaigazolást elküldtük e-mailben.</p>
        <p className="mt-3 font-mono text-lg font-semibold">{savedOrder.orderNumber}</p>
        <p className="mt-2 text-sm text-foreground/80 font-medium">
          Összesen {savedOrder.totalQuantity} db kép · Végösszeg: {formatPrice(savedOrder.totalAmount)}
        </p>
        <button
          type="button"
          onClick={() => setSavedOrder(null)}
          className="mt-7 min-h-11 rounded-full border border-accent px-6 py-3 text-sm font-semibold text-accent hover:bg-accent hover:text-white"
        >
          Rendelés módosítása
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold uppercase text-accent">
          {activeOrderNumber ? "Aktív fotórendelés" : "Privát fotórendelés"}
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">
          {activeOrderNumber ? "Rendelés módosítása" : "Válaszd ki a képeket"}
        </h1>
        <p className="mt-3 text-foreground/65">
          {customerName} · Foglalás: {bookingNumber}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          A jelenlegi képek bemutató stock fotók. Képenként több méretből is rendelhetsz.
        </p>
        {activeOrderNumber ? (
          <p className="mt-2 font-mono text-sm font-semibold text-foreground/70">{activeOrderNumber}</p>
        ) : null}
      </div>

      {/* Price guide banner */}
      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">Méret- és ártáblázat</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          {PHOTO_PRINT_SIZES.map((size) => (
            <div key={size} className="rounded-md border border-border/60 bg-white p-2.5">
              <span className="font-medium text-foreground block">{size}</span>
              <span className="text-xs font-semibold text-accent block mt-0.5">{formatPrice(prices[size])} / db</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {STOCK_PHOTOS.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-lg border border-border bg-white flex flex-col justify-between">
            <div>
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
              </div>
              <div className="p-4">
                <h2 className="font-display text-xl">{photo.title}</h2>
                <div className="mt-4 space-y-2.5">
                  {PHOTO_PRINT_SIZES.map((size) => {
                    const qty = quantities[getQuantityKey(photo.id, size)] ?? 0;
                    const unitPrice = prices[size] ?? 0;
                    return (
                      <div key={size} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-border/40 last:border-0">
                        <div className="min-w-0">
                          <span className="font-medium block truncate">{size}</span>
                          <span className="text-xs text-foreground/60">{formatPrice(unitPrice)} / db</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {qty > 0 && (
                            <span className="text-xs font-semibold text-accent hidden sm:inline">
                              {formatPrice(qty * unitPrice)}
                            </span>
                          )}
                          <input
                            type="number"
                            min={0}
                            max={99}
                            inputMode="numeric"
                            aria-label={`${photo.title}, ${size} darabszám`}
                            value={qty}
                            onChange={(event) => updatePhotoQuantity(photo.id, size, Number(event.target.value))}
                            className="min-h-10 w-16 rounded-md border border-border px-2 text-center outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 max-w-2xl">
        <label htmlFor="photo-order-notes" className="text-sm font-medium text-foreground">
          Megjegyzés a rendeléshez (opcionális)
        </label>
        <textarea
          id="photo-order-notes"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Például: a testvérek képei egy csomagba kerüljenek."
          className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Sticky footer with continuous live breakdown & total price */}
      <div className="sticky bottom-4 mt-8 rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm text-foreground/60">Kiválasztva:</span>
              <span className="font-display text-2xl font-semibold text-foreground">{totalQuantity} db</span>
              <span className="text-sm text-foreground/40 hidden sm:inline">|</span>
              <span className="text-sm text-foreground/60">Végösszeg:</span>
              <span className="font-display text-2xl font-bold text-accent">{formatPrice(totalAmount)}</span>
            </div>

            {/* Continuous per-size breakdown */}
            {activeSizeBreakdown.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                {activeSizeBreakdown.map((item) => (
                  <span
                    key={item.size}
                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-foreground/80 font-medium border border-border/50"
                  >
                    <span>{item.size}:</span>
                    <strong className="text-foreground">{item.count} db</strong>
                    <span className="text-foreground/60">({formatPrice(item.subtotal)})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground/50">Még nincs fotó kiválasztva.</p>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t border-border/60 lg:border-t-0">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={submitPhotoOrder}
              disabled={isPending || totalQuantity === 0}
              className="min-h-11 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            >
              {isPending
                ? "Mentés..."
                : activeOrderNumber
                  ? "Módosítások mentése"
                  : "Rendelés véglegesítése"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
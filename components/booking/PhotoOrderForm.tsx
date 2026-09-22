"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { savePhotoOrderAction } from "@/app/actions/photo-order-actions";
import { PHOTO_PRINT_SIZES, STOCK_PHOTOS } from "@/lib/photo-order-catalog";

interface PhotoOrderFormProps {
  accessToken: string;
  customerName: string;
  bookingNumber: string;
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
  initialOrder,
}: PhotoOrderFormProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => buildInitialQuantities(initialOrder));
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState(initialOrder?.orderNumber ?? null);
  const [savedOrder, setSavedOrder] = useState<{ orderNumber: string; wasUpdated: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalQuantity = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

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
      setSavedOrder({ orderNumber: result.orderNumber, wasUpdated: result.wasUpdated ?? false });
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

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {STOCK_PHOTOS.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
            </div>
            <div className="p-4">
              <h2 className="font-display text-xl">{photo.title}</h2>
              <div className="mt-4 space-y-2">
                {PHOTO_PRINT_SIZES.map((size) => (
                  <label key={size} className="grid grid-cols-[1fr_5rem] items-center gap-3 text-sm">
                    <span>{size}</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      inputMode="numeric"
                      aria-label={`${photo.title}, ${size} darabszám`}
                      value={quantities[getQuantityKey(photo.id, size)] ?? 0}
                      onChange={(event) => updatePhotoQuantity(photo.id, size, Number(event.target.value))}
                      className="min-h-10 w-full rounded-md border border-border px-3 text-center outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </label>
                ))}
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

      <div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div>
          <p className="text-sm text-foreground/60">Kiválasztott példányszám</p>
          <p className="font-display text-2xl">{totalQuantity} db</p>
        </div>
        <div className="text-right">
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={submitPhotoOrder}
            disabled={isPending || totalQuantity === 0}
            className="min-h-11 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
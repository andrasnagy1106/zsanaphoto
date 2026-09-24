"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { savePhotoOrderAction } from "@/app/actions/photo-order-actions";
import {
  DEFAULT_PHOTO_PRICES,
  PHOTO_PRINT_SIZES,
  STOCK_PHOTOS,
  formatPrice,
  type PhotoPrintSize,
} from "@/lib/photo-order-catalog";
import { getHungarianCityByPostalCode } from "@/lib/utils/hungarian-postal-codes";

export interface PhotoOrderItemDisplay {
  id: string;
  title: string;
  src: string;
  alt?: string;
}

interface PhotoOrderFormProps {
  accessToken: string;
  customerName: string;
  bookingNumber: string;
  pin?: string;
  photos?: PhotoOrderItemDisplay[];
  isRealEventPhotos?: boolean;
  prices?: Record<PhotoPrintSize, number>;
  initialOrder?: {
    orderNumber: string;
    billingName?: string | null;
    billingPostalCode?: string | null;
    billingCity?: string | null;
    billingAddress?: string | null;
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
  pin,
  photos = STOCK_PHOTOS as unknown as PhotoOrderItemDisplay[],
  isRealEventPhotos = false,
  prices = DEFAULT_PHOTO_PRICES,
  initialOrder,
}: PhotoOrderFormProps) {
  const billingNameInputId = useId();
  const billingPostalCodeInputId = useId();
  const billingCityInputId = useId();
  const billingAddressInputId = useId();
  const notesInputId = useId();

  const [quantities, setQuantities] = useState<Record<string, number>>(() => buildInitialQuantities(initialOrder));
  const [billingName, setBillingName] = useState(initialOrder?.billingName ?? customerName);
  const [billingPostalCode, setBillingPostalCode] = useState(initialOrder?.billingPostalCode ?? "");
  const [billingCity, setBillingCity] = useState(initialOrder?.billingCity ?? "");
  const [billingAddress, setBillingAddress] = useState(initialOrder?.billingAddress ?? "");
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState(initialOrder?.orderNumber ?? null);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoOrderItemDisplay | null>(null);
  const [savedOrder, setSavedOrder] = useState<{
    orderNumber: string;
    wasUpdated: boolean;
    totalQuantity: number;
    totalAmount: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calculate per-size totals and grand totals
  const sizeBreakdown = PHOTO_PRINT_SIZES.map((size) => {
    const count = photos.reduce((sum, photo) => {
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

  function handlePostalCodeChange(newPostalCode: string) {
    setBillingPostalCode(newPostalCode);
    const resolvedCity = getHungarianCityByPostalCode(newPostalCode);
    if (resolvedCity) {
      setBillingCity(resolvedCity);
    }
  }

  function submitPhotoOrder() {
    const items = photos.flatMap((photo) =>
      PHOTO_PRINT_SIZES.flatMap((size) => {
        const quantity = quantities[getQuantityKey(photo.id, size)] ?? 0;
        return quantity > 0 ? [{ photoId: photo.id, size, quantity }] : [];
      }),
    );

    if (items.length === 0) {
      setError("Adj meg legalább egy darabot valamelyik képből vagy méretből.");
      return;
    }

    if (!billingName.trim()) {
      setError("Add meg a számlázási nevet.");
      return;
    }

    if (!billingPostalCode.trim()) {
      setError("Add meg az irányítószámot.");
      return;
    }

    if (!billingCity.trim()) {
      setError("Add meg a települést.");
      return;
    }

    if (!billingAddress.trim()) {
      setError("Add meg a számlázási címet (utca, házszám stb.).");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await savePhotoOrderAction({
        accessToken,
        billingName: billingName.trim(),
        billingPostalCode: billingPostalCode.trim(),
        billingCity: billingCity.trim(),
        billingAddress: billingAddress.trim(),
        notes,
        items,
      });
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
        <div className="mt-3 text-sm text-foreground/80 font-medium space-y-1">
          <p>
            Összesen {savedOrder.totalQuantity} db tétel · Végösszeg: {formatPrice(savedOrder.totalAmount)}
          </p>
        </div>
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase text-accent">
            {activeOrderNumber ? "Aktív fotórendelés" : "Privát fotórendelés"}
          </p>
          {pin && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
              PIN: {pin}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">
          {activeOrderNumber ? "Rendelés módosítása" : "Válaszd ki a képeket"}
        </h1>
        <p className="mt-3 text-foreground/65">
          {customerName} · Foglalás: {bookingNumber}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          {isRealEventPhotos
            ? "Az eseményen készült privát fotóid. Kattints a képre a nagyításhoz, és add meg a kívánt méretet/digitális darabszámot."
            : "A jelenlegi képek bemutató stock fotók. Képenként papírképek és digitális változat is rendelhető."}
        </p>
        {activeOrderNumber ? (
          <p className="mt-2 font-mono text-sm font-semibold text-foreground/70">{activeOrderNumber}</p>
        ) : null}
      </div>

      {/* Price guide banner with digital notice */}
      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Méret- és ártáblázat</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 text-sm">
          {PHOTO_PRINT_SIZES.map((size) => (
            <div key={size} className="rounded-md border border-border/60 bg-white p-2.5">
              <span className="font-medium text-foreground block truncate" title={size}>{size}</span>
              <span className="text-xs font-semibold text-accent block mt-0.5">{formatPrice(prices[size])} / db</span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-foreground/80 leading-relaxed">
          <strong className="text-accent font-semibold block mb-0.5">Digitális képekről:</strong>
          Kinyomtatott képek ebben a fotócsomagban nem készülnek, csak digitálisan átadott, megszerkesztett képek, online galériában. Szabadon felhasználható, sokszorosítási lehetőség.
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="my-12 rounded-xl border border-border bg-white p-12 text-center">
          <p className="text-base font-medium text-foreground">Ehhez a galériához még nincsenek feltöltve fotók.</p>
          <p className="mt-2 text-sm text-foreground/60">Kérjük, látogass vissza később, vagy lépj kapcsolatba a fotóssal.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-lg border border-border bg-white flex flex-col justify-between">
              <div>
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="group relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt ?? photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold">
                    Kattints a nagyításhoz 🔍
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-display text-xl truncate" title={photo.title}>{photo.title}</h2>
                  <div className="mt-4 space-y-2.5">
                    {PHOTO_PRINT_SIZES.map((size) => {
                      const qty = quantities[getQuantityKey(photo.id, size)] ?? 0;
                      const unitPrice = prices[size] ?? 0;
                      const isDigital = size === "Digitális kép";
                      return (
                        <div
                          key={size}
                          className={`flex items-center justify-between gap-3 text-sm py-1.5 px-2 rounded-md ${
                            isDigital ? "bg-accent/5 border border-accent/20" : "border-b border-border/40 last:border-0"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className={`font-medium block truncate ${isDigital ? "text-accent font-semibold" : ""}`}>
                              {size}
                            </span>
                            <span className="text-xs text-foreground/60">{formatPrice(unitPrice)} / db</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <span className="text-xs font-semibold text-accent hidden sm:inline">
                                {formatPrice(qty * unitPrice)}
                              </span>
                            )}
                            {isDigital ? (
                              <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-md border border-border hover:border-accent">
                                <input
                                  type="checkbox"
                                  checked={qty > 0}
                                  onChange={(event) =>
                                    updatePhotoQuantity(photo.id, size, event.target.checked ? 1 : 0)
                                  }
                                  className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                                  aria-label={`${photo.title}, digitális kép kérése`}
                                />
                                <span className={`text-xs font-semibold ${qty > 0 ? "text-accent" : "text-foreground/70"}`}>
                                  {qty > 0 ? "Kérve" : "Kérem"}
                                </span>
                              </label>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={99}
                                inputMode="numeric"
                                aria-label={`${photo.title}, ${size} darabszám`}
                                value={qty}
                                onChange={(event) => updatePhotoQuantity(photo.id, size, Number(event.target.value))}
                                className="min-h-10 w-16 rounded-md border border-border px-2 text-center outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                              />
                            )}
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
      )}

      {/* Billing Information Section */}
      <div className="mt-10 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="border-b border-border/60 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Számlázás</p>
          <h2 className="mt-1 font-display text-xl text-foreground">Számlázási adatok</h2>
          <p className="mt-1 text-xs text-foreground/60">
            Kérjük, add meg a számla kiállításához szükséges adatokat.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor={billingNameInputId} className="block text-sm font-medium text-foreground">
              Számlázási név <span className="text-red-500">*</span>
            </label>
            <input
              id={billingNameInputId}
              type="text"
              required
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              placeholder="pl. Kovács Anna vagy Minta Kft."
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={billingPostalCodeInputId} className="block text-sm font-medium text-foreground">
                Irányítószám <span className="text-red-500">*</span>
              </label>
              <input
                id={billingPostalCodeInputId}
                type="text"
                required
                maxLength={10}
                value={billingPostalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                placeholder="pl. 6411"
                className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={billingCityInputId} className="block text-sm font-medium text-foreground">
                Település / Város <span className="text-red-500">*</span>
              </label>
              <input
                id={billingCityInputId}
                type="text"
                required
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                placeholder="pl. Zsana"
                className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor={billingAddressInputId} className="block text-sm font-medium text-foreground">
              Cím (utca, házszám, emelet/ajtó) <span className="text-red-500">*</span>
            </label>
            <input
              id={billingAddressInputId}
              type="text"
              required
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="pl. Kossuth Lajos utca 12. 2/4."
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-2xl">
        <label htmlFor={notesInputId} className="text-sm font-medium text-foreground">
          Megjegyzés a rendeléshez (opcionális)
        </label>
        <textarea
          id={notesInputId}
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
              <span className="font-display text-2xl font-semibold text-foreground">{totalQuantity} db tétel</span>
              <span className="text-sm text-foreground/40 hidden sm:inline">|</span>
              <span className="text-sm text-foreground/60">Végösszeg:</span>
              <span className="font-display text-2xl font-bold text-accent">{formatPrice(totalAmount)}</span>
            </div>

            {/* Continuous per-size breakdown */}
            {activeSizeBreakdown.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs pt-1 items-center">
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
              <p className="text-xs text-foreground/50">Még nincs fotó vagy méret kiválasztva.</p>
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

      {/* Customer Preview Modal */}
      {previewPhoto && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 w-full h-full border-0"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-sm font-semibold text-foreground truncate">{previewPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="relative w-[80vw] max-w-3xl h-[65vh]">
              <Image
                src={previewPhoto.src}
                alt={previewPhoto.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
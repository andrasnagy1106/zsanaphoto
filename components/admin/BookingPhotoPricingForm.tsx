"use client";

import { useState, useTransition } from "react";
import { updateBookingPhotoPricesAction } from "@/app/actions/admin-booking-actions";
import {
  PHOTO_PRICE_KEYS,
  formatPrice,
  resolvePhotoPrices,
  type PhotoPriceKey,
} from "@/lib/photo-order-catalog";

interface BookingPhotoPricingFormProps {
  bookingId: string;
  customPrices?: Partial<Record<PhotoPriceKey, number>> | null;
  defaultSitePrices?: Partial<Record<PhotoPriceKey, number>> | null;
}

export function BookingPhotoPricingForm({
  bookingId,
  customPrices,
  defaultSitePrices,
}: BookingPhotoPricingFormProps) {
  const fallbackPrices = resolvePhotoPrices(defaultSitePrices);
  const [prices, setPrices] = useState<Record<PhotoPriceKey, number>>(() =>
    resolvePhotoPrices(customPrices, defaultSitePrices),
  );
  const [hasCustomPrices, setHasCustomPrices] = useState(
    Boolean(customPrices && Object.keys(customPrices).length > 0),
  );
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handlePriceChange(key: PhotoPriceKey, value: number) {
    setPrices((prev) => ({
      ...prev,
      [key]: Math.max(0, value || 0),
    }));
  }

  function handleSaveCustomPrices(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateBookingPhotoPricesAction({
        bookingId,
        prices,
      });

      if (result.success) {
        setHasCustomPrices(true);
        setStatusMessage({ type: "success", text: "Egyedi árak sikeresen mentve!" });
      } else {
        setStatusMessage({ type: "error", text: result.error ?? "A mentés nem sikerült." });
      }
    });
  }

  function handleResetToDefaults() {
    setStatusMessage(null);
    startTransition(async () => {
      const result = await updateBookingPhotoPricesAction({
        bookingId,
        prices: null,
      });

      if (result.success) {
        setPrices(fallbackPrices);
        setHasCustomPrices(false);
        setStatusMessage({ type: "success", text: "Alapértelmezett árak visszaállítva!" });
      } else {
        setStatusMessage({ type: "error", text: result.error ?? "A visszaállítás nem sikerült." });
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">Fotórendelési árak (Esemény árazása)</h2>
          <p className="mt-1 text-xs text-foreground/60">
            Az ehhez az eseményhez tartozó fotórendelések darabárai és digitális változat ára (Ft).
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            hasCustomPrices
              ? "bg-accent/10 text-accent"
              : "bg-muted text-foreground/70"
          }`}
        >
          {hasCustomPrices ? "Egyedi árazás aktív" : "Alapértelmezett árak"}
        </span>
      </div>

      <form onSubmit={handleSaveCustomPrices} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PHOTO_PRICE_KEYS.map((key) => {
            const isDifferent = prices[key] !== fallbackPrices[key];
            return (
              <div key={key} className="rounded-lg border border-border p-3 bg-muted/20">
                <label htmlFor={`price-${key}`} className="block text-xs font-semibold text-foreground truncate" title={key}>
                  {key}
                </label>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    id={`price-${key}`}
                    type="number"
                    min={0}
                    max={100000}
                    step={10}
                    value={prices[key]}
                    onChange={(e) => handlePriceChange(key, Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-xs font-medium text-foreground/60">Ft</span>
                </div>
                <p className="mt-1 text-[11px] text-foreground/50">
                  Alapért.: {formatPrice(fallbackPrices[key])}
                  {isDifferent && <span className="ml-1 font-semibold text-accent">(mód.)</span>}
                </p>
              </div>
            );
          })}
        </div>

        {statusMessage && (
          <p
            className={`text-xs font-medium ${
              statusMessage.type === "success" ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {statusMessage.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-10 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {isPending ? "Mentés..." : "Egyedi árak mentése"}
          </button>
          {hasCustomPrices && (
            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={isPending}
              className="min-h-10 rounded-md border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Alapértelmezett árak visszaállítása
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

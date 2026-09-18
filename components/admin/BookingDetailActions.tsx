"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelBookingAction,
  completeBookingAction,
  confirmBookingAction,
} from "@/app/actions/admin-booking-actions";
import type { Booking } from "@/db/schema";

export function BookingDetailActions({ booking }: { booking: Pick<Booking, "id" | "status"> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(booking.id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Valami hiba történt.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {booking.status === "PENDING" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(confirmBookingAction)}
            className="min-h-11 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Jóváhagyás
          </button>
        ) : null}
        {(booking.status === "PENDING" || booking.status === "CONFIRMED") ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(cancelBookingAction)}
            className="min-h-11 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Lemondás
          </button>
        ) : null}
        {booking.status === "CONFIRMED" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(completeBookingAction)}
            className="min-h-11 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Teljesítettnek jelölés
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

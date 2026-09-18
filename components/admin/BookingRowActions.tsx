"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction, confirmBookingAction } from "@/app/actions/admin-booking-actions";
import type { Booking } from "@/db/schema";

export function BookingRowActions({ booking }: { booking: Pick<Booking, "id" | "status"> }) {
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
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {booking.status === "PENDING" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(confirmBookingAction)}
            className="min-h-9 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
          >
            Jóváhagyás
          </button>
        ) : null}
        {(booking.status === "PENDING" || booking.status === "CONFIRMED") ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(cancelBookingAction)}
            className="min-h-9 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 disabled:opacity-50"
          >
            Lemondás
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

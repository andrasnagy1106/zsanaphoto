"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBookingAction } from "@/app/actions/admin-booking-actions";

export function DeleteBookingModal({ bookingId, returnToList = false }: {
  bookingId: string;
  returnToList?: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openDeleteConfirmation() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDeleteConfirmation() {
    if (!isPending) dialogRef.current?.close();
  }

  function confirmBookingDeletion() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteBookingAction(bookingId);
        if (!result.success) {
          setError(result.error ?? "A foglalás törlése nem sikerült.");
          return;
        }
        dialogRef.current?.close();
        if (returnToList) router.replace("/admin/bookings");
        router.refresh();
      } catch {
        setError("A törlés eredménye nem ellenőrizhető. Frissítsd az oldalt, mielőtt újrapróbálod.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDeleteConfirmation}
        disabled={isPending}
        className="min-h-9 cursor-pointer rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Törlés
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => { event.preventDefault(); closeDeleteConfirmation(); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeDeleteConfirmation();
          }
        }}
        onClick={(event) => { if (event.target === dialogRef.current) closeDeleteConfirmation(); }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-5 text-left text-foreground shadow-2xl backdrop:bg-black/55 sm:p-7"
      >
        <h2 id={titleId} className="font-display text-xl font-bold">Foglalás végleges törlése?</h2>
        <div id={descriptionId} className="mt-4 space-y-3 text-sm leading-relaxed">
          <p>A foglalás és az összes hozzá kapcsolódó ügyféladat, PIN-kód, kép, fotórendelés, számlázási adat és tárolt e-mail véglegesen törlődik. Ez a művelet nem vonható vissza.</p>
          <p className="font-semibold text-red-700">Az ügyfél nem kap e-mail értesítést. A törlés nem küld e-mailt.</p>
          <p>Ha e-mail értesítést is szeretnél küldeni, törlés helyett használd a Lemondás gombot.</p>
        </div>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" autoFocus disabled={isPending} onClick={closeDeleteConfirmation}
            className="min-h-10 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            Mégse
          </button>
          <button type="button" disabled={isPending} onClick={confirmBookingDeletion}
            className="min-h-10 cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? "Törlés folyamatban..." : "Végleges törlés"}
          </button>
        </div>
      </dialog>
    </>
  );
}
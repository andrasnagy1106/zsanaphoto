"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPhotoOrderPinAction } from "@/app/actions/photo-order-actions";

interface PhotoOrderPinDialogProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function PhotoOrderPinDialog({ mobile = false, onNavigate }: PhotoOrderPinDialogProps) {
  const pinInputId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPhotoOrderPinDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closePhotoOrderPinDialog() {
    dialogRef.current?.close();
  }

  function submitPhotoOrderPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await verifyPhotoOrderPinAction(pin);
      if (!result.success || !result.accessToken) {
        setError(result.error ?? "A PIN ellenőrzése nem sikerült.");
        return;
      }

      closePhotoOrderPinDialog();
      onNavigate?.();
      router.push(result.redirectUrl ?? `/fotorendeles?token=${encodeURIComponent(result.accessToken)}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openPhotoOrderPinDialog}
        className={
          mobile
            ? "flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-accent px-5 py-2.5 text-base font-semibold text-accent"
            : "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        }
      >
        Fotók megtekintése / rendelés
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45"
        onClose={() => {
          setPin("");
          setError(null);
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Privát fotók</p>
              <h2 className="mt-2 font-display text-2xl">Add meg a PIN-kódodat</h2>
            </div>
            <button
              type="button"
              onClick={closePhotoOrderPinDialog}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-2xl text-foreground/60 hover:bg-muted hover:text-foreground"
              aria-label="Ablak bezárása"
            >
              ×
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground/65">
            A foglaláskor e-mailben kapott két betűből és öt számjegyből álló PIN szükséges.
          </p>

          <form onSubmit={submitPhotoOrderPin} className="mt-6">
            <label htmlFor={pinInputId} className="text-sm font-medium">
              PIN-kód
            </label>
            <input
              id={pinInputId}
              value={pin}
              onChange={(event) => setPin(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
              placeholder="AB12345"
              autoComplete="one-time-code"
              className="mt-2 min-h-12 w-full rounded-md border border-border bg-white px-4 font-mono text-lg uppercase tracking-widest outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              required
              pattern="[A-Z]{2}[0-9]{5}"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={isPending}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {isPending ? "Ellenőrzés..." : "Fotók megnyitása"}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
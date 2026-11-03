"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerEmailAction } from "@/app/actions/admin-booking-actions";

export function CustomerEmailEditModal({ bookingId, currentEmail }: {
  bookingId: string;
  currentEmail: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const emailId = useId();
  const confirmEmailId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function close() {
    if (!isPending) dialogRef.current?.close();
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateCustomerEmailAction({
          bookingId,
          currentEmail,
          email: formData.get("email"),
          confirmEmail: formData.get("confirmEmail"),
        });
        if (!result.success) {
          setError(result.error ?? "Az e-mail cím módosítása nem sikerült.");
          return;
        }
        setSuccess(`Az e-mail cím módosítva (${result.updatedCount} foglalás).`);
        dialogRef.current?.close();
        router.refresh();
      } catch (error) {
        console.error("[CustomerEmailEditModal] Failed:", error);
        setError("A módosítás eredménye nem ellenőrizhető. Frissítsd az oldalt, mielőtt újrapróbálod.");
      }
    });
  }

  return (
    <div className="mt-4">
      <button type="button" disabled={isPending} onClick={() => {
        setError(null);
        setSuccess(null);
        formRef.current?.reset();
        dialogRef.current?.showModal();
      }} className="min-h-10 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50">
        E-mail módosítása
      </button>
      {success ? <p role="status" className="mt-2 text-sm text-emerald-700">{success}</p> : null}
      <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClick={(event) => { if (event.target === dialogRef.current) close(); }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-5 text-left text-foreground shadow-2xl backdrop:bg-black/55 sm:p-7">
        <h2 id={titleId} className="font-display text-xl font-bold">Ügyfél e-mail-címének módosítása</h2>
        <div id={descriptionId} className="mt-4 space-y-2 text-sm leading-relaxed">
          <p>Jelenlegi cím: <strong className="break-all">{currentEmail}</strong></p>
          <p>A módosítás minden olyan foglalást érint, amelynél ez az e-mail cím szerepel, akkor is, ha több ügyfél használja közösen.</p>
          <p>A további és a még sorban álló ügyféllevelek az új címre mennek. A PIN-kód és a foglaláskezelő link nem változik. Megerősítő vagy értesítő e-mailt nem küldünk.</p>
        </div>
        <form ref={formRef} onSubmit={(event) => {
          event.preventDefault();
          submit(new FormData(event.currentTarget));
        }} className="mt-5 space-y-4">
          <div>
            <label htmlFor={emailId} className="text-sm font-semibold">Új e-mail cím</label>
            <input id={emailId} name="email" type="email" required maxLength={200} autoComplete="off" autoFocus disabled={isPending}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm disabled:opacity-50" />
          </div>
          <div>
            <label htmlFor={confirmEmailId} className="text-sm font-semibold">Új e-mail cím még egyszer</label>
            <input id={confirmEmailId} name="confirmEmail" type="email" required maxLength={200} autoComplete="off" disabled={isPending}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm disabled:opacity-50" />
          </div>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={isPending} onClick={close}
              className="min-h-10 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">Mégse</button>
            <button type="submit" disabled={isPending}
              className="min-h-10 cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {isPending ? "Mentés folyamatban..." : "Mentés"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

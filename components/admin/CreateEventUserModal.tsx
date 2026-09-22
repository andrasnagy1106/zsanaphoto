"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAdminEventUserAction } from "@/app/actions/admin-booking-actions";
import type { Service } from "@/db/schema";
import { generateBookingPin } from "@/lib/utils/booking-pin";

interface CreateEventUserModalProps {
  services: Service[];
  defaultServiceId?: string;
  onCreated?: (pin: string, bookingId: string) => void;
  triggerButtonText?: string;
  triggerButtonClassName?: string;
}

export function CreateEventUserModal({
  services,
  defaultServiceId,
  onCreated,
  triggerButtonText = "+ Új ügyfél / PIN hozzáadása",
  triggerButtonClassName,
}: CreateEventUserModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const serviceSelectId = useId();
  const nameInputId = useId();
  const emailInputId = useId();
  const phoneInputId = useId();
  const pinInputId = useId();
  const dateInputId = useId();
  const statusSelectId = useId();
  const notesInputId = useId();
  const emailCheckboxId = useId();

  const [serviceId, setServiceId] = useState(defaultServiceId ?? services[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+36 ");
  const [pin, setPin] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"COMPLETED" | "CONFIRMED" | "PENDING">("COMPLETED");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setError(null);
    if (!pin) {
      setPin(generateBookingPin());
    }
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleGenerateNewPin() {
    setPin(generateBookingPin());
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createAdminEventUserAction({
        serviceId,
        customerName,
        customerEmail,
        customerPhone,
        pin: pin ? pin.trim().toUpperCase() : undefined,
        date: date || undefined,
        status,
        notes: notes || undefined,
        sendEmail,
      });

      if (!result.success) {
        setError(result.error ?? "A létrehozás sikertelen.");
        return;
      }

      closeModal();
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("+36 ");
      setPin("");
      setNotes("");

      if (result.pin && result.bookingId) {
        onCreated?.(result.pin, result.bookingId);
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          triggerButtonClassName ??
          "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {triggerButtonText}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/45"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Új regisztráció</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Új ügyfél & PIN létrehozása</h2>
              <p className="mt-1 text-xs text-foreground/60">
                Rendelj hozzá egy új ügyfelet egy eseményhez, és generálj számára privát fotórendelési PIN-kódot.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl text-foreground/60 hover:bg-muted hover:text-foreground"
              aria-label="Ablak bezárása"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            <div>
              <label htmlFor={serviceSelectId} className="block text-xs font-semibold text-foreground">
                Esemény / Szolgáltatás *
              </label>
              <select
                id={serviceSelectId}
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={nameInputId} className="block text-xs font-semibold text-foreground">
                  Ügyfél neve *
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  required
                  placeholder="pl. Kiss Anna"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor={emailInputId} className="block text-xs font-semibold text-foreground">
                  E-mail cím *
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  required
                  placeholder="pl. anna@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={phoneInputId} className="block text-xs font-semibold text-foreground">
                  Telefonszám
                </label>
                <input
                  id={phoneInputId}
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor={dateInputId} className="block text-xs font-semibold text-foreground">
                  Esemény / Fotózás dátuma
                </label>
                <input
                  id={dateInputId}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* PIN code section */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <label htmlFor={pinInputId} className="block text-xs font-semibold text-foreground">
                  Privát fotórendelési PIN-kód *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewPin}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Új PIN generálása 🎲
                </button>
              </div>
              <input
                id={pinInputId}
                type="text"
                required
                maxLength={7}
                placeholder="AB12345"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-base font-bold tracking-widest uppercase outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-[11px] text-foreground/50">
                Formátum: 2 nagybetű és 5 számjegy. Ezzel tud belépni az ügyfél a fotórendelőbe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={statusSelectId} className="block text-xs font-semibold text-foreground">
                  Foglalási állapot
                </label>
                <select
                  id={statusSelectId}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "COMPLETED" | "CONFIRMED" | "PENDING")}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="COMPLETED">Teljesítve (kész, fotórendelésre kész)</option>
                  <option value="CONFIRMED">Megerősítve</option>
                  <option value="PENDING">Függőben</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label htmlFor={emailCheckboxId} className="flex items-center gap-2 cursor-pointer text-xs text-foreground/80 select-none">
                  <input
                    id={emailCheckboxId}
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <span>Értesítő e-mail küldése PIN-nel</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor={notesInputId} className="block text-xs font-semibold text-foreground">
                Megjegyzés (opcionális)
              </label>
              <textarea
                id={notesInputId}
                rows={2}
                maxLength={1000}
                placeholder="pl. Óvodai csoport: Süni csoport, Nagy Ákos szülő"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-10 rounded-md border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="min-h-10 rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50 shadow-sm"
              >
                {isPending ? "Mentés..." : "Ügyfél és PIN mentése"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceAction } from "@/app/actions/admin-service-actions";
import { slugify } from "@/lib/utils/slug";

export function CreateServiceModal() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const nameInputId = useId();
  const slugInputId = useId();
  const descInputId = useId();
  const durationInputId = useId();
  const bufferInputId = useId();
  const approvalSelectId = useId();
  const availSelectId = useId();
  const startInputId = useId();
  const endInputId = useId();
  const activeInputId = useId();
  const requiresChildNameInputId = useId();
  const generatesPinInputId = useId();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [approvalMode, setApprovalMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [availabilityMode, setAvailabilityMode] = useState<"GLOBAL" | "CUSTOM">("GLOBAL");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [requiresChildName, setRequiresChildName] = useState(false);
  const [generatesPin, setGeneratesPin] = useState(false);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createServiceAction({
        name,
        slug: slug.trim() || undefined,
        description,
        durationMinutes,
        bufferMinutes,
        approvalMode,
        availabilityMode,
        dateRangeStart: dateRangeStart || null,
        dateRangeEnd: dateRangeEnd || null,
        requiresChildName,
        generatesPin,
        active,
      });

      if (!result.success) {
        setError(result.error ?? "A szolgáltatás létrehozása nem sikerült.");
        return;
      }

      closeModal();
      setName("");
      setSlug("");
      setDescription("");
      setDateRangeStart("");
      setDateRangeEnd("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
        + Új szolgáltatás / esemény hozzáadása
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/45"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Új szolgáltatás</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
                Új fotózási szolgáltatás vagy esemény
              </h2>
              <p className="mt-1 text-xs text-foreground/60">
                Hozz létre egy új foglalható kategóriát vagy időszakos eseményt.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={nameInputId} className="block text-xs font-semibold text-foreground">
                  Szolgáltatás / Esemény neve *
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  required
                  placeholder="pl. Karácsonyi mini fotózás"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor={slugInputId} className="block text-xs font-semibold text-foreground">
                  URL azonosító (slug)
                </label>
                <input
                  id={slugInputId}
                  type="text"
                  placeholder="automatikusan generálódik"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={approvalSelectId} className="block text-xs font-semibold text-foreground">
                  Jóváhagyás módja
                </label>
                <select
                  id={approvalSelectId}
                  value={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.value as "AUTO" | "MANUAL")}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="AUTO">Automatikus (azonnal visszaigazolt)</option>
                  <option value="MANUAL">Manuális (admin jóváhagyás szükséges)</option>
                </select>
              </div>

              <div>
                <label htmlFor={availSelectId} className="block text-xs font-semibold text-foreground">
                  Elérhetőségi mód
                </label>
                <select
                  id={availSelectId}
                  value={availabilityMode}
                  onChange={(e) => setAvailabilityMode(e.target.value as "GLOBAL" | "CUSTOM")}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="GLOBAL">Általános naptár (heti szabályok)</option>
                  <option value="CUSTOM">Egyedi elérhetőség (esemény-specifikus idősávok)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={durationInputId} className="block text-xs font-semibold text-foreground">
                  Időtartam (perc) *
                </label>
                <input
                  id={durationInputId}
                  type="number"
                  min={5}
                  max={600}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor={bufferInputId} className="block text-xs font-semibold text-foreground">
                  Puffer / szünet (perc)
                </label>
                <input
                  id={bufferInputId}
                  type="number"
                  min={0}
                  max={600}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={startInputId} className="block text-xs font-semibold text-foreground">
                  Érvényesség kezdete (opcionális)
                </label>
                <input
                  id={startInputId}
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor={endInputId} className="block text-xs font-semibold text-foreground">
                  Érvényesség vége (opcionális)
                </label>
                <input
                  id={endInputId}
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label htmlFor={descInputId} className="block text-xs font-semibold text-foreground">
                Leírás
              </label>
              <textarea
                id={descInputId}
                rows={3}
                placeholder="Rövid tájékoztató az ügyfeleknek a fotózásról..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id={activeInputId}
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <label htmlFor={activeInputId} className="text-xs font-medium text-foreground cursor-pointer select-none">
                Aktív (azonnal megjelenik a foglalási listában)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id={requiresChildNameInputId}
                type="checkbox"
                checked={requiresChildName}
                onChange={(e) => setRequiresChildName(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <label
                htmlFor={requiresChildNameInputId}
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Kérje be a gyermek nevét is a foglalási űrlapon
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id={generatesPinInputId}
                type="checkbox"
                checked={generatesPin}
                onChange={(e) => setGeneratesPin(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <label
                htmlFor={generatesPinInputId}
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Generáljon PIN kódot foglaláskor (privát fotógaléria eléréséhez, e-mailben ki lesz küldve)
              </label>
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
                {isPending ? "Létrehozás..." : "Szolgáltatás létrehozása"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

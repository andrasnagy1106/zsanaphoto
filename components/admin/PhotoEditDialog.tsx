"use client";

import Image from "next/image";
import { useEffect, useId, useState, useTransition } from "react";
import { toObjectPosition } from "@/lib/utils/photo-layout";

export interface PhotoEditValues {
  text: string;
  showText: boolean;
  focusX: number;
  focusY: number;
}

interface PhotoEditDialogProps {
  heading: string;
  imageUrl: string;
  /** Tailwind aspect classes of the frames this photo is shown in publicly, used for live previews. */
  previewAspectClasses: string[];
  initialValues: PhotoEditValues;
  /** When omitted, the text input is hidden (e.g. hero photo that has no caption). */
  textField?: { label: string; placeholder?: string };
  /** When omitted, the visibility checkbox is hidden. */
  showTextToggleLabel?: string;
  onSave: (values: PhotoEditValues) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function PhotoEditDialog({
  heading,
  imageUrl,
  previewAspectClasses,
  initialValues,
  textField,
  showTextToggleLabel,
  onSave,
  onClose,
}: PhotoEditDialogProps) {
  const textInputId = useId();
  const toggleInputId = useId();
  const focusXInputId = useId();
  const focusYInputId = useId();

  const [values, setValues] = useState<PhotoEditValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleImageClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setValues((current) => ({
      ...current,
      focusX: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      focusY: clampPercent(((event.clientY - rect.top) / rect.height) * 100),
    }));
  }

  function handleSave() {
    setErrorMessage(null);
    startSaveTransition(async () => {
      const result = await onSave(values);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.error ?? "A mentés nem sikerült.");
      }
    });
  }

  const objectPosition = toObjectPosition(values.focusX, values.focusY);

  return (
    <dialog
      open
      aria-label={heading}
      className="fixed inset-0 z-50 flex h-full w-full items-center justify-center border-0 bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-background p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{heading}</h2>
            <p className="mt-0.5 text-xs text-foreground/60">
              Kattints a képen arra a pontra, amelyiknek mindig látszania kell a keretben (pl. az arcokra).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground hover:bg-muted/80"
            aria-label="Bezárás"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex justify-center rounded-lg bg-muted/40 p-2">
            <div className="relative inline-block cursor-crosshair" onClick={handleImageClick}>
              <Image
                src={imageUrl}
                alt=""
                width={1200}
                height={1200}
                draggable={false}
                sizes="(max-width: 768px) 90vw, 600px"
                className="block h-auto max-h-[55vh] w-auto max-w-full select-none"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent/70 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                style={{ left: `${values.focusX}%`, top: `${values.focusY}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 md:w-56">
            <div>
              <p className="text-xs font-semibold text-foreground">Előnézet a keretben</p>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                {previewAspectClasses.map((aspectClass) => (
                  <div
                    key={aspectClass}
                    className={`relative w-24 overflow-hidden rounded-md border border-border bg-muted ${aspectClass}`}
                  >
                    <Image src={imageUrl} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={focusXInputId} className="block text-xs font-semibold text-foreground">
                Vízszintes igazítás ({values.focusX}%)
              </label>
              <input
                id={focusXInputId}
                type="range"
                min={0}
                max={100}
                value={values.focusX}
                onChange={(event) => setValues((current) => ({ ...current, focusX: Number(event.target.value) }))}
                className="w-full accent-accent"
              />
              <label htmlFor={focusYInputId} className="block text-xs font-semibold text-foreground">
                Függőleges igazítás ({values.focusY}%)
              </label>
              <input
                id={focusYInputId}
                type="range"
                min={0}
                max={100}
                value={values.focusY}
                onChange={(event) => setValues((current) => ({ ...current, focusY: Number(event.target.value) }))}
                className="w-full accent-accent"
              />
              <button
                type="button"
                onClick={() => setValues((current) => ({ ...current, focusX: 50, focusY: 50 }))}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Középre igazítás
              </button>
            </div>
          </div>
        </div>

        {textField || showTextToggleLabel ? (
          <div className="mt-5 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            {textField ? (
              <div>
                <label htmlFor={textInputId} className="block text-xs font-semibold text-foreground">
                  {textField.label}
                </label>
                <input
                  id={textInputId}
                  type="text"
                  value={values.text}
                  maxLength={200}
                  placeholder={textField.placeholder}
                  onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
                  className="mt-1.5 w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            ) : null}
            {showTextToggleLabel ? (
              <label htmlFor={toggleInputId} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <input
                  id={toggleInputId}
                  type="checkbox"
                  checked={values.showText}
                  onChange={(event) => setValues((current) => ({ ...current, showText: event.target.checked }))}
                  className="size-4 accent-accent"
                />
                {showTextToggleLabel}
              </label>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-10 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {isSaving ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

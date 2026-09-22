"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteServiceAction,
  getServiceDeletionSummaryAction,
} from "@/app/actions/admin-service-actions";
import type { Service } from "@/db/schema";
import type { ServiceDeletionSummary } from "@/lib/services/service-service";

interface DeleteServiceModalProps {
  service: Service;
}

export function DeleteServiceModal({ service }: DeleteServiceModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [summary, setSummary] = useState<ServiceDeletionSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function openModal() {
    setError(null);
    setIsLoadingSummary(true);
    dialogRef.current?.showModal();

    const result = await getServiceDeletionSummaryAction(service.id);
    setIsLoadingSummary(false);
    if (result.success && result.summary) {
      setSummary(result.summary);
    } else {
      setError(result.error ?? "Nem sikerült lekérni a törlési összesítőt.");
    }
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleConfirmDelete() {
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteServiceAction(service.id);
      if (result.success) {
        closeModal();
        router.refresh();
      } else {
        setError(result.error ?? "A szolgáltatás törlése sikertelen.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="min-h-11 rounded-full border border-red-300 bg-white px-5 py-2.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:border-red-400"
      >
        Szolgáltatás törlése
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/55"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="p-5 sm:p-7 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-red-600">Veszélyes művelet</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl text-foreground">
                Biztosan törölni szeretnéd?
              </h2>
              <p className="mt-1 text-sm font-semibold text-foreground/80">
                {service.name}
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

          <div className="mt-5 space-y-4">
            {isLoadingSummary ? (
              <div className="py-8 text-center text-xs text-foreground/60">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" />
                Kapcsolódó adatok és hatások felmérése...
              </div>
            ) : summary ? (
              <>
                <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 text-xs space-y-2.5">
                  <p className="font-bold text-red-800">
                    A szolgáltatás törlésével az alábbi adatok véglegesen törlődnek:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-red-900 font-medium">
                    <li>
                      <strong>{summary.totalBookings} db foglalás és PIN</strong>
                    </li>
                    <li>
                      <strong>{summary.photosCount} db kép és {summary.pinsCount} db mappa</strong> a Cloudinary tárhelyről
                    </li>
                    <li>
                      <strong>{summary.photoOrdersCount} db leadott fotórendelés</strong>
                    </li>
                    <li>A szolgáltatáshoz tartozó egyedi elérhetőségi szabályok</li>
                  </ul>
                </div>

                {/* Email notification notice */}
                <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs text-foreground/75 leading-relaxed">
                  {summary.futureActiveBookings > 0 ? (
                    <div className="space-y-1">
                      <strong className="text-amber-800 block">
                        ⚠️ Lemondási e-mail értesítés:
                      </strong>
                      <p>
                        A szolgáltatáshoz tartozik <strong>{summary.futureActiveBookings} db jövőbeli aktív foglalás</strong>. Számukra a rendszer automatikus lemondási értesítő e-mailt küld.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-foreground/80 block">
                        ℹ️ E-mail értesítés:
                      </strong>
                      <p className="mt-0.5">
                        Nincs jövőbeli aktív foglalás. A korábbi, már lezajlott eseményekről és múltbeli foglalásokról nem megy ki e-mail értesítés.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {error && (
              <div className="rounded-md bg-red-100 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isDeleting}
              className="min-h-10 rounded-md border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting || isLoadingSummary}
              className="min-h-10 rounded-md bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
            >
              {isDeleting ? "Törlés folyamatban..." : "Igen, szolgáltatás végleges törlése"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

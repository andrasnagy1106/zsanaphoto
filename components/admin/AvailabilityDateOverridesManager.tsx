"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  createAvailabilityDateOverrideAction,
  deleteAvailabilityDateOverrideAction,
} from "@/app/actions/admin-availability-actions";
import type { AvailabilityDateOverride } from "@/db/schema";
import { availabilityDateOverrideSchema } from "@/lib/validation/availability";

type FormInput = z.input<typeof availabilityDateOverrideSchema>;
type FormOutput = z.output<typeof availabilityDateOverrideSchema>;

function formatDateLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("hu-HU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

interface AvailabilityDateOverridesManagerProps {
  overrides: AvailabilityDateOverride[];
}

export function AvailabilityDateOverridesManager({ overrides }: AvailabilityDateOverridesManagerProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(availabilityDateOverrideSchema),
    defaultValues: {
      date: "",
      startTime: "18:00",
      endTime: "21:00",
      note: "",
      active: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createAvailabilityDateOverrideAction(values);
    if (!result.success) {
      setServerError(result.error ?? "A mentés sikertelen.");
      return;
    }

    reset({ date: "", startTime: "18:00", endTime: "21:00", note: "", active: true });
    router.refresh();
  });

  function handleDelete(id: string) {
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteAvailabilityDateOverrideAction(id);
      if (!result.success) {
        setServerError(result.error ?? "A törlés sikertelen.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold text-foreground">Egyedi dátumos idősávok</h2>
      <p className="mt-1 text-xs text-foreground/60">
        Alapértelmezetten a heti beállítások érvényesek. Itt konkrét napokra tudsz plusz elérhető időablakot adni (pl. jövő héten esti fotózás).
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-5">
        <div>
          <label htmlFor="override-date" className="block text-xs font-semibold text-foreground mb-1">Nap</label>
          <input
            id="override-date"
            type="date"
            className="w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("date")}
          />
          {errors.date ? <p className="mt-1 text-xs text-red-600">{errors.date.message}</p> : null}
        </div>

        <div>
          <label htmlFor="override-start" className="block text-xs font-semibold text-foreground mb-1">Kezdés</label>
          <input
            id="override-start"
            type="time"
            className="w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("startTime")}
          />
          {errors.startTime ? <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p> : null}
        </div>

        <div>
          <label htmlFor="override-end" className="block text-xs font-semibold text-foreground mb-1">Befejezés</label>
          <input
            id="override-end"
            type="time"
            className="w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("endTime")}
          />
          {errors.endTime ? <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p> : null}
        </div>

        <div>
          <label htmlFor="override-note" className="block text-xs font-semibold text-foreground mb-1">Megjegyzés</label>
          <input
            id="override-note"
            type="text"
            placeholder="pl. munka után"
            className="w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("note")}
          />
          {errors.note ? <p className="mt-1 text-xs text-red-600">{errors.note.message}</p> : null}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-11 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Mentés..." : "Idősáv hozzáadása"}
          </button>
        </div>
      </form>

      {serverError ? <p className="mt-3 text-sm text-red-600">{serverError}</p> : null}

      <div className="mt-5 space-y-2.5">
        {overrides.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-foreground/60">Még nincs felvett egyedi dátumos idősáv.</p>
        ) : (
          overrides.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{formatDateLabel(item.date)} · {item.startTime} - {item.endTime}</p>
                {item.note ? <p className="text-xs text-foreground/60">{item.note}</p> : null}
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(item.id)}
                className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold hover:border-red-400 hover:text-red-600 disabled:opacity-60"
              >
                Törlés
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createBlockedPeriodSchema } from "@/lib/validation/blocked-period";
import { createBlockedPeriodAction } from "@/app/actions/admin-blocked-period-actions";

type FormInput = z.input<typeof createBlockedPeriodSchema>;
type FormOutput = z.output<typeof createBlockedPeriodSchema>;

export function BlockedPeriodForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(createBlockedPeriodSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const result = await createBlockedPeriodAction(data);
    if (result.success) {
      reset();
      router.refresh();
    } else {
      setServerError(result.error ?? "Valami hiba történt.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-white p-6">
      <h2 className="font-display text-lg text-foreground">Új blokkolt időszak</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="startAt" className="block text-sm font-medium text-foreground">
            Kezdés
          </label>
          <input
            id="startAt"
            type="datetime-local"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("startAt")}
          />
          {errors.startAt ? <p className="mt-1 text-sm text-red-600">{errors.startAt.message}</p> : null}
        </div>
        <div>
          <label htmlFor="endAt" className="block text-sm font-medium text-foreground">
            Befejezés
          </label>
          <input
            id="endAt"
            type="datetime-local"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("endAt")}
          />
          {errors.endAt ? <p className="mt-1 text-sm text-red-600">{errors.endAt.message}</p> : null}
        </div>
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-foreground">
            Indok
          </label>
          <input
            id="reason"
            type="text"
            placeholder="pl. szabadság"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("reason")}
          />
        </div>
      </div>

      {serverError ? <p className="mt-3 text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Mentés..." : "Blokkolás hozzáadása"}
      </button>
    </form>
  );
}

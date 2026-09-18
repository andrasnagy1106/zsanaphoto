"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateServiceSchema } from "@/lib/validation/service";
import { updateServiceAction } from "@/app/actions/admin-service-actions";
import type { Service } from "@/db/schema";

type FormInput = z.input<typeof updateServiceSchema>;
type FormOutput = z.output<typeof updateServiceSchema>;

export function ServiceEditForm({ service }: { service: Service }) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(updateServiceSchema),
    defaultValues: {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      approvalMode: service.approvalMode,
      active: service.active,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setMessage(null);
    const result = await updateServiceAction(data);
    setMessage(
      result.success
        ? { type: "success", text: "Mentve." }
        : { type: "error", text: result.error ?? "Valami hiba történt." },
    );
  });

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-white p-6">
      <input type="hidden" {...register("id")} />
      <h2 className="font-display text-xl text-foreground">{service.name}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-name`}>
            Név
          </label>
          <input
            id={`${service.id}-name`}
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-approvalMode`}>
            Jóváhagyás módja
          </label>
          <select
            id={`${service.id}-approvalMode`}
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("approvalMode")}
          >
            <option value="AUTO">Automatikus</option>
            <option value="MANUAL">Manuális</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-duration`}>
            Időtartam (perc)
          </label>
          <input
            id={`${service.id}-duration`}
            type="number"
            min={5}
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("durationMinutes")}
          />
          {errors.durationMinutes ? <p className="mt-1 text-sm text-red-600">{errors.durationMinutes.message}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-buffer`}>
            Puffer (perc)
          </label>
          <input
            id={`${service.id}-buffer`}
            type="number"
            min={0}
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("bufferMinutes")}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-description`}>
            Leírás
          </label>
          <textarea
            id={`${service.id}-description`}
            rows={3}
            className="mt-1.5 block w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register("description")}
          />
        </div>

        <div className="flex items-center gap-2">
          <input id={`${service.id}-active`} type="checkbox" className="h-5 w-5" {...register("active")} />
          <label htmlFor={`${service.id}-active`} className="text-sm font-medium text-foreground">
            Aktív
          </label>
        </div>
      </div>

      {message ? (
        <p className={`mt-3 text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Mentés..." : "Mentés"}
      </button>
    </form>
  );
}

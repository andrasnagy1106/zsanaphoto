"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { serviceAvailabilityRuleSchema } from "@/lib/validation/availability";
import { upsertServiceAvailabilityRuleAction } from "@/app/actions/admin-availability-actions";

type FormInput = z.input<typeof serviceAvailabilityRuleSchema>;
type FormOutput = z.output<typeof serviceAvailabilityRuleSchema>;

const DAY_LABELS: Record<number, string> = {
  1: "Hétfő",
  2: "Kedd",
  3: "Szerda",
  4: "Csütörtök",
  5: "Péntek",
  6: "Szombat",
  0: "Vasárnap",
};

interface ServiceAvailabilityRuleRowProps {
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export function ServiceAvailabilityRuleRow({
  serviceId,
  dayOfWeek,
  startTime,
  endTime,
  active,
}: ServiceAvailabilityRuleRowProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(serviceAvailabilityRuleSchema),
    defaultValues: { serviceId, dayOfWeek, startTime, endTime, active },
  });

  const onSubmit = handleSubmit(async (data) => {
    setMessage(null);
    const result = await upsertServiceAvailabilityRuleAction(data);
    setMessage(
      result.success
        ? { type: "success", text: "Szabály mentve." }
        : { type: "error", text: result.error ?? "Hiba a mentés során." },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-stone-50 p-3">
      <input type="hidden" {...register("serviceId")} />
      <input type="hidden" {...register("dayOfWeek")} />
      <span className="w-24 shrink-0 text-sm font-medium text-foreground">{DAY_LABELS[dayOfWeek]}</span>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="h-4 w-4" {...register("active")} />
        Aktív
      </label>

      <input
        type="time"
        className="min-h-9 rounded-md border border-border bg-white px-2 py-1 text-xs"
        {...register("startTime")}
      />
      <span className="text-foreground/50">–</span>
      <input
        type="time"
        className="min-h-9 rounded-md border border-border bg-white px-2 py-1 text-xs"
        {...register("endTime")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-9 rounded-md border border-border bg-white px-3 text-xs font-medium hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {isSubmitting ? "..." : "Mentés"}
      </button>

      {errors.endTime ? <p className="w-full text-xs text-red-600">{errors.endTime.message}</p> : null}
      {message ? (
        <p className={`w-full text-xs ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

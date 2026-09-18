"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { availabilityRuleSchema } from "@/lib/validation/availability";
import { upsertAvailabilityRuleAction } from "@/app/actions/admin-availability-actions";

type FormInput = z.input<typeof availabilityRuleSchema>;
type FormOutput = z.output<typeof availabilityRuleSchema>;

const DAY_LABELS: Record<number, string> = {
  1: "Hétfő",
  2: "Kedd",
  3: "Szerda",
  4: "Csütörtök",
  5: "Péntek",
  6: "Szombat",
  0: "Vasárnap",
};

interface AvailabilityRuleFormProps {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export function AvailabilityRuleForm({ dayOfWeek, startTime, endTime, active }: AvailabilityRuleFormProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(availabilityRuleSchema),
    defaultValues: { dayOfWeek, startTime, endTime, active },
  });

  const onSubmit = handleSubmit(async (data) => {
    setMessage(null);
    const result = await upsertAvailabilityRuleAction(data);
    setMessage(
      result.success
        ? { type: "success", text: "Mentve." }
        : { type: "error", text: result.error ?? "Valami hiba történt." },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" {...register("dayOfWeek")} />
      <span className="w-24 shrink-0 font-medium text-foreground">{DAY_LABELS[dayOfWeek]}</span>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5" {...register("active")} />
        Aktív
      </label>

      <input
        type="time"
        className="min-h-11 rounded-md border border-border px-2 py-1 text-sm"
        {...register("startTime")}
      />
      <span className="text-foreground/50">–</span>
      <input
        type="time"
        className="min-h-11 rounded-md border border-border px-2 py-1 text-sm"
        {...register("endTime")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 rounded-md border border-border px-4 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {isSubmitting ? "Mentés..." : "Mentés"}
      </button>

      {errors.endTime ? <p className="w-full text-sm text-red-600">{errors.endTime.message}</p> : null}
      {message ? (
        <p className={`w-full text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

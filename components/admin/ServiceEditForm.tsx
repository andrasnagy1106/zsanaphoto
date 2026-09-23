"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateServiceSchema } from "@/lib/validation/service";
import { updateServiceAction } from "@/app/actions/admin-service-actions";
import type { Service, ServiceAvailabilityRule } from "@/db/schema";
import { ServiceAvailabilityRuleRow } from "./ServiceAvailabilityRuleRow";
import { DeleteServiceModal } from "./DeleteServiceModal";

type FormInput = z.input<typeof updateServiceSchema>;
type FormOutput = z.output<typeof updateServiceSchema>;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface ServiceEditFormProps {
  service: Service;
  customRules?: ServiceAvailabilityRule[];
}

export function ServiceEditForm({ service, customRules = [] }: ServiceEditFormProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    control,
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
      availabilityMode: service.availabilityMode,
      dateRangeStart: service.dateRangeStart ?? "",
      dateRangeEnd: service.dateRangeEnd ?? "",
      requiresChildName: service.requiresChildName,
      generatesPin: service.generatesPin,
      active: service.active,
    },
  });

  const availabilityMode = useWatch({ control, name: "availabilityMode" });
  const ruleByDay = new Map(customRules.map((r) => [r.dayOfWeek, r]));

  const onSubmit = handleSubmit(async (data) => {
    setMessage(null);
    const result = await updateServiceAction(data);
    setMessage(
      result.success
        ? { type: "success", text: "Szolgáltatás mentve." }
        : { type: "error", text: result.error ?? "Valami hiba történt." },
    );
  });

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit}>
        <input type="hidden" {...register("id")} />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">{service.name}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              service.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
            }`}
          >
            {service.active ? "Aktív" : "Inaktív"}
          </span>
        </div>

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

          {/* Availability Settings / Date Range */}
          <div className="sm:col-span-2 border-t border-border pt-4">
            <label className="block text-sm font-semibold text-foreground" htmlFor={`${service.id}-availMode`}>
              Elérhetőségi mód (Nyitvatartás)
            </label>
            <select
              id={`${service.id}-availMode`}
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium"
              {...register("availabilityMode")}
            >
              <option value="GLOBAL">Általános naptár (az Elérhetőség menüpont heti szabályai)</option>
              <option value="CUSTOM">Egyedi elérhetőség (esemény-specifikus idősávok)</option>
            </select>
            <p className="mt-1 text-xs text-foreground/60">
              Válaszd az egyedi elérhetőséget, ha ez az esemény csak speciális napokon/órákban foglalható.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-rangeStart`}>
              Érvényesség kezdete (opcionális dátumkorlát)
            </label>
            <input
              id={`${service.id}-rangeStart`}
              type="date"
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
              {...register("dateRangeStart")}
            />
            <p className="mt-1 text-xs text-foreground/50">Előtte nem foglalható (pl. kampány indulása).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor={`${service.id}-rangeEnd`}>
              Érvényesség vége (opcionális dátumkorlát)
            </label>
            <input
              id={`${service.id}-rangeEnd`}
              type="date"
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
              {...register("dateRangeEnd")}
            />
            <p className="mt-1 text-xs text-foreground/50">Utána nem foglalható (pl. kampány vége).</p>
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

          <div className="flex items-center gap-2 sm:col-span-2">
            <input id={`${service.id}-active`} type="checkbox" className="h-5 w-5" {...register("active")} />
            <label htmlFor={`${service.id}-active`} className="text-sm font-medium text-foreground">
              Aktív (megjelenik a foglalási oldalon)
            </label>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id={`${service.id}-requiresChildName`}
              type="checkbox"
              className="h-5 w-5"
              {...register("requiresChildName")}
            />
            <label htmlFor={`${service.id}-requiresChildName`} className="text-sm font-medium text-foreground">
              Kérje be a gyermek nevét is a foglalási űrlapon
            </label>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id={`${service.id}-generatesPin`}
              type="checkbox"
              className="h-5 w-5"
              {...register("generatesPin")}
            />
            <label htmlFor={`${service.id}-generatesPin`} className="text-sm font-medium text-foreground">
              Generáljon PIN kódot foglaláskor (privát fotógaléria eléréséhez, e-mailben ki lesz küldve)
            </label>
          </div>
        </div>

        {message ? (
          <p className={`mt-3 text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
            {message.text}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 shadow-sm hover:bg-accent-dark transition-colors"
          >
            {isSubmitting ? "Mentés..." : "Alapadatok mentése"}
          </button>
          <DeleteServiceModal service={service} />
        </div>
      </form>

      {/* If custom availability mode is selected, show weekday rules table for this service */}
      {availabilityMode === "CUSTOM" && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-display text-base text-foreground">
            Egyedi heti nyitvatartási szabályok – {service.name}
          </h3>
          <p className="mt-1 text-xs text-foreground/60 mb-3">
            Állítsd be, hogy a hét mely napjain és mettől meddig foglalható ez a szolgáltatás.
          </p>
          <div className="space-y-2">
            {DAY_ORDER.map((dayOfWeek) => {
              const rule = ruleByDay.get(dayOfWeek);
              return (
                <ServiceAvailabilityRuleRow
                  key={`${service.id}-${dayOfWeek}`}
                  serviceId={service.id}
                  dayOfWeek={dayOfWeek}
                  startTime={rule?.startTime ?? "09:00"}
                  endTime={rule?.endTime ?? "17:00"}
                  active={rule?.active ?? false}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

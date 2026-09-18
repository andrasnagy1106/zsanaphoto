"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { settingsSchema, type SettingsForm as SettingsFormData } from "@/lib/validation/settings";
import { updateSettingsAction } from "@/app/actions/admin-settings-actions";

type FormInput = z.input<typeof settingsSchema>;
type FormOutput = z.output<typeof settingsSchema>;

export function SettingsForm({ defaultValues }: { defaultValues: SettingsFormData }) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(settingsSchema), defaultValues });

  const onSubmit = handleSubmit(async (data) => {
    setMessage(null);
    const result = await updateSettingsAction(data);
    setMessage(
      result.success
        ? { type: "success", text: "Beállítások mentve." }
        : { type: "error", text: result.error ?? "Valami hiba történt." },
    );
  });

  return (
    <form onSubmit={onSubmit} className="max-w-xl rounded-xl border border-border bg-white p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-foreground">
            Időzóna
          </label>
          <input
            id="timezone"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("timezone")}
          />
        </div>

        <div>
          <label htmlFor="adminNotificationEmail" className="block text-sm font-medium text-foreground">
            Admin értesítési e-mail
          </label>
          <input
            id="adminNotificationEmail"
            type="email"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("adminNotificationEmail")}
          />
          {errors.adminNotificationEmail ? (
            <p className="mt-1 text-sm text-red-600">{errors.adminNotificationEmail.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="siteContactEmail" className="block text-sm font-medium text-foreground">
            Publikus kapcsolattartási e-mail
          </label>
          <input
            id="siteContactEmail"
            type="email"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
            {...register("siteContactEmail")}
          />
          {errors.siteContactEmail ? (
            <p className="mt-1 text-sm text-red-600">{errors.siteContactEmail.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minimumLeadTimeHours" className="block text-sm font-medium text-foreground">
              Minimum előfoglalási idő (óra)
            </label>
            <input
              id="minimumLeadTimeHours"
              type="number"
              min={0}
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
              {...register("minimumLeadTimeHours")}
            />
          </div>
          <div>
            <label htmlFor="maxAdvanceDays" className="block text-sm font-medium text-foreground">
              Maximum előrefoglalás (nap)
            </label>
            <input
              id="maxAdvanceDays"
              type="number"
              min={1}
              className="mt-1.5 block w-full min-h-11 rounded-md border border-border px-3 py-2 text-sm"
              {...register("maxAdvanceDays")}
            />
          </div>
        </div>
      </div>

      {message ? (
        <p className={`mt-4 text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
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

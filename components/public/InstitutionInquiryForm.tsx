"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInquirySchema, type CreateInquiryForm } from "@/lib/validation/inquiry";
import { createInquiryAction } from "@/app/actions/inquiry-actions";

export function InstitutionInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInquiryForm>({
    resolver: zodResolver(createInquirySchema),
  });

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-accent/30 bg-accent/5 p-6 text-center">
        <p className="font-display text-xl text-foreground">Köszönjük!</p>
        <p className="mt-2 text-foreground/70">
          Megkaptuk az érdeklődésedet, hamarosan felvesszük veled a kapcsolatot.
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const result = await createInquiryAction(data);
    if (result.success) {
      setSubmitted(true);
    } else {
      setServerError(result.error ?? "Valami hiba történt. Kérjük, próbáld meg újra.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="institutionName" className="block text-sm font-medium text-foreground">
            Intézmény neve
          </label>
          <input
            id="institutionName"
            type="text"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("institutionName")}
          />
          {errors.institutionName ? (
            <p className="mt-1 text-sm text-red-600">{errors.institutionName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-foreground">
            Kapcsolattartó neve
          </label>
          <input
            id="contactName"
            type="text"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("contactName")}
          />
          {errors.contactName ? (
            <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Telefon
          </label>
          <input
            id="phone"
            type="tel"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label htmlFor="estimatedParticipantCount" className="block text-sm font-medium text-foreground">
            Körülbelüli létszám
          </label>
          <input
            id="estimatedParticipantCount"
            type="text"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("estimatedParticipantCount")}
          />
        </div>

        <div>
          <label htmlFor="preferredPeriod" className="block text-sm font-medium text-foreground">
            Kívánt időszak
          </label>
          <input
            id="preferredPeriod"
            type="text"
            placeholder="pl. 2026. szeptember"
            className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            {...register("preferredPeriod")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground">
          Üzenet
        </label>
        <textarea
          id="message"
          rows={4}
          className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("message")}
        />
      </div>

      {/* Honeypot field: hidden from real users, bots often fill it in. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Cég</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {isSubmitting ? "Küldés..." : "Ajánlatot kérek"}
      </button>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const customerFormSchema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen.").max(100),
  email: z.string().trim().email("Adj meg érvényes e-mail címet.").max(200),
  phone: z.string().trim().min(6, "Adj meg érvényes telefonszámot.").max(30),
  notes: z.string().trim().max(1000).optional(),
  company: z.string().max(0).optional(),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
}

export function CustomerForm({ defaultValues, onSubmit }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Név
        </label>
        <input
          id="name"
          type="text"
          className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("name")}
        />
        {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
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
        <label htmlFor="notes" className="block text-sm font-medium text-foreground">
          Megjegyzés (opcionális)
        </label>
        <textarea
          id="notes"
          rows={3}
          className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("notes")}
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Cég</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
      >
        Tovább az összegzéshez
      </button>
    </form>
  );
}

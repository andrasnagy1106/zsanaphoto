"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginForm as LoginFormData } from "@/lib/validation/auth";
import { loginAction } from "@/app/actions/auth-actions";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const result = await loginAction(data);
    if (result.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setServerError(result.error ?? "Hibás e-mail cím vagy jelszó.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("email")}
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Jelszó
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("password")}
        />
        {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {isSubmitting ? "Bejelentkezés..." : "Bejelentkezés"}
      </button>
    </form>
  );
}

"use client";

import { useId } from "react";
import {
  INSTITUTION_PAYMENT_INFORMATION_TEXT,
  MAX_PAYMENT_INFORMATION_LENGTH,
  PAYMENT_INFORMATION_TEXT,
} from "@/lib/payment-information";

interface PaymentInformationEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function PaymentInformationEditor({ value, onChange, disabled, error }: PaymentInformationEditorProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        Fizetési tájékoztató (szabad szöveg)
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled} onClick={() => onChange(PAYMENT_INFORMATION_TEXT)}
          className="min-h-10 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50">
          Utalás / készpénz minta
        </button>
        <button type="button" disabled={disabled} onClick={() => onChange(INSTITUTION_PAYMENT_INFORMATION_TEXT)}
          className="min-h-10 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50">
          Intézmény szedi be minta
        </button>
      </div>
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)}
        disabled={disabled} rows={7} maxLength={MAX_PAYMENT_INFORMATION_LENGTH}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-help`}
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50" />
      <p id={`${id}-help`} className="text-xs text-foreground/60">
        A minták lecserélik a mező tartalmát, utána bármit átírhatsz. Üres szövegnél nem jelenik meg fizetési tájékoztató. Legfeljebb 5000 karakter.
      </p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

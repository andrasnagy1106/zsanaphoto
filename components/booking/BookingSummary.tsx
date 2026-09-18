import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { CustomerFormData } from "./CustomerForm";
import type { Slot } from "./SlotPicker";

interface BookingSummaryProps {
  serviceName: string;
  slot: Slot;
  customer: CustomerFormData;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

export function BookingSummary({
  serviceName,
  slot,
  customer,
  submitting,
  error,
  onBack,
  onConfirm,
}: BookingSummaryProps) {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white/60 p-6">
        <p className="font-display text-xl text-foreground">{serviceName}</p>
        <p className="mt-1 text-foreground/70">{formatZonedHungarianDate(start)}</p>
        <p className="text-foreground/70">
          {formatZonedTime(start)} - {formatZonedTime(end)}
        </p>

        <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Név</dt>
            <dd className="text-foreground">{customer.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">E-mail</dt>
            <dd className="text-foreground">{customer.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Telefon</dt>
            <dd className="text-foreground">{customer.phone}</dd>
          </div>
          {customer.notes ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Megjegyzés</dt>
              <dd className="text-foreground">{customer.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="min-h-11 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Vissza
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="min-h-11 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
        >
          {submitting ? "Küldés..." : "Foglalás véglegesítése"}
        </button>
      </div>
    </div>
  );
}

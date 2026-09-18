"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

const WEEKDAY_LABELS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const MONTH_LABELS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface DatePickerProps {
  serviceId: string;
  selectedDate: string | null;
  onSelect: (dateIso: string) => void;
}

export function DatePicker({ serviceId, selectedDate, onSelect }: DatePickerProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const prev = new Date(viewYear, viewMonth - 1, 1);
            setViewYear(prev.getFullYear());
            setViewMonth(prev.getMonth());
          }}
          disabled={isCurrentMonth}
          aria-label="Előző hónap"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border disabled:opacity-30"
        >
          ←
        </button>
        <p className="font-medium text-foreground">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={() => {
            const next = new Date(viewYear, viewMonth + 1, 1);
            setViewYear(next.getFullYear());
            setViewMonth(next.getMonth());
          }}
          aria-label="Következő hónap"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border"
        >
          →
        </button>
      </div>

      {/* Keyed by month+service so switching months/services remounts with fresh initial state,
          instead of resetting state synchronously inside an effect. */}
      <MonthGrid
        key={`${viewYear}-${viewMonth}-${serviceId}`}
        serviceId={serviceId}
        viewYear={viewYear}
        viewMonth={viewMonth}
        today={today}
        selectedDate={selectedDate}
        onSelect={onSelect}
      />
    </div>
  );
}

interface MonthGridProps {
  serviceId: string;
  viewYear: number;
  viewMonth: number;
  today: Date;
  selectedDate: string | null;
  onSelect: (dateIso: string) => void;
}

function MonthGrid({ serviceId, viewYear, viewMonth, today, selectedDate, onSelect }: MonthGridProps) {
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = availableDates === null && !error;

  const monthStart = useMemo(() => new Date(viewYear, viewMonth, 1), [viewYear, viewMonth]);
  const monthEnd = useMemo(() => new Date(viewYear, viewMonth + 1, 0), [viewYear, viewMonth]);

  useEffect(() => {
    let cancelled = false;
    const from = toIso(monthStart);
    const to = toIso(monthEnd);

    fetch(`/api/availability/dates?serviceId=${serviceId}&from=${from}&to=${to}`)
      .then((res) => {
        if (!res.ok) throw new Error("request-failed");
        return res.json() as Promise<{ dates: string[] }>;
      })
      .then((data) => {
        if (!cancelled) setAvailableDates(data.dates);
      })
      .catch(() => {
        if (!cancelled) setError("Nem sikerült betölteni a szabad napokat.");
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, monthStart, monthEnd]);

  const leadingBlanks = (monthStart.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = monthEnd.getDate();

  return (
    <div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-foreground/50">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(viewYear, viewMonth, day);
          const iso = toIso(date);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isAvailable = !loading && !isPast && (availableDates?.includes(iso) ?? false);
          const isSelected = selectedDate === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              className={cn(
                "min-h-11 rounded-md text-sm transition-colors",
                isAvailable ? "hover:bg-muted" : "text-foreground/30 cursor-not-allowed",
                isAvailable && !isSelected ? "border border-border" : "",
                isSelected ? "bg-accent text-white" : "",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {!loading && availableDates?.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">Nincs szabad időpont ebben a hónapban.</p>
      ) : null}
    </div>
  );
}

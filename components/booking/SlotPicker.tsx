"use client";

import { useEffect, useState } from "react";
import { formatZonedTime } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils/cn";

export interface Slot {
  startAt: string;
  endAt: string;
}

interface SlotPickerProps {
  serviceId: string;
  dateIso: string;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
}

export function SlotPicker({ serviceId, dateIso, selectedSlot, onSelect }: SlotPickerProps) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/availability/slots?serviceId=${serviceId}&date=${dateIso}`)
      .then((res) => {
        if (!res.ok) throw new Error("request-failed");
        return res.json() as Promise<{ slots: Slot[] }>;
      })
      .then((data) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch(() => {
        if (!cancelled) setError("Nem sikerült betölteni a szabad időpontokat.");
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, dateIso]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (slots === null) return <LoadingState label="Szabad időpontok betöltése..." />;
  if (slots.length === 0) {
    return <EmptyState title="Nincs szabad időpont a kiválasztott napon." description="Válassz másik napot." />;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.startAt === slot.startAt;
        return (
          <button
            key={slot.startAt}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
            className={cn(
              "min-h-11 rounded-md border text-sm font-medium transition-colors",
              isSelected ? "border-accent bg-accent text-white" : "border-border hover:border-accent",
            )}
          >
            {formatZonedTime(new Date(slot.startAt))}
          </button>
        );
      })}
    </div>
  );
}

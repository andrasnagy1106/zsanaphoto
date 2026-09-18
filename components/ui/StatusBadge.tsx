import { cn } from "@/lib/utils/cn";
import type { Booking } from "@/db/schema";

const STATUS_LABELS: Record<Booking["status"], string> = {
  PENDING: "Függőben",
  CONFIRMED: "Megerősítve",
  CANCELLED: "Lemondva",
  COMPLETED: "Teljesítve",
  NO_SHOW: "Nem jelent meg",
};

const STATUS_STYLES: Record<Booking["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-neutral-100 text-neutral-600 border-neutral-200",
  COMPLETED: "bg-sky-100 text-sky-800 border-sky-200",
  NO_SHOW: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const INQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: "Új",
  CONTACTED: "Felvéve a kapcsolat",
  CLOSED: "Lezárva",
};

const INQUIRY_STATUS_STYLES: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800 border-amber-200",
  CONTACTED: "bg-sky-100 text-sky-800 border-sky-200",
  CLOSED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function InquiryStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        INQUIRY_STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600 border-neutral-200",
      )}
    >
      {INQUIRY_STATUS_LABELS[status] ?? status}
    </span>
  );
}

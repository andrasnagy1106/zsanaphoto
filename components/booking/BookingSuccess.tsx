import Link from "next/link";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { formatPrice } from "@/lib/photo-order-catalog";

interface BookingSuccessProps {
  bookingNumber: string;
  status: "PENDING" | "CONFIRMED";
  startAt: string;
  servicePrice: number;
}

export function BookingSuccess({ bookingNumber, status, startAt, servicePrice }: BookingSuccessProps) {
  const start = new Date(startAt);

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-8 text-center" role="status">
      <p className="font-display text-2xl text-foreground">Sikeres foglalás</p>
      <p className="mt-2 text-foreground/70">Köszönjük a foglalást!</p>

      <div className="mt-6 space-y-1">
        <p className="text-sm text-foreground/60">Foglalási azonosító</p>
        <p className="font-display text-xl text-foreground">{bookingNumber}</p>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm text-foreground/60">Időpont</p>
        <p className="text-foreground">
          {formatZonedHungarianDate(start)} {formatZonedTime(start)}
        </p>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm text-foreground/60">Szolgáltatás ára</p>
        <p className="font-semibold text-foreground">{formatPrice(servicePrice)}</p>
      </div>

      <p className="mt-6 text-sm font-medium text-foreground">
        {status === "CONFIRMED"
          ? "Az időpontod visszaigazolva."
          : "A foglalási igényedet rögzítettük. A végleges visszaigazolást e-mailben küldjük."}
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
      >
        Vissza a főoldalra
      </Link>
    </div>
  );
}

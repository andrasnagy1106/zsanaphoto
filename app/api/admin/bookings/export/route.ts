import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { listBookings } from "@/lib/services/booking-service";
import { listServices } from "@/lib/services/service-service";
import {
  formatZonedHungarianDate,
  formatZonedTime,
  getZonedDateIso,
} from "@/lib/utils/time";
import type { Booking } from "@/db/schema";

const STATUS_LABELS: Record<Booking["status"], string> = {
  PENDING: "Függőben",
  CONFIRMED: "Megerősítve",
  CANCELLED: "Lemondva",
  COMPLETED: "Teljesítve",
  NO_SHOW: "Nem jelent meg",
};

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(";") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Nem vagy bejelentkezve.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as Booking["status"] | undefined;
  const serviceId = searchParams.get("serviceId") || undefined;

  const [bookings, services] = await Promise.all([
    listBookings({ status: status || undefined, serviceId }),
    listServices(),
  ]);

  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));

  const headers = [
    "Foglalási azonosító",
    "Ügyfél neve",
    "E-mail",
    "Telefonszám",
    "Szolgáltatás",
    "Dátum",
    "Kezdés",
    "Vége",
    "Státusz",
    "Megjegyzés",
    "Létrehozva",
    "Jóváhagyva",
    "Lemondva",
  ];

  const rows = bookings.map((b) => [
    escapeCsvCell(b.bookingNumber),
    escapeCsvCell(b.customerName),
    escapeCsvCell(b.customerEmail),
    escapeCsvCell(b.customerPhone),
    escapeCsvCell(serviceNameById.get(b.serviceId) ?? "-"),
    escapeCsvCell(formatZonedHungarianDate(b.startAt)),
    escapeCsvCell(formatZonedTime(b.startAt)),
    escapeCsvCell(formatZonedTime(b.endAt)),
    escapeCsvCell(STATUS_LABELS[b.status] ?? b.status),
    escapeCsvCell(b.notes ?? ""),
    escapeCsvCell(
      b.createdAt
        ? `${formatZonedHungarianDate(b.createdAt)} ${formatZonedTime(b.createdAt)}`
        : "",
    ),
    escapeCsvCell(
      b.confirmedAt
        ? `${formatZonedHungarianDate(b.confirmedAt)} ${formatZonedTime(b.confirmedAt)}`
        : "",
    ),
    escapeCsvCell(
      b.cancelledAt
        ? `${formatZonedHungarianDate(b.cancelledAt)} ${formatZonedTime(b.cancelledAt)}`
        : "",
    ),
  ]);

  // \uFEFF is UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 Hungarian characters without character encoding issues.
  // Using semicolon ';' as delimiter which is standard for European/Hungarian Excel.
  const csvContent =
    "\uFEFF" +
    [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");

  const todayIso = getZonedDateIso(new Date());
  const filename = `foglalasok-${todayIso}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { listPhotoOrders } from "@/lib/services/photo-order-service";
import {
  formatZonedHungarianDate,
  formatZonedTime,
  getZonedDateIso,
} from "@/lib/utils/time";
import type { PhotoOrder } from "@/db/schema";

const STATUS_LABELS: Record<PhotoOrder["status"], string> = {
  NEW: "Új",
  PROCESSING: "Feldolgozás alatt",
  COMPLETED: "Teljesítve",
  CANCELLED: "Törölve",
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
  const status = searchParams.get("status") as PhotoOrder["status"] | undefined;
  const serviceId = searchParams.get("serviceId") || undefined;

  const orders = await listPhotoOrders({
    status: status || undefined,
    serviceId,
  });

  const headers = [
    "Rendelési azonosító",
    "Foglalási azonosító",
    "PIN",
    "Ügyfél neve",
    "E-mail",
    "Telefonszám",
    "Szolgáltatás / Esemény",
    "Rendelt tételek",
    "Összes darabszám",
    "Végösszeg (Ft)",
    "Digitális változat",
    "Státusz",
    "Megjegyzés",
    "Beérkezett",
  ];

  const rows = orders.map((row) => {
    const totalQty = row.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsDescription = row.items
      .map(
        (item) =>
          `${item.photoTitle} (${item.size}, ${item.quantity} db x ${item.unitPrice} Ft)`,
      )
      .join(" | ");

    return [
      escapeCsvCell(row.order.orderNumber),
      escapeCsvCell(row.booking.bookingNumber),
      escapeCsvCell(row.booking.pin),
      escapeCsvCell(row.booking.customerName),
      escapeCsvCell(row.booking.customerEmail),
      escapeCsvCell(row.booking.customerPhone),
      escapeCsvCell(row.service.name),
      escapeCsvCell(itemsDescription),
      escapeCsvCell(totalQty),
      escapeCsvCell(row.order.totalAmount),
      escapeCsvCell(row.order.includesDigital ? "Igen" : "Nem"),
      escapeCsvCell(STATUS_LABELS[row.order.status] ?? row.order.status),
      escapeCsvCell(row.order.notes),
      escapeCsvCell(
        `${formatZonedHungarianDate(row.order.createdAt)} ${formatZonedTime(row.order.createdAt)}`,
      ),
    ];
  });

  const bom = "\uFEFF";
  const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

  const nowIso = getZonedDateIso(new Date());
  const filename = `fotorendelesek-${nowIso}.csv`;

  return new NextResponse(bom + csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

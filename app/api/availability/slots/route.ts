import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/services/availability-service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!serviceId || !date || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlotsForDate(serviceId, date);
    return NextResponse.json({
      slots: slots.map((slot) => ({
        startAt: slot.start.toISOString(),
        endAt: slot.end.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[api/availability/slots] Failed to load available slots:", error);
    return NextResponse.json({ error: "Valami hiba történt. Kérjük, próbáld meg újra." }, { status: 500 });
  }
}

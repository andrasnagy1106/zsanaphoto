import { NextRequest, NextResponse } from "next/server";
import { getAvailableDatesInRange } from "@/lib/services/availability-service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!serviceId || !from || !to || !DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  try {
    const dates = await getAvailableDatesInRange(serviceId, from, to);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("[api/availability/dates] Failed to load available dates:", error);
    return NextResponse.json({ error: "Valami hiba történt. Kérjük, próbáld meg újra." }, { status: 500 });
  }
}

"use server";

import { headers } from "next/headers";
import { createBookingInputSchema } from "@/lib/validation/booking";
import { createBooking } from "@/lib/services/booking-service";
import { getServiceById } from "@/lib/services/service-service";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { BookingConflictError, NotFoundError } from "@/lib/utils/errors";
import { addMinutes } from "@/lib/utils/time";

export interface CreateBookingActionResult {
  success: boolean;
  error?: string;
  booking?: {
    bookingNumber: string;
    status: "PENDING" | "CONFIRMED";
    startAt: string;
    endAt: string;
  };
}

export async function createBookingAction(formData: unknown): Promise<CreateBookingActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  const rateLimit = checkRateLimit(`booking:${ip}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = createBookingInputSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, ellenőrizd a megadott adatokat." };
  }

  // Honeypot: pretend success without persisting anything.
  if (parsed.data.company) {
    return {
      success: true,
      booking: {
        bookingNumber: "ZS-0000-0000",
        status: "CONFIRMED",
        startAt: parsed.data.startAt,
        endAt: parsed.data.startAt,
      },
    };
  }

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return { success: false, error: "Érvénytelen időpont." };
  }

  try {
    const service = await getServiceById(parsed.data.serviceId);
    if (!service || !service.active) {
      return { success: false, error: "A kiválasztott szolgáltatás nem érhető el." };
    }

    const endAt = addMinutes(startAt, service.durationMinutes);

    const booking = await createBooking({
      serviceId: parsed.data.serviceId,
      start: startAt,
      end: endAt,
      customerName: parsed.data.name,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
      notes: parsed.data.notes,
    });

    return {
      success: true,
      booking: {
        bookingNumber: booking.bookingNumber,
        status: booking.status as "PENDING" | "CONFIRMED",
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return { success: false, error: error.message };
    }
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    console.error("[createBookingAction] Failed to create booking:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

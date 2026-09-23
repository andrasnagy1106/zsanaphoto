"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  cancelBookingByCustomerSchema,
  createBookingInputSchema,
  rescheduleBookingByCustomerSchema,
} from "@/lib/validation/booking";
import {
  cancelBookingByCustomer,
  createBooking,
  rescheduleBookingByCustomer,
} from "@/lib/services/booking-service";
import { getServiceById } from "@/lib/services/service-service";
import { INSTITUTION_SERVICE_SLUG } from "@/lib/constants";
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

export interface CustomerManageActionResult {
  success: boolean;
  error?: string;
  booking?: {
    bookingNumber: string;
    status: string;
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
      childName: service.requiresChildName ? parsed.data.childName : null,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
      photoPublicationConsent:
        service.slug === INSTITUTION_SERVICE_SLUG ? parsed.data.photoPublicationConsent : null,
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

export async function cancelBookingByCustomerAction(
  formData: unknown,
): Promise<CustomerManageActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  const rateLimit = checkRateLimit(`manage-cancel:${ip}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = cancelBookingByCustomerSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Érvénytelen kérés." };
  }

  try {
    const booking = await cancelBookingByCustomer(parsed.data.token);
    revalidatePath("/foglalas-kezeles");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    return {
      success: true,
      booking: {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    console.error("[cancelBookingByCustomerAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Valami hiba történt.",
    };
  }
}

export async function rescheduleBookingByCustomerAction(
  formData: unknown,
): Promise<CustomerManageActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  const rateLimit = checkRateLimit(`manage-reschedule:${ip}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = rescheduleBookingByCustomerSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, válassz egy érvényes új időpontot." };
  }

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return { success: false, error: "Érvénytelen időpont." };
  }

  try {
    const booking = await rescheduleBookingByCustomer({
      token: parsed.data.token,
      newStart: startAt,
    });

    revalidatePath("/foglalas-kezeles");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    return {
      success: true,
      booking: {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
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
    console.error("[rescheduleBookingByCustomerAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Valami hiba történt.",
    };
  }
}

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { photoEventNotices, type Booking, type Service } from "@/db/schema";
import { resolvePaymentInformation } from "@/lib/payment-information";
import { getZonedDateIso } from "@/lib/utils/time";

export async function getPaymentInformationForBooking(
  booking: Pick<Booking, "serviceId" | "startAt">,
  service: Pick<Service, "paymentInformation" | "includePaymentInformation">,
) {
  const [notice] = await db.select().from(photoEventNotices).where(and(
    eq(photoEventNotices.serviceId, booking.serviceId),
    eq(photoEventNotices.eventDate, getZonedDateIso(booking.startAt)),
  )).limit(1);

  return { ...resolvePaymentInformation(service, notice), orderDeadline: notice?.orderDeadline ?? null };
}

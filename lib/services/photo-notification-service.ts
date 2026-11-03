import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, eventPhotos, photoEventNotices, services } from "@/db/schema";
import { getEmailProvider } from "@/lib/providers/email";
import { NotFoundError } from "@/lib/utils/errors";
import { getZonedDateIso } from "@/lib/utils/time";
import { resolvePaymentInformation } from "@/lib/payment-information";
import type { PhotoReadyEmailMode } from "@/lib/validation/photo-notification";
import { sleep } from "@/lib/utils/sleep";

/** Pause between photo-ready emails to stay under Resend's per-second API rate limit. */
export const PHOTO_READY_EMAIL_INTERVAL_MS = 600;

export async function savePhotoOrderDeadlineForBooking(
  bookingId: string,
  orderDeadline: string | null,
  paymentDeadline: string | null,
  paymentInformation: string | null,
): Promise<void> {
  const [booking] = await db
    .select({ serviceId: bookings.serviceId, startAt: bookings.startAt })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) throw new NotFoundError("A kiválasztott ügyfél nem található.");

  await db
    .insert(photoEventNotices)
    .values({
      serviceId: booking.serviceId,
      eventDate: getZonedDateIso(booking.startAt),
      orderDeadline,
      paymentDeadline,
      paymentInformation,
    })
    .onConflictDoUpdate({
      target: [photoEventNotices.serviceId, photoEventNotices.eventDate],
      set: { orderDeadline, paymentDeadline, paymentInformation, updatedAt: new Date() },
    });
}

export interface SendPhotoReadyEmailsResult {
  sent: number;
  failed: number;
  total: number;
  skipped: number;
}

/**
 * UNSENT: only parents without a recorded photo-ready email (first send or retrying failures).
 * ALL: every parent of the event, including those who already received it.
 */
export async function sendPhotoReadyEmailsForEvent(
  bookingId: string,
  mode: PhotoReadyEmailMode = "UNSENT",
): Promise<SendPhotoReadyEmailsResult> {
  const [row] = await db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) throw new NotFoundError("A kiválasztott ügyfél nem található.");
  const { booking, service } = row;
  if (!booking.pin) throw new Error("Ehhez az ügyfélhez nincs PIN-kód rendelve.");

  const eventDate = getZonedDateIso(booking.startAt);
  const [notice] = await db
    .select()
    .from(photoEventNotices)
    .where(and(
      eq(photoEventNotices.serviceId, service.id),
      eq(photoEventNotices.eventDate, eventDate),
    ))
    .limit(1);

  if (!notice?.orderDeadline) {
    throw new Error("Mentsd el az óvodai fotózás rendelési határidejét az email küldése előtt.");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.hu").replace(/\/$/, "");
  const recipients = await db
    .select({
      booking: bookings,
      photoCount: sql<number>`count(${eventPhotos.id})::int`,
    })
    .from(bookings)
    .leftJoin(eventPhotos, eq(bookings.id, eventPhotos.bookingId))
    .where(and(eq(bookings.serviceId, service.id), isNotNull(bookings.pin)))
    .groupBy(bookings.id)
    .then((rows) =>
      rows.filter(
        (recipient) =>
          recipient.photoCount > 0 &&
          getZonedDateIso(recipient.booking.startAt) === eventDate,
      ),
    );

  if (recipients.length === 0) {
    throw new Error("Ehhez az óvodai fotózáshoz még nincs feltöltött album.");
  }

  const targets = mode === "ALL"
    ? recipients
    : recipients.filter((recipient) => !recipient.booking.photoReadyEmailSentAt);

  if (targets.length === 0) {
    throw new Error(
      "Minden szülő megkapta már az értesítőt. Ha mindenkinek újra szeretnéd küldeni, használd az „Újraküldés mindenkinek” gombot.",
    );
  }

  const provider = getEmailProvider();
  let sent = 0;
  let failed = 0;

  for (const [index, recipient] of targets.entries()) {
    const recipientBooking = recipient.booking;
    if (!recipientBooking.pin) continue;
    if (index > 0) await sleep(PHOTO_READY_EMAIL_INTERVAL_MS);

    try {
      await provider.sendPhotoReadyEmail({
        customerName: recipientBooking.customerName,
        childName: recipientBooking.childName,
        customerEmail: recipientBooking.customerEmail,
        serviceName: service.name,
        pin: recipientBooking.pin,
        orderDeadline: notice.orderDeadline,
        ...resolvePaymentInformation(service, notice, true),
        galleryUrl: siteUrl,
      });

      const sentAt = new Date();
      await db
        .update(bookings)
        .set({ photoReadyEmailSentAt: sentAt, updatedAt: sentAt })
        .where(eq(bookings.id, recipientBooking.id));
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `[photo-notification-service] Failed to send photo-ready email for ${recipientBooking.bookingNumber}:`,
        error,
      );
    }
  }

  return { sent, failed, total: targets.length, skipped: recipients.length - targets.length };
}

import { and, eq, isNotNull, like, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, emailOutbox, eventPhotos, photoEventNotices, services } from "@/db/schema";
import { getEmailProvider } from "@/lib/providers/email";
import { buildPhotoReadyEmail } from "@/lib/providers/email/templates";
import { NotFoundError } from "@/lib/utils/errors";
import { getZonedDateIso } from "@/lib/utils/time";
import { resolvePaymentInformation } from "@/lib/payment-information";
import { resendPhotoReadyEmailSchema, type PhotoReadyEmailMode, type ResendPhotoReadyEmailInput } from "@/lib/validation/photo-notification";
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

export async function sendPhotoReadyEmailToBooking(bookingId: string): Promise<void> {
  const [row] = await db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) throw new NotFoundError("A kiválasztott ügyfél nem található.");
  const { booking, service } = row;
  if (!booking.pin) throw new Error("Ehhez az ügyfélhez nincs PIN-kód rendelve.");

  const [notice] = await db
    .select()
    .from(photoEventNotices)
    .where(and(
      eq(photoEventNotices.serviceId, service.id),
      eq(photoEventNotices.eventDate, getZonedDateIso(booking.startAt)),
    ))
    .limit(1);

  const [photo] = await db
    .select({ id: eventPhotos.id })
    .from(eventPhotos)
    .where(eq(eventPhotos.bookingId, bookingId))
    .limit(1);

  if (!photo) throw new Error("Az ügyfél albumához még nincs feltöltött kép.");

  const emailInput = {
    customerName: booking.customerName,
    childName: booking.childName,
    customerEmail: booking.customerEmail,
    serviceName: service.name,
    pin: booking.pin,
    orderDeadline: notice?.orderDeadline ?? null,
    ...resolvePaymentInformation(service, notice, true),
    galleryUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.hu").replace(/\/$/, ""),
  };

  try {
    await getEmailProvider().sendPhotoReadyEmail(emailInput);
  } catch (error) {
    console.error(
      `[photo-notification-service] Failed to send photo-ready email for ${booking.bookingNumber}:`,
      error,
    );
    throw new Error("Az értesítő küldése nem sikerült. Próbáld újra.");
  }

  const sentAt = new Date();
  try {
    await db
      .update(bookings)
      .set({ photoReadyEmailSentAt: sentAt, updatedAt: sentAt })
      .where(eq(bookings.id, bookingId));
  } catch (error) {
    console.error(
      `[photo-notification-service] Failed to record photo-ready email for ${booking.bookingNumber}:`,
      error,
    );
    throw new Error("Az értesítő elindult, de a küldési állapot mentése nem sikerült. Újrapróbálás előtt ellenőrizd a Resendet.");
  }
}

export async function resendPhotoReadyEmail(input: ResendPhotoReadyEmailInput): Promise<"queued" | "started"> {
  const { bookingId, currentEmail, email } = resendPhotoReadyEmailSchema.parse(input);
  const [row] = await db.select({ booking: bookings, service: services })
    .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!row) throw new NotFoundError("A kiválasztott ügyfél nem található.");
  const { booking, service } = row;
  if (!booking.pin) throw new Error("Ehhez az ügyfélhez nincs PIN-kód rendelve.");
  const pin = booking.pin;

  const [notice] = await db.select().from(photoEventNotices)
    .where(and(eq(photoEventNotices.serviceId, service.id), eq(photoEventNotices.eventDate, getZonedDateIso(booking.startAt))))
    .limit(1);
  const [photo] = await db.select({ id: eventPhotos.id }).from(eventPhotos)
    .where(eq(eventPhotos.bookingId, bookingId)).limit(1);
  if (!photo) throw new Error("Az ügyfél albumához még nincs feltöltött kép.");

  const emailInput = {
    customerName: booking.customerName,
    childName: booking.childName,
    customerEmail: email,
    serviceName: service.name,
    pin,
    orderDeadline: notice?.orderDeadline ?? null,
    ...resolvePaymentInformation(service, notice, true),
    galleryUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.hu").replace(/\/$/, ""),
  };
  const template = buildPhotoReadyEmail(emailInput);
  const pinLine = `\nBelépési PIN-kód: ${pin}\n`;
  const queued = await db.transaction(async (tx) => {
    const [updated] = await tx.update(bookings)
      .set({ customerEmail: email, updatedAt: new Date() })
      .where(and(eq(bookings.id, bookingId), sql`lower(trim(${bookings.customerEmail})) = ${currentEmail}`, eq(bookings.pin, pin)))
      .returning({ id: bookings.id });
    if (!updated) throw new Error("Az ügyfél adatai időközben megváltoztak. Frissítsd az oldalt, majd próbáld újra.");

    const updatedEmails = await tx.update(emailOutbox).set({ toAddress: email, updatedAt: new Date() })
      .where(and(
        eq(emailOutbox.status, "QUEUED"),
        sql`lower(trim(${emailOutbox.toAddress})) = ${currentEmail}`,
        like(emailOutbox.body, "Kedves %"),
        or(
          sql`strpos(E'\n' || ${emailOutbox.body} || E'\n', ${`\nFoglalási azonosító: ${booking.bookingNumber}\n`}) > 0`,
          sql`strpos(E'\n' || ${emailOutbox.body} || E'\n', ${pinLine}) > 0`,
        ),
      )).returning({ id: emailOutbox.id, subject: emailOutbox.subject, body: emailOutbox.body });
    const photoEmails = updatedEmails.filter((item) =>
      item.subject === template.subject && `\n${item.body}\n`.includes(pinLine));
    for (const item of photoEmails) {
      await tx.update(emailOutbox).set({ body: template.text, updatedAt: new Date() })
        .where(eq(emailOutbox.id, item.id));
    }
    if (photoEmails.length > 0) {
      await tx.update(bookings).set({ photoReadyEmailSentAt: new Date(), updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
    }
    return photoEmails.length > 0;
  });

  if (queued) return "queued";

  try {
    await getEmailProvider().sendPhotoReadyEmail(emailInput);
  } catch (error) {
    console.error(`[photo-notification-service] Failed to resend photo-ready email for ${booking.bookingNumber}:`, error);
    throw new Error("Az e-mail cím elmentve, de az értesítő küldése nem sikerült. Próbáld újra.");
  }
  const now = new Date();
  try {
    await db.update(bookings).set({ photoReadyEmailSentAt: now, updatedAt: now }).where(eq(bookings.id, bookingId));
  } catch (error) {
    console.error(`[photo-notification-service] Failed to record photo-ready email for ${booking.bookingNumber}:`, error);
    throw new Error("Az e-mail cím elmentve és a küldés elindult, de a küldési állapot mentése nem sikerült. Újrapróbálás előtt ellenőrizd a Resendet.");
  }
  return "started";
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
        orderDeadline: notice?.orderDeadline ?? null,
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

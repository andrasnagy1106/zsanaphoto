import { formatPrice } from "@/lib/photo-order-catalog";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { BookingEmailInput, PhotoOrderEmailInput } from "./types";

function formatWhen(input: BookingEmailInput): { date: string; time: string } {
  return {
    date: formatZonedHungarianDate(input.startAt),
    time: `${formatZonedTime(input.startAt)} - ${formatZonedTime(input.endAt)}`,
  };
}

function formatManageSection(manageUrl?: string): string {
  if (!manageUrl) return "";
  return `\n\nIdőpont módosítása vagy lemondása:\n${manageUrl}`;
}

function formatBookingPin(pin?: string | null): string {
  return pin ? `\nPIN: ${pin}` : "";
}

function formatPhotoPublicationConsent(consent?: boolean | null): string {
  if (consent === null || consent === undefined) return "";
  return `\nOnline képmegjelenés: ${consent ? "Hozzájárult" : "Nem járult hozzá"}`;
}

export function buildBookingCreatedEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);
  const consentSection = formatPhotoPublicationConsent(input.photoPublicationConsent);

  if (input.approvalMode === "AUTO") {
    return {
      subject: "Időpontfoglalás visszaigazolása - ZsaNa Photo",
      text: `Kedves ${input.customerName}!

Sikeresen lefoglaltad az alábbi időpontot:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${formatBookingPin(input.pin)}${manageSection}
${consentSection}

Várunk szeretettel!

ZsaNa Photo`,
    };
  }

  return {
    subject: "Foglalási igény érkezett - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

Köszönjük az időpontfoglalási igényedet:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${formatBookingPin(input.pin)}${manageSection}
${consentSection}

A végleges visszaigazolásról e-mailben értesítünk, amint a fotós jóváhagyta a foglalást.

ZsaNa Photo`,
  };
}

export function buildAdminNewBookingEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);

  return {
    subject: `Új foglalás érkezett - ${input.bookingNumber}`,
    text: `Új foglalás érkezett.

Ügyfél: ${input.customerName}
E-mail: ${input.customerEmail}
Telefon: ${input.customerPhone}
Szolgáltatás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}
Megjegyzés: ${input.notes ?? "-"}
${input.pin ? `PIN: ${input.pin}` : ""}
${formatPhotoPublicationConsent(input.photoPublicationConsent)}
Státusz: ${input.approvalMode === "AUTO" ? "CONFIRMED" : "PENDING"}`,
  };
}

export function buildBookingConfirmedEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);

  return {
    subject: "Időpontfoglalás visszaigazolva - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

Örömmel értesítünk, hogy az alábbi időpontod véglegesen visszaigazolva:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

Várunk szeretettel!

ZsaNa Photo`,
  };
}

export function buildBookingCancelledEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);

  return {
    subject: "Időpontfoglalás lemondva - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

Az alábbi időpontfoglalásod lemondásra került:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}

Ha kérdésed van, keress minket bizalommal.

ZsaNa Photo`,
  };
}

export function buildAdminBookingCancelledEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);

  return {
    subject: `Foglalás lemondva - ${input.bookingNumber}`,
    text: `Egy foglalás lemondásra került.

Foglalási azonosító: ${input.bookingNumber}
Ügyfél: ${input.customerName}
E-mail: ${input.customerEmail}
Telefon: ${input.customerPhone}
Szolgáltatás: ${input.serviceName}
Eredeti időpont: ${date} (${time})`,
  };
}

export function buildBookingRescheduledEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);

  return {
    subject: "Időpont módosítva - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

A fotózási időpontod sikeresen módosult az új időpontra:

Fotózás: ${input.serviceName}
Új dátum: ${date}
Új időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

Várunk szeretettel!

ZsaNa Photo`,
  };
}

export function buildAdminBookingRescheduledEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);

  return {
    subject: `Foglalás módosítva - ${input.bookingNumber}`,
    text: `Az ügyfél módosította a fotózási időpontját.

Foglalási azonosító: ${input.bookingNumber}
Ügyfél: ${input.customerName}
E-mail: ${input.customerEmail}
Telefon: ${input.customerPhone}
Szolgáltatás: ${input.serviceName}
Új dátum: ${date}
Új időpont: ${time}`,
  };
}

function formatPhotoOrderItems(input: PhotoOrderEmailInput): string {
  return input.items
    .map(
      (item) =>
        `- ${item.photoTitle} · ${item.size} · ${item.quantity} db × ${formatPrice(item.unitPrice)} = ${formatPrice(item.totalPrice)}`,
    )
    .join("\n");
}

export function buildPhotoOrderConfirmationEmail(input: PhotoOrderEmailInput) {
  return {
    subject: `${input.isUpdate ? "Fotórendelés módosítva" : "Fotórendelés visszaigazolása"} - ${input.orderNumber}`,
    text: `Kedves ${input.customerName}!

${input.isUpdate ? "Sikeresen módosítottuk" : "Sikeresen rögzítettük"} a fotórendelésedet.

Rendelési azonosító: ${input.orderNumber}
Foglalási azonosító: ${input.bookingNumber}
Fotózás: ${input.serviceName}
Megjegyzés: ${input.notes ?? "-"}

Rendelt képek:
${formatPhotoOrderItems(input)}

Végösszeg: ${formatPrice(input.totalAmount)}

A rendelés feldolgozásáról értesítünk.

ZsaNa Photo`,
  };
}

export function buildAdminPhotoOrderNotificationEmail(input: PhotoOrderEmailInput) {
  return {
    subject: `${input.isUpdate ? "Fotórendelés módosítva" : "Új fotórendelés"} - ${input.orderNumber}`,
    text: `${input.isUpdate ? "Egy fotórendelést módosítottak." : "Új fotórendelés érkezett."}

Rendelési azonosító: ${input.orderNumber}
Foglalási azonosító: ${input.bookingNumber}
Ügyfél: ${input.customerName}
E-mail: ${input.customerEmail}
Fotózás: ${input.serviceName}
Megjegyzés: ${input.notes ?? "-"}

Rendelt képek:
${formatPhotoOrderItems(input)}

Végösszeg: ${formatPrice(input.totalAmount)}`,
  };
}

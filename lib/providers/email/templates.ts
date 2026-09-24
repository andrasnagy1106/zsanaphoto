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

function formatChildName(childName?: string | null): string {
  return childName ? `\nGyermek neve: ${childName}` : "";
}

function formatPhotoPublicationConsent(consent?: boolean | null): string {
  if (consent === null || consent === undefined) return "";
  return `\nOnline képmegjelenés: ${consent ? "Hozzájárult" : "Nem járult hozzá"}`;
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  startAt: Date;
  endAt: Date;
  description?: string;
  location?: string;
}): string {
  const formatUtcIso = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const dates = `${formatUtcIso(input.startAt)}/${formatUtcIso(input.endAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
    ctz: "Europe/Budapest",
  });

  if (input.description) params.set("details", input.description);
  if (input.location) params.set("location", input.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGoogleCalendarSection(input: BookingEmailInput): string {
  const gcalUrl = buildGoogleCalendarUrl({
    title: `ZsaNa Photo - ${input.serviceName}`,
    startAt: input.startAt,
    endAt: input.endAt,
    description: `Fotózás: ${input.serviceName}\nFoglalási azonosító: ${input.bookingNumber}${input.pin ? `\nPIN: ${input.pin}` : ""}${input.manageUrl ? `\nKezelés / Lemondás: ${input.manageUrl}` : ""}`,
    location: "ZsaNa Photo",
  });

  return `\n\nHozzáadás a Google Naptárhoz:\n${gcalUrl}`;
}

export function buildBookingCreatedEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);
  const childNameSection = formatChildName(input.childName);
  const consentSection = formatPhotoPublicationConsent(input.photoPublicationConsent);
  const calendarSection =
    input.approvalMode === "AUTO" ? formatGoogleCalendarSection(input) : "";

  if (input.approvalMode === "AUTO") {
    return {
      subject: "Időpontfoglalás visszaigazolása - ZsaNa Photo",
      text: `Kedves ${input.customerName}!

Sikeresen lefoglaltad az alábbi időpontot:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${formatBookingPin(input.pin)}${childNameSection}${manageSection}${calendarSection}
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

Foglalási azonosító: ${input.bookingNumber}${formatBookingPin(input.pin)}${childNameSection}${manageSection}
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

Ügyfél: ${input.customerName}${formatChildName(input.childName)}
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
  const calendarSection = formatGoogleCalendarSection(input);

  return {
    subject: "Időpontfoglalás visszaigazolva - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

Örömmel értesítünk, hogy az alábbi időpontod véglegesen visszaigazolva:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}${calendarSection}

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
  const calendarSection = formatGoogleCalendarSection(input);

  return {
    subject: "Időpont módosítva - ZsaNa Photo",
    text: `Kedves ${input.customerName}!

A fotózási időpontod sikeresen módosult az új időpontra:

Fotózás: ${input.serviceName}
Új dátum: ${date}
Új időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}${calendarSection}

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
  const lines = input.items.map(
    (item) =>
      `- ${item.photoTitle} · ${item.size} · ${item.quantity} db × ${formatPrice(item.unitPrice)} = ${formatPrice(item.totalPrice)}`,
  );
  if (input.includesDigital) {
    lines.push(
      "- Digitális változat (digitálisan átadott, megszerkesztett képek online galériában, szabadon felhasználható)",
    );
  }
  return lines.length > 0 ? lines.join("\n") : "- Nincs kiválasztva papírkép (csak digitális átadás)";
}

function formatBillingDetails(input: PhotoOrderEmailInput): string {
  if (!input.billingName && !input.billingAddress) return "";
  const nameLine = input.billingName ? `Név: ${input.billingName}` : "";
  const addressLine =
    input.billingPostalCode || input.billingCity || input.billingAddress
      ? `Cím: ${[input.billingPostalCode, input.billingCity].filter(Boolean).join(" ")}, ${input.billingAddress ?? ""}`
      : "";
  const lines = [nameLine, addressLine].filter(Boolean);
  if (lines.length === 0) return "";
  return `\n\nSzámlázási adatok:\n${lines.join("\n")}`;
}

export function buildPhotoOrderConfirmationEmail(input: PhotoOrderEmailInput) {
  const billingSection = formatBillingDetails(input);

  return {
    subject: `${input.isUpdate ? "Fotórendelés módosítva" : "Fotórendelés visszaigazolása"} - ${input.orderNumber}`,
    text: `Kedves ${input.customerName}!

${input.isUpdate ? "Sikeresen módosítottuk" : "Sikeresen rögzítettük"} a fotórendelésedet.

Rendelési azonosító: ${input.orderNumber}
Foglalási azonosító: ${input.bookingNumber}
Fotózás: ${input.serviceName}
${input.includesDigital ? "Digitális változat: Igen (digitálisan átadott, megszerkesztett képek online galériában)\n" : ""}Megjegyzés: ${input.notes ?? "-"}${billingSection}

Rendelt tételek:
${formatPhotoOrderItems(input)}

Végösszeg: ${formatPrice(input.totalAmount)}

A rendelés feldolgozásáról értesítünk.

ZsaNa Photo`,
  };
}

export function buildAdminPhotoOrderNotificationEmail(input: PhotoOrderEmailInput) {
  const billingSection = formatBillingDetails(input);

  return {
    subject: `${input.isUpdate ? "Fotórendelés módosítva" : "Új fotórendelés"} - ${input.orderNumber}`,
    text: `${input.isUpdate ? "Egy fotórendelést módosítottak." : "Új fotórendelés érkezett."}

Rendelési azonosító: ${input.orderNumber}
Foglalási azonosító: ${input.bookingNumber}
Ügyfél: ${input.customerName}
E-mail: ${input.customerEmail}
Fotózás: ${input.serviceName}
${input.includesDigital ? "Digitális változat: Igen\n" : ""}Megjegyzés: ${input.notes ?? "-"}${billingSection}

Rendelt tételek:
${formatPhotoOrderItems(input)}

Végösszeg: ${formatPrice(input.totalAmount)}`,
  };
}

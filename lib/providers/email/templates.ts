import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { BookingEmailInput } from "./types";

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

export function buildBookingCreatedEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);

  if (input.approvalMode === "AUTO") {
    return {
      subject: "Időpontfoglalás visszaigazolása - Zsana Photo",
      text: `Kedves ${input.customerName}!

Sikeresen lefoglaltad az alábbi időpontot:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

Várunk szeretettel!

Zsana Photo`,
    };
  }

  return {
    subject: "Foglalási igény érkezett - Zsana Photo",
    text: `Kedves ${input.customerName}!

Köszönjük az időpontfoglalási igényedet:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

A végleges visszaigazolásról e-mailben értesítünk, amint a fotós jóváhagyta a foglalást.

Zsana Photo`,
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
Státusz: ${input.approvalMode === "AUTO" ? "CONFIRMED" : "PENDING"}`,
  };
}

export function buildBookingConfirmedEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);
  const manageSection = formatManageSection(input.manageUrl);

  return {
    subject: "Időpontfoglalás visszaigazolva - Zsana Photo",
    text: `Kedves ${input.customerName}!

Örömmel értesítünk, hogy az alábbi időpontod véglegesen visszaigazolva:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

Várunk szeretettel!

Zsana Photo`,
  };
}

export function buildBookingCancelledEmail(input: BookingEmailInput) {
  const { date, time } = formatWhen(input);

  return {
    subject: "Időpontfoglalás lemondva - Zsana Photo",
    text: `Kedves ${input.customerName}!

Az alábbi időpontfoglalásod lemondásra került:

Fotózás: ${input.serviceName}
Dátum: ${date}
Időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}

Ha kérdésed van, keress minket bizalommal.

Zsana Photo`,
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
    subject: "Időpont módosítva - Zsana Photo",
    text: `Kedves ${input.customerName}!

A fotózási időpontod sikeresen módosult az új időpontra:

Fotózás: ${input.serviceName}
Új dátum: ${date}
Új időpont: ${time}

Foglalási azonosító: ${input.bookingNumber}${manageSection}

Várunk szeretettel!

Zsana Photo`,
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

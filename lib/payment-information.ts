export const PAYMENT_INFORMATION_TEXT = `Fizetési információk:

Banki utalással:
Toldi Zsanett
OTP BANK
Számlaszám:11748076-25511136
Az utalásnál a közlemény rovatba kérem feltüntetni a gyermek nevét/intézményét.

Készpénzes fizetés esetén zárt borítékba kérem rakni a pontos összeget ,melyet kérem a borítékra írni.A borítékon tüntesse fel a gyermek nevét/intézményét.
A zárt borítékot leadhatja :
- Sárbogárdon a Főtéri cukrászdába
-Sárbogárd/Töbörzsökön Tóth Lászlónál a Törpe Élelmiszerben/Dózsa György utca 42/ Nyitva tartási időben Hétfőtől-Péntekig 6-11 óráig  és 14-17 óráig.Szombat-vasárnap:7-12 óráig.`;

export const INSTITUTION_PAYMENT_INFORMATION_TEXT =
  "Fizetési információk:\n\nA fotórendelés összegét az intézmény szedi be. Kérjük, a befizetés részleteiről az intézménynél érdeklődj.";

export const MAX_PAYMENT_INFORMATION_LENGTH = 5000;

export interface PaymentInformation {
  paymentInformation: string;
  paymentDeadline: string | null;
}

export function resolvePaymentInformation(
  service: { paymentInformation: string | null; includePaymentInformation: boolean },
  notice: { paymentInformation: string | null; paymentDeadline: string | null } | null | undefined,
  forPhotoReadyEmail = false,
): PaymentInformation {
  return {
    // An event override also overrides the legacy order-email visibility switch.
    paymentInformation: notice?.paymentInformation ??
      (forPhotoReadyEmail || service.includePaymentInformation
        ? service.paymentInformation ?? PAYMENT_INFORMATION_TEXT
        : ""),
    paymentDeadline: notice?.paymentDeadline ?? null,
  };
}

export function formatNoticeDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}. ${month}. ${day}.`;
}

export function formatPaymentInformation(input: {
  paymentInformation?: string | null;
  paymentDeadline?: string | null;
}): string {
  return [
    input.paymentDeadline ? `Fizetési határidő: ${formatNoticeDate(input.paymentDeadline)}` : "",
    input.paymentInformation?.trim(),
  ].filter(Boolean).join("\n\n");
}

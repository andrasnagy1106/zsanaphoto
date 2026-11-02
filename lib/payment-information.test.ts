import { describe, expect, it } from "vitest";
import {
  formatPaymentInformation,
  INSTITUTION_PAYMENT_INFORMATION_TEXT,
  PAYMENT_INFORMATION_TEXT,
  resolvePaymentInformation,
} from "./payment-information";

const service = { paymentInformation: null, includePaymentInformation: false };

describe("resolvePaymentInformation", () => {
  it("preserves the legacy email visibility until configured", () => {
    expect(resolvePaymentInformation(service, null).paymentInformation).toBe("");
    expect(resolvePaymentInformation(service, null, true).paymentInformation).toBe(PAYMENT_INFORMATION_TEXT);
    expect(resolvePaymentInformation({ ...service, includePaymentInformation: true }, null).paymentInformation)
      .toBe(PAYMENT_INFORMATION_TEXT);
  });

  it("uses service text unless the event has its own override", () => {
    const configured = { paymentInformation: "Szolgáltatás szövege", includePaymentInformation: true };
    expect(resolvePaymentInformation(configured, null).paymentInformation).toBe(configured.paymentInformation);
    const notice = { paymentInformation: INSTITUTION_PAYMENT_INFORMATION_TEXT, paymentDeadline: null };
    expect(resolvePaymentInformation(configured, notice).paymentInformation).toBe(INSTITUTION_PAYMENT_INFORMATION_TEXT);
    expect(resolvePaymentInformation(service, notice, true)).toEqual(resolvePaymentInformation(service, notice));
  });

  it("distinguishes explicit blank text from inheriting the service default", () => {
    expect(resolvePaymentInformation(service, { paymentInformation: "", paymentDeadline: null }, true).paymentInformation).toBe("");
    expect(resolvePaymentInformation(service, { paymentInformation: null, paymentDeadline: null }, true).paymentInformation).toBe(PAYMENT_INFORMATION_TEXT);
  });

  it("keeps a deadline independent of the payment text", () => {
    expect(resolvePaymentInformation(service, { paymentInformation: "", paymentDeadline: "2026-11-20" }))
      .toEqual({ paymentInformation: "", paymentDeadline: "2026-11-20" });
  });
});

describe("formatPaymentInformation", () => {
  it("omits a blank deadline and preserves multiline free text literally", () => {
    expect(formatPaymentInformation({ paymentInformation: "Az óvoda szedi be.\n<nem HTML>", paymentDeadline: null }))
      .toBe("Az óvoda szedi be.\n<nem HTML>");
    expect(formatPaymentInformation({ paymentInformation: "", paymentDeadline: null })).toBe("");
  });

  it("formats a supplied date without timezone shifts", () => {
    expect(formatPaymentInformation({ paymentInformation: "", paymentDeadline: "2026-11-20" }))
      .toBe("Fizetési határidő: 2026. 11. 20.");
  });
});

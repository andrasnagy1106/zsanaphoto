import { describe, expect, it } from "vitest";
import { redactAccessTokenFromAnalyticsEvent } from "./analytics";

describe("redactAccessTokenFromAnalyticsEvent", () => {
  it("removes access tokens while preserving other query parameters", () => {
    const event = {
      type: "pageview" as const,
      url: "https://zsanaphoto.hu/fotogaleria?token=secret-value&source=email",
    };

    expect(redactAccessTokenFromAnalyticsEvent(event)).toEqual({
      type: "pageview",
      url: "https://zsanaphoto.hu/fotogaleria?source=email",
    });
  });

  it("keeps ordinary page URLs unchanged", () => {
    const event = {
      type: "pageview" as const,
      url: "/csaladi-fotozas?source=instagram",
    };

    expect(redactAccessTokenFromAnalyticsEvent(event)).toBe(event);
  });
});
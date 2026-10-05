import type { BeforeSendEvent } from "@vercel/analytics/next";

export function redactAccessTokenFromAnalyticsEvent(
  event: BeforeSendEvent,
): BeforeSendEvent {
  let url: URL;
  try {
    url = new URL(event.url, "https://analytics.invalid");
  } catch {
    return event;
  }

  if (!url.searchParams.has("token")) return event;

  url.searchParams.delete("token");
  const sanitizedUrl = event.url.startsWith("/")
    ? `${url.pathname}${url.search}${url.hash}`
    : url.toString();

  return { ...event, url: sanitizedUrl };
}
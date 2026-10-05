"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAccessTokenFromAnalyticsEvent } from "@/lib/utils/analytics";

export function AnalyticsWithPrivacyFilter() {
  return <Analytics beforeSend={redactAccessTokenFromAnalyticsEvent} />;
}
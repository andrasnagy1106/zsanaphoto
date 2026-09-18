"use server";

import { headers } from "next/headers";
import { createInquirySchema } from "@/lib/validation/inquiry";
import { createInquiry } from "@/lib/services/inquiry-service";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export interface CreateInquiryActionResult {
  success: boolean;
  error?: string;
}

export async function createInquiryAction(
  formData: unknown,
): Promise<CreateInquiryActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  const rateLimit = checkRateLimit(`inquiry:${ip}`, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = createInquirySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, ellenőrizd a megadott adatokat." };
  }

  // Honeypot: if filled, silently pretend success without persisting anything.
  if (parsed.data.company) {
    return { success: true };
  }

  try {
    await createInquiry({
      institutionName: parsed.data.institutionName,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      estimatedParticipantCount: parsed.data.estimatedParticipantCount ?? null,
      preferredPeriod: parsed.data.preferredPeriod ?? null,
      message: parsed.data.message ?? null,
    });
    return { success: true };
  } catch (error) {
    console.error("[createInquiryAction] Failed to create inquiry:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

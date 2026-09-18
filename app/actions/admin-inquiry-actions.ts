"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { updateInquiryStatus } from "@/lib/services/inquiry-service";
import type { InstitutionInquiry } from "@/db/schema";
import type { AdminActionResult } from "./admin-booking-actions";

export async function updateInquiryStatusAction(
  id: string,
  status: InstitutionInquiry["status"],
): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    await updateInquiryStatus(id, status);
    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error) {
    console.error("[updateInquiryStatusAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

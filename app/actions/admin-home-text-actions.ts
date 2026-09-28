"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { HOME_TEXT_MAX_LENGTH, isHomeTextKey } from "@/lib/home-texts";
import { saveHomeTexts } from "@/lib/services/home-text-service";
import type { AdminActionResult } from "./admin-booking-actions";

const homeTextsSchema = z.record(
  z.string().refine(isHomeTextKey, "Ismeretlen szövegmező."),
  z.string().max(HOME_TEXT_MAX_LENGTH, `Egy szöveg legfeljebb ${HOME_TEXT_MAX_LENGTH} karakter lehet.`),
);

export async function updateHomeTextsAction(values: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = homeTextsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok." };
  }

  try {
    await saveHomeTexts(parsed.data as Parameters<typeof saveHomeTexts>[0]);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[updateHomeTextsAction] Failed:", error);
    return { success: false, error: "A szövegek mentése nem sikerült." };
  }
}

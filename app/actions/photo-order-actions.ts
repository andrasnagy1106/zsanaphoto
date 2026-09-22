"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  getPhotoOrderAccessByPin,
  savePhotoOrder,
  updatePhotoOrderStatus,
} from "@/lib/services/photo-order-service";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import {
  savePhotoOrderSchema,
  updatePhotoOrderStatusSchema,
  verifyPhotoOrderPinSchema,
} from "@/lib/validation/photo-order";

export interface PhotoOrderActionResult {
  success: boolean;
  error?: string;
  accessToken?: string;
  orderNumber?: string;
  wasUpdated?: boolean;
}

export async function verifyPhotoOrderPinAction(pin: string): Promise<PhotoOrderActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const rateLimit = checkRateLimit(`photo-pin:${ip}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = verifyPhotoOrderPinSchema.safeParse({ pin });
  if (!parsed.success) return { success: false, error: "A PIN formátuma két betű és öt számjegy." };

  const access = await getPhotoOrderAccessByPin(parsed.data.pin);
  if (!access) return { success: false, error: "A PIN érvénytelen, vagy a fotók még nem érhetők el." };

  return { success: true, accessToken: access.booking.manageToken };
}

export async function savePhotoOrderAction(input: unknown): Promise<PhotoOrderActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const rateLimit = checkRateLimit(`photo-order:${ip}`, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: "Túl sok rendelési próbálkozás történt. Kérjük, próbáld meg később." };
  }

  const parsed = savePhotoOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ellenőrizd a kiválasztott képeket és darabszámokat." };

  try {
    const saved = await savePhotoOrder(parsed.data);
    return {
      success: true,
      orderNumber: saved.order.orderNumber,
      wasUpdated: saved.wasUpdated,
    };
  } catch (error) {
    console.error("[savePhotoOrderAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A rendelés nem sikerült." };
  }
}

export async function updatePhotoOrderStatusAction(input: unknown): Promise<PhotoOrderActionResult> {
  await requireAdmin();
  const parsed = updatePhotoOrderStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Érvénytelen rendelési állapot." };

  try {
    await updatePhotoOrderStatus(parsed.data.orderId, parsed.data.status);
    revalidatePath("/admin/photo-orders");
    return { success: true };
  } catch (error) {
    console.error("[updatePhotoOrderStatusAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A módosítás nem sikerült." };
  }
}
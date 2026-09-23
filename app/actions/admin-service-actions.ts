"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createService,
  deleteService,
  getServiceDeletionSummary,
  updateService,
  type CreateServiceInput,
  type ServiceDeletionSummary,
  type UpdateServiceInput,
} from "@/lib/services/service-service";
import { createServiceSchema, updateServiceSchema } from "@/lib/validation/service";
import type { AdminActionResult } from "./admin-booking-actions";

export async function createServiceAction(formData: unknown): Promise<AdminActionResult & { serviceId?: string }> {
  await requireAdmin();

  const parsed = createServiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat." };
  }

  const input: CreateServiceInput = {
    name: parsed.data.name,
    slug: parsed.data.slug || undefined,
    description: parsed.data.description,
    durationMinutes: parsed.data.durationMinutes,
    bufferMinutes: parsed.data.bufferMinutes,
    approvalMode: parsed.data.approvalMode,
    availabilityMode: parsed.data.availabilityMode,
    dateRangeStart: parsed.data.dateRangeStart,
    dateRangeEnd: parsed.data.dateRangeEnd,
    requiresChildName: parsed.data.requiresChildName,
    active: parsed.data.active,
  };

  try {
    const created = await createService(input);
    revalidatePath("/admin/services");
    revalidatePath("/admin/event-photos");
    revalidatePath("/idopontfoglalas");
    return { success: true, serviceId: created.id };
  } catch (error) {
    console.error("[createServiceAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A szolgáltatás létrehozása sikertelen." };
  }
}

export async function updateServiceAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = updateServiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, ellenőrizd a megadott adatokat." };
  }

  const input: UpdateServiceInput = {
    name: parsed.data.name,
    description: parsed.data.description,
    durationMinutes: parsed.data.durationMinutes,
    bufferMinutes: parsed.data.bufferMinutes,
    approvalMode: parsed.data.approvalMode,
    availabilityMode: parsed.data.availabilityMode,
    dateRangeStart: parsed.data.dateRangeStart,
    dateRangeEnd: parsed.data.dateRangeEnd,
    requiresChildName: parsed.data.requiresChildName,
    active: parsed.data.active,
  };

  try {
    await updateService(parsed.data.id, input);
    revalidatePath("/admin/services");
    revalidatePath("/admin/event-photos");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[updateServiceAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

export async function getServiceDeletionSummaryAction(
  serviceId: string,
): Promise<{ success: boolean; summary?: ServiceDeletionSummary; error?: string }> {
  await requireAdmin();

  try {
    const summary = await getServiceDeletionSummary(serviceId);
    if (!summary) return { success: false, error: "A szolgáltatás nem található." };
    return { success: true, summary };
  } catch (error) {
    console.error("[getServiceDeletionSummaryAction] Failed:", error);
    return { success: false, error: "Nem sikerült lekérni a törlési összesítőt." };
  }
}

export async function deleteServiceAction(serviceId: string): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    await deleteService(serviceId);
    revalidatePath("/admin/services");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/photo-orders");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[deleteServiceAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A szolgáltatás törlése sikertelen." };
  }
}

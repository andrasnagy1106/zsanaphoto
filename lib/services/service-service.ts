import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, type NewService, type Service } from "@/db/schema";
import { NotFoundError } from "@/lib/utils/errors";

export async function listServices(): Promise<Service[]> {
  return db.select().from(services).orderBy(asc(services.sortOrder));
}

export async function listActiveServices(): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const [service] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return service ?? null;
}

export async function getServiceById(id: string): Promise<Service | null> {
  const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return service ?? null;
}

export type UpdateServiceInput = Partial<
  Pick<
    NewService,
    | "name"
    | "description"
    | "durationMinutes"
    | "bufferMinutes"
    | "approvalMode"
    | "availabilityMode"
    | "dateRangeStart"
    | "dateRangeEnd"
    | "active"
    | "sortOrder"
  >
>;

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const [updated] = await db
    .update(services)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();

  if (!updated) throw new NotFoundError("A szolgáltatás nem található.");
  return updated;
}

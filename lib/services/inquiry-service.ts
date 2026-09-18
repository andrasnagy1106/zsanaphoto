import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { institutionInquiries, type InstitutionInquiry, type NewInstitutionInquiry } from "@/db/schema";
import { NotFoundError } from "@/lib/utils/errors";

export type CreateInquiryInput = Pick<
  NewInstitutionInquiry,
  "institutionName" | "contactName" | "email" | "phone" | "estimatedParticipantCount" | "preferredPeriod" | "message"
>;

export async function createInquiry(input: CreateInquiryInput): Promise<InstitutionInquiry> {
  const [created] = await db.insert(institutionInquiries).values(input).returning();
  return created;
}

export async function listInquiries(): Promise<InstitutionInquiry[]> {
  return db.select().from(institutionInquiries).orderBy(desc(institutionInquiries.createdAt));
}

export async function updateInquiryStatus(
  id: string,
  status: InstitutionInquiry["status"],
): Promise<InstitutionInquiry> {
  const [updated] = await db
    .update(institutionInquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(institutionInquiries.id, id))
    .returning();

  if (!updated) throw new NotFoundError("Az érdeklődés nem található.");
  return updated;
}

import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { siteTexts } from "@/db/schema";
import {
  HOME_TEXT_FIELDS,
  getDefaultHomeTexts,
  isHomeTextKey,
  type HomeTextKey,
  type HomeTexts,
} from "@/lib/home-texts";

const HOME_TEXT_KEYS = HOME_TEXT_FIELDS.map((field) => field.key);

/** Returns every homepage text: the admin-saved value, or the built-in default. */
export async function getHomeTexts(): Promise<HomeTexts> {
  const texts = getDefaultHomeTexts();
  const rows = await db.select().from(siteTexts).where(inArray(siteTexts.key, HOME_TEXT_KEYS));
  for (const row of rows) {
    if (isHomeTextKey(row.key)) texts[row.key] = row.value;
  }
  return texts;
}

/** Saves the given texts; empty or default values remove the override so the default is used. */
export async function saveHomeTexts(values: Partial<Record<HomeTextKey, string>>): Promise<void> {
  const defaults = getDefaultHomeTexts();
  const entries = Object.entries(values) as [HomeTextKey, string][];

  const keysToReset = entries
    .filter(([key, value]) => !value.trim() || value.trim() === defaults[key])
    .map(([key]) => key);
  const rowsToSave = entries
    .filter(([key]) => !keysToReset.includes(key))
    .map(([key, value]) => ({ key, value: value.trim() }));

  await db.transaction(async (tx) => {
    if (keysToReset.length > 0) {
      await tx.delete(siteTexts).where(inArray(siteTexts.key, keysToReset));
    }
    for (const row of rowsToSave) {
      await tx
        .insert(siteTexts)
        .values(row)
        .onConflictDoUpdate({ target: siteTexts.key, set: { value: row.value, updatedAt: new Date() } });
    }
  });
}

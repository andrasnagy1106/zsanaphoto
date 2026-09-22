import { randomInt } from "node:crypto";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateBookingPin(): string {
  const prefix = `${LETTERS[randomInt(LETTERS.length)]}${LETTERS[randomInt(LETTERS.length)]}`;
  const digits = String(randomInt(100_000)).padStart(5, "0");

  return `${prefix}${digits}`;
}
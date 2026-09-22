const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getRandomInt(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateBookingPin(): string {
  const prefix = `${LETTERS[getRandomInt(LETTERS.length)]}${LETTERS[getRandomInt(LETTERS.length)]}`;
  const digits = String(getRandomInt(100_000)).padStart(5, "0");

  return `${prefix}${digits}`;
}
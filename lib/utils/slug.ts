export function slugify(text: string): string {
  const map: Record<string, string> = {
    á: "a",
    à: "a",
    ä: "a",
    é: "e",
    è: "e",
    ë: "e",
    í: "i",
    ì: "i",
    ï: "i",
    ó: "o",
    ö: "o",
    ő: "o",
    ò: "o",
    ú: "u",
    ü: "u",
    ű: "u",
    ù: "u",
  };

  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäéèëíìïóöőòúüűù]/g, (m) => map[m] ?? m)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

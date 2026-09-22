export const PHOTO_PRINT_SIZES = [
  "10x15 cm",
  "13x18 cm",
  "15x21 cm",
  "A4 21x30 cm",
  "Digitális kép",
] as const;

export type PhotoPrintSize = (typeof PHOTO_PRINT_SIZES)[number];

export const DEFAULT_PHOTO_PRICES: Record<PhotoPrintSize, number> = {
  "10x15 cm": 600,
  "13x18 cm": 750,
  "15x21 cm": 1200,
  "A4 21x30 cm": 1900,
  "Digitális kép": 2000,
};

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("hu-HU")} Ft`;
}

export function resolvePhotoPrices(
  customPrices?: Partial<Record<PhotoPrintSize, number>> | Record<string, number> | null,
  fallbackPrices?: Partial<Record<PhotoPrintSize, number>> | Record<string, number> | null,
): Record<PhotoPrintSize, number> {
  const defaults = fallbackPrices
    ? {
        "10x15 cm": typeof fallbackPrices["10x15 cm"] === "number" && fallbackPrices["10x15 cm"] >= 0
          ? fallbackPrices["10x15 cm"]
          : DEFAULT_PHOTO_PRICES["10x15 cm"],
        "13x18 cm": typeof fallbackPrices["13x18 cm"] === "number" && fallbackPrices["13x18 cm"] >= 0
          ? fallbackPrices["13x18 cm"]
          : DEFAULT_PHOTO_PRICES["13x18 cm"],
        "15x21 cm": typeof fallbackPrices["15x21 cm"] === "number" && fallbackPrices["15x21 cm"] >= 0
          ? fallbackPrices["15x21 cm"]
          : DEFAULT_PHOTO_PRICES["15x21 cm"],
        "A4 21x30 cm": typeof fallbackPrices["A4 21x30 cm"] === "number" && fallbackPrices["A4 21x30 cm"] >= 0
          ? fallbackPrices["A4 21x30 cm"]
          : DEFAULT_PHOTO_PRICES["A4 21x30 cm"],
        "Digitális kép": typeof fallbackPrices["Digitális kép"] === "number" && fallbackPrices["Digitális kép"] >= 0
          ? fallbackPrices["Digitális kép"]
          : DEFAULT_PHOTO_PRICES["Digitális kép"],
      }
    : DEFAULT_PHOTO_PRICES;

  return {
    "10x15 cm": typeof customPrices?.["10x15 cm"] === "number" && customPrices["10x15 cm"] >= 0
      ? customPrices["10x15 cm"]
      : defaults["10x15 cm"],
    "13x18 cm": typeof customPrices?.["13x18 cm"] === "number" && customPrices["13x18 cm"] >= 0
      ? customPrices["13x18 cm"]
      : defaults["13x18 cm"],
    "15x21 cm": typeof customPrices?.["15x21 cm"] === "number" && customPrices["15x21 cm"] >= 0
      ? customPrices["15x21 cm"]
      : defaults["15x21 cm"],
    "A4 21x30 cm": typeof customPrices?.["A4 21x30 cm"] === "number" && customPrices["A4 21x30 cm"] >= 0
      ? customPrices["A4 21x30 cm"]
      : defaults["A4 21x30 cm"],
    "Digitális kép": typeof customPrices?.["Digitális kép"] === "number" && customPrices["Digitális kép"] >= 0
      ? customPrices["Digitális kép"]
      : defaults["Digitális kép"],
  };
}

export const STOCK_PHOTOS = [
  {
    id: "family-meadow",
    title: "Családi séta",
    alt: "Család a mezőn naplementében",
    src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "children-playing",
    title: "Közös játék",
    alt: "Gyermekek közös játék közben",
    src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "school-moment",
    title: "Iskolai pillanat",
    alt: "Gyermekek egy világos tanteremben",
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "celebration",
    title: "Ünnepi emlék",
    alt: "Ünnepi asztal és dekoráció",
    src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "portrait-light",
    title: "Természetes portré",
    alt: "Természetes fényben készült portré",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "wedding-detail",
    title: "Esküvői részlet",
    alt: "Esküvői csokor részlete",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82",
  },
] as const;
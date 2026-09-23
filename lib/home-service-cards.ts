export interface HomeServiceCardDefinition {
  key: string;
  title: string;
  description: string;
  href: string;
}

/** The 4 marketing service cards shown on the homepage "Miben segíthetek?" section. */
export const HOME_SERVICE_CARDS: readonly HomeServiceCardDefinition[] = [
  {
    key: "service-csaladi",
    title: "Családi fotózás",
    description: "Őszinte pillanatok. Közös emlékek. Rólatok.",
    href: "/csaladi-fotozas",
  },
  {
    key: "service-bolcsode-ovoda",
    title: "Bölcsődei & óvodai fotózás",
    description: "Gyermekfotózás szeretettel, türelemmel és természetesen.",
    href: "/bolcsodei-es-ovodai-fotozas",
  },
  {
    key: "service-iskola",
    title: "Iskolai fotózás",
    description: "Igényes portrék és közösségi képek.",
    href: "/iskolai-fotozas",
  },
  {
    key: "service-szezonalis",
    title: "Szezonális fotózás",
    description: "Karácsony, Anyák napja és különleges alkalmak.",
    href: "/szezonalis-fotozas",
  },
];

export function isHomeServiceCardKey(value: string): boolean {
  return HOME_SERVICE_CARDS.some((card) => card.key === value);
}

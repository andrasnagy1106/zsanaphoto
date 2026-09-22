import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("converts Hungarian characters and text to clean URL slug", () => {
    expect(slugify("Karácsonyi családi fotózás")).toBe("karacsonyi-csaladi-fotozas");
    expect(slugify("Óvodai fotózás - Őszi téma")).toBe("ovodai-fotozas-oszi-tema");
    expect(slugify("  Különleges & Egyedi Esemény!  ")).toBe("kulonleges-egyedi-esemeny");
  });
});

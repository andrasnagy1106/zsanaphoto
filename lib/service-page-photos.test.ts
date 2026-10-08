import { describe, expect, it } from "vitest";
import RedirectToPortraitPhotographyPage from "@/app/(public)/intezmenyi-fotozas/page";
import sitemap from "@/app/sitemap";
import { HOME_SERVICE_CARDS, isHomeServiceCardKey } from "./home-service-cards";
import { getDefaultHomeTexts, getServiceCardTexts } from "./home-texts";
import {
  PAGE_PHOTO_COLLECTIONS,
  isPagePhotoKey,
  isServicePagePhotoKey,
} from "./service-page-photos";

describe("portrait photography presentation", () => {
  it("places the portrait photo collection after family photos while preserving existing uploads", () => {
    expect(PAGE_PHOTO_COLLECTIONS[0].href).toBe("/csaladi-fotozas");
    expect(PAGE_PHOTO_COLLECTIONS[1]).toEqual({
      key: "oldal:intezmenyi-fotozas",
      label: "Portré fotózás",
      href: "/portre-fotozas",
    });
    expect(isPagePhotoKey("oldal:intezmenyi-fotozas")).toBe(true);
    expect(isServicePagePhotoKey("oldal:intezmenyi-fotozas")).toBe(true);
    expect(isPagePhotoKey("oldal:rolam")).toBe(true);
  });

  it("places the portrait service card after family photography and allows its photo upload", () => {
    expect(HOME_SERVICE_CARDS[0].href).toBe("/csaladi-fotozas");
    expect(HOME_SERVICE_CARDS[1]).toMatchObject({
      key: "service-portre",
      title: "Portré fotózás",
      href: "/portre-fotozas",
    });
    expect(isHomeServiceCardKey("service-portre")).toBe(true);
  });

  it("provides editable portrait card texts and a new hero button label", () => {
    const texts = getDefaultHomeTexts();
    expect(texts["hero.portraitButton"]).toBe("Portré fotózás");
    expect(getServiceCardTexts(texts, HOME_SERVICE_CARDS[1])).toEqual({
      title: HOME_SERVICE_CARDS[1].title,
      description: HOME_SERVICE_CARDS[1].description,
    });
  });

  it("lists the portrait URL instead of the old institutional URL in the sitemap", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain("/portre-fotozas");
    expect(urls).not.toContain("/intezmenyi-fotozas");
  });

  it("permanently redirects the old institutional page to the portrait page", () => {
    expect(RedirectToPortraitPhotographyPage).toThrow(
      expect.objectContaining({ digest: "NEXT_REDIRECT;replace;/portre-fotozas;308;" }),
    );
  });
});
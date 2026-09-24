import { describe, expect, it } from "vitest";
import { formatHungarianCityName, getHungarianCityByPostalCode } from "./hungarian-postal-codes";

describe("getHungarianCityByPostalCode", () => {
  it("resolves Budapest for 1xxx postal codes", () => {
    expect(getHungarianCityByPostalCode("1011")).toBe("Budapest");
    expect(getHungarianCityByPostalCode("1134")).toBe("Budapest");
    expect(getHungarianCityByPostalCode("1239")).toBe("Budapest");
  });

  it("resolves known Hungarian settlements", () => {
    expect(getHungarianCityByPostalCode("6411")).toBe("Zsana");
    expect(getHungarianCityByPostalCode("6400")).toBe("Kiskunhalas");
    expect(getHungarianCityByPostalCode("6000")).toBe("Kecskemét");
    expect(getHungarianCityByPostalCode("6720")).toBe("Szeged");
    expect(getHungarianCityByPostalCode("4024")).toBe("Debrecen");
    expect(getHungarianCityByPostalCode("9021")).toBe("Győr");
    expect(getHungarianCityByPostalCode("7621")).toBe("Pécs");
  });

  it("handles whitespace in postal codes", () => {
    expect(getHungarianCityByPostalCode(" 6411 ")).toBe("Zsana");
  });

  it("returns null for non-4-digit or invalid codes", () => {
    expect(getHungarianCityByPostalCode("")).toBe(null);
    expect(getHungarianCityByPostalCode("123")).toBe(null);
    expect(getHungarianCityByPostalCode("12345")).toBe(null);
    expect(getHungarianCityByPostalCode("ABCD")).toBe(null);
    expect(getHungarianCityByPostalCode("99999")).toBe(null);
  });
});

describe("formatHungarianCityName", () => {
  it("capitalizes the first letter of cities and words", () => {
    expect(formatHungarianCityName("budapest")).toBe("Budapest");
    expect(formatHungarianCityName("kiskunhalas")).toBe("Kiskunhalas");
    expect(formatHungarianCityName("érd")).toBe("Érd");
    expect(formatHungarianCityName("újfehértó")).toBe("Újfehértó");
    expect(formatHungarianCityName("balaton-füred")).toBe("Balaton-Füred");
    expect(formatHungarianCityName("hódmezővásárhely")).toBe("Hódmezővásárhely");
  });

  it("handles empty string", () => {
    expect(formatHungarianCityName("")).toBe("");
  });
});


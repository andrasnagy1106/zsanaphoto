import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/szolgaltatasok",
  "/csaladi-fotozas",
  "/portre-fotozas",
  "/bolcsodei-es-ovodai-fotozas",
  "/iskolai-fotozas",
  "/szezonalis-fotozas",
  "/galeria",
  "/rolam",
  "/kapcsolat",
  "/idopontfoglalas",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  return ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
  }));
}

import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/csaladi-fotozas",
  "/intezmenyi-fotozas",
  "/galeria",
  "/rolam",
  "/kapcsolat",
  "/idopontfoglalas",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}

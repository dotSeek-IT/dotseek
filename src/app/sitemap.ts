import type { MetadataRoute } from "next";
import { pages } from "@/content/pages";
import { site } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-13");
  return [
    { url: `${site.url}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/contact`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    ...pages
      .filter((page) => page.status === "published")
      .map((page) => ({
        url: `${site.url}/${page.slug}`,
        lastModified,
        changeFrequency: "yearly" as const,
        priority: page.eyebrow === "Legal" ? 0.3 : 0.7,
      })),
  ];
}

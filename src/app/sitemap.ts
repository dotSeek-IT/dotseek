import type { MetadataRoute } from "next";
import { pages } from "@/content/pages";
import { site } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Bump when page content or search metadata changes, so search engines recrawl.
  const lastModified = new Date("2026-10-16");
  return [
    {
      url: `${site.url}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      // Image sitemap: the DotSeek logo files, so Google Images can find them.
      images: [`${site.url}/dotseek-logo.png`, `${site.url}/dotseek-logo-wordmark.png`],
    },
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

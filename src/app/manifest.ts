import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/** Web app manifest: name and icons for browsers, Android and search. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c10",
    theme_color: "#0b0c10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

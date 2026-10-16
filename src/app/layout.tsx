import type { Metadata, Viewport } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import { site, socialLinks } from "@/content/site";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ubuntu-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.seoTitle,
    template: `%s | ${site.name}`,
  },
  description: site.seoDescription,
  applicationName: site.name,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: site.name,
    title: site.seoTitle,
    description: site.seoDescription,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${site.name}: AI Business Automation Solutions` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seoTitle,
    description: site.seoDescription,
    images: ["/og-image.png"],
  },
  // Set GOOGLE_SITE_VERIFICATION at build time to verify in Google Search Console.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.webmanifest",
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
  colorScheme: "dark",
};

// Enables scroll-reveal hidden states only when JS runs and motion is allowed.
const motionScript = `try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-motion')}}catch(e){}`;

// Structured data so Google understands the organisation and site.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: { "@type": "ImageObject", url: `${site.url}/logo.png`, width: 512, height: 512 },
      image: [
        { "@type": "ImageObject", url: `${site.url}/dotseek-logo.png`, caption: "DotSeek logo", width: 512, height: 512 },
        { "@type": "ImageObject", url: `${site.url}/dotseek-logo-wordmark.png`, caption: "DotSeek logo with name", width: 1200, height: 400 },
        `${site.url}/og-image.png`,
      ],
      description: site.description,
      email: site.email,
      address: { "@type": "PostalAddress", addressLocality: "Swansea", addressCountry: "GB" },
      sameAs: socialLinks.map((link) => link.href).filter((href) => href.startsWith("http")),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en-GB",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${ubuntu.variable} ${ubuntuMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

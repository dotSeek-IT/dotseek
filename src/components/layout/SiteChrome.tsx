import type { ReactNode } from "react";
import { DotSeekAssistant } from "@/components/assistant/DotSeekAssistant";
import { PageViews } from "@/components/analytics/Tracker";
import { CookieNotice } from "./CookieNotice";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Public website chrome: skip link, header, footer, cookie notice, the AI consultant and anonymous page views. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CookieNotice />
      <DotSeekAssistant />
      <PageViews />
    </>
  );
}

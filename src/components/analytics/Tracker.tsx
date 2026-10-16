"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ClientEvent } from "@/lib/analytics/events";

/**
 * Anonymous visit statistics: page views and journey steps go to our own
 * /api/analytics. No cookies and nothing is stored on the device: the server links
 * a visit's steps itself, and records each step only once per visit, so calling
 * `track` more than once is harmless. Browsers that send Global Privacy Control
 * or Do Not Track are not counted at all.
 */

const optedOut = () => {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
  } catch {
    return true;
  }
};

function send(body: Record<string, unknown>) {
  if (typeof window === "undefined" || optedOut()) return;
  try {
    const json = JSON.stringify(body);
    if (navigator.sendBeacon?.("/api/analytics", new Blob([json], { type: "application/json" }))) return;
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true }).catch(() => undefined);
  } catch {
    // Statistics never affect the page.
  }
}

/** Records a journey step, with the service, currency and estimate when known. */
export function track(name: ClientEvent, data: { service?: string; currency?: string; estimateGbp?: number } = {}) {
  send({ t: "step", name, ...data });
}

/** One page view per route change; the referrer and campaign tag with the first view of the visit. */
export function PageViews() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const landing = first.current;
    first.current = false;
    const search = new URLSearchParams(window.location.search);
    send({
      t: "view",
      path: pathname,
      ref: landing ? document.referrer : "",
      utm: landing ? (search.get("utm_source") ?? "") : "",
      quote: landing && search.has("quote"),
    });
  }, [pathname]);
  return null;
}

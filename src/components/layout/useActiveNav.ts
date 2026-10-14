"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Homepage scroll-spy targets in page order, mapped to the nav href they
 * activate. `null` means "no nav item" (e.g. sections the menu doesn't list).
 */
const SPY_TARGETS: { id: string; href: string | null }[] = [
  { id: "solutions", href: "/#solutions" },
  { id: "capabilities", href: "/#capabilities" },
  { id: "workflow", href: "/#capabilities" },
  { id: "agents", href: "/#agents" },
  { id: "departments", href: null },
  { id: "industries", href: "/#industries" },
  { id: "systems", href: null },
  { id: "process", href: "/#process" },
  { id: "results", href: null },
];

/**
 * Returns the href of the nav item that should show as active:
 * - on other routes, the item whose href matches the pathname (e.g. /about);
 * - on the homepage, the section currently under the header (scroll-spy).
 * `select(href)` marks a clicked item active immediately and holds it until
 * the smooth scroll to that section finishes, so items don't flicker past.
 */
export function useActiveNav(hrefs: string[]) {
  const pathname = usePathname();
  const [spyHref, setSpyHref] = useState<string | null>(null);
  const lockRef = useRef<string | null>(null);
  const releaseRef = useRef<number | undefined>(undefined);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setSpyHref(null);
      return;
    }

    let frame = 0;
    const update = () => {
      // A section is "current" once its top passes a line just below the
      // header. This matches where sections land after a nav click (CSS
      // scroll-padding), and lets short targets like Industries win.
      const headerBottom = document.querySelector("body > header")?.getBoundingClientRect().bottom ?? 72;
      const line = Math.min(headerBottom + 140, window.innerHeight * 0.5);
      let current: string | null = null;
      for (const target of SPY_TARGETS) {
        const el = document.getElementById(target.id);
        if (el && el.getBoundingClientRect().top <= line) current = target.href;
      }
      // Past the end of the page content (footer), nothing is active.
      // body > footer: the site footer, not the <footer> inside cards.
      const footer = document.querySelector("body > footer");
      if (footer && footer.getBoundingClientRect().top < line) current = null;
      // After a nav click, keep the clicked item until its section arrives,
      // so sections passed during the smooth scroll don't flash active.
      if (lockRef.current) {
        if (current !== lockRef.current) return;
        lockRef.current = null;
      }
      setSpyHref(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  useEffect(() => () => window.clearTimeout(releaseRef.current), []);

  const select = useCallback(
    (href: string) => {
      if (!href.startsWith("/#") || !isHome) return;
      lockRef.current = href;
      setSpyHref(href);
      window.clearTimeout(releaseRef.current);
      // Safety net: if the section can't reach the line (e.g. near the page
      // end), release the hold and fall back to normal scroll-spy.
      releaseRef.current = window.setTimeout(() => {
        lockRef.current = null;
        window.dispatchEvent(new Event("scroll"));
      }, 1500);
    },
    [isHome],
  );

  const active = isHome ? spyHref : (hrefs.find((href) => href === pathname) ?? null);
  return { active, select, pathname };
}

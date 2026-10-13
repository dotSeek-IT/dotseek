"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { mainNav, site } from "@/content/site";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Logo } from "@/components/common/Logo";
import { useActiveNav } from "./useActiveNav";
import styles from "./Header.module.css";

const navHrefs = mainNav.map((item) => item.href);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { active, select, pathname } = useActiveNav(navHrefs);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Mobile menu: lock scroll, close on Escape, keep focus inside, close on desktop resize.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [toggleRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a")].filter(
        Boolean,
      ) as HTMLElement[];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && close(false);

    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [open, close]);

  return (
    <header className={[styles.header, scrolled && styles.scrolled, open && styles.open].filter(Boolean).join(" ")}>
      <div className={styles.bar}>
        <Logo />

        <nav aria-label="Main" className={styles.desktopNav}>
          <ul role="list" className={styles.navList}>
            {mainNav.map((item) => {
              const current = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[styles.navLink, current && styles.navLinkActive].filter(Boolean).join(" ")}
                    aria-current={current ? (item.href.startsWith("/#") ? "location" : "page") : undefined}
                    onClick={() => select(item.href)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button href={site.primaryCta.href} size="sm" className={styles.cta}>
            {site.primaryCta.label}
          </Button>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        className={styles.mobilePanel}
        hidden={!open}
      >
        <nav aria-label="Mobile">
          <ul role="list" className={styles.mobileList}>
            {mainNav.map((item) => {
              const current = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[styles.mobileLink, current && styles.mobileLinkActive].filter(Boolean).join(" ")}
                    aria-current={current ? (item.href.startsWith("/#") ? "location" : "page") : undefined}
                    onClick={() => {
                      select(item.href);
                      close(false);
                    }}
                  >
                    {item.label}
                    <Icon name="arrow" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Button href={site.talkCta.href} size="lg" className={styles.mobileCta} onClick={() => close(false)}>
          {site.talkCta.label}
        </Button>
      </div>
    </header>
  );
}

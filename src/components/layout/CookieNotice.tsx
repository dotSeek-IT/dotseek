"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CookieNotice.module.css";

const STORAGE_KEY = "ds-cookie-notice";

/**
 * Informational cookie notice. The site sets no cookies and runs no tracking,
 * so no consent is needed; this tells visitors so and links to the policy.
 * If analytics are ever added, turn this into a real consent prompt that
 * blocks those scripts until the visitor accepts.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* storage unavailable: the notice simply shows again next visit */
    }
  };

  if (!visible) return null;

  return (
    <section className={styles.notice} aria-label="Cookie notice">
      <p className={styles.text}>
        <strong>No tracking cookies.</strong> This website doesn&apos;t use analytics or advertising cookies. It only
        remembers that you closed this message. <Link href="/cookies">Cookie policy</Link> ·{" "}
        <Link href="/privacy">Privacy policy</Link>
      </p>
      <button type="button" className={styles.button} onClick={dismiss}>
        Got it
      </button>
    </section>
  );
}

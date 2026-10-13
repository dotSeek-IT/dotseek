import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type BadgeProps = {
  children: ReactNode;
  /** `eyebrow` = pill above headings; `tag` = small label inside cards; `status` = live state. */
  variant?: "eyebrow" | "tag" | "status";
  tone?: "brand" | "success" | "warning" | "neutral";
  dot?: boolean;
  className?: string;
};

export function Badge({ children, variant = "eyebrow", tone = "brand", dot = false, className }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant], styles[tone], className].filter(Boolean).join(" ")}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import styles from "./GradientText.module.css";

/**
 * `highlight` = signal-yellow gradient for the key phrase of a heading.
 * Headings themselves get the white→grey gradient from SectionHeading/Hero.
 */
export function GradientText({ children }: { children: ReactNode }) {
  return <span className={styles.highlight}>{children}</span>;
}

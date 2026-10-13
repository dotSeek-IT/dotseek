import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./Section.module.css";

type SectionProps = {
  id?: string;
  children: ReactNode;
  /** Visual band: transparent over the page, or the raised secondary background. */
  tone?: "default" | "raised";
  spacing?: "default" | "compact" | "none";
  container?: "default" | "narrow" | false;
  labelledBy?: string;
  className?: string;
};

export function Section({
  id,
  children,
  tone = "default",
  spacing = "default",
  container = "default",
  labelledBy,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={[styles.section, styles[tone], styles[`space-${spacing}`], className].filter(Boolean).join(" ")}
    >
      {container ? <Container size={container}>{children}</Container> : children}
    </section>
  );
}

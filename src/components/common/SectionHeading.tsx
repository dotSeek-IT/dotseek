import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { Reveal } from "./Reveal";
import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "center" | "left";
  /** Heading level; sections use h2. */
  level?: "h1" | "h2";
  size?: "default" | "large";
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  align = "center",
  level: Heading = "h2",
  size = "default",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal variant="blur" className={[styles.heading, styles[align], className].filter(Boolean).join(" ")}>
      {eyebrow && (
        <Badge variant="eyebrow" dot>
          {eyebrow}
        </Badge>
      )}
      <Heading id={id} className={[styles.title, size === "large" && styles.large].filter(Boolean).join(" ")}>
        {title}
      </Heading>
      {body && <p className={styles.body}>{body}</p>}
    </Reveal>
  );
}

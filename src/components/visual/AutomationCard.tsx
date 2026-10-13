import type { ReactNode } from "react";
import styles from "./AutomationCard.module.css";

type AutomationCardProps = {
  title: string;
  body: string;
  visual: ReactNode;
  /** `stacked` = visual above text (default); `split` = text beside visual. */
  layout?: "stacked" | "split";
};

/**
 * Bento card: product vignette sitting in a yellow corner-glow well, with
 * title and description. The visual is decorative (aria-hidden).
 */
export function AutomationCard({ title, body, visual, layout = "stacked" }: AutomationCardProps) {
  return (
    <article className={[styles.card, styles[layout], "ds-spotlight"].join(" ")}>
      <div className={styles.well} aria-hidden="true">
        <div className={styles.glow} />
        <div className={styles.visual}>{visual}</div>
      </div>
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.body}>{body}</p>
      </div>
    </article>
  );
}

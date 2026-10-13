import styles from "./LogoCloud.module.css";

type LogoCloudProps = {
  items: string[];
  /** Accessible name for the list. */
  label: string;
  reverse?: boolean;
  /** Visual style: plain wordmarks or bordered tiles. */
  variant?: "wordmark" | "tile";
  speed?: number;
};

/**
 * Infinite horizontal marquee of system names. The list is rendered twice for
 * a seamless loop; the duplicate is aria-hidden. Pauses on hover/focus and
 * becomes a static wrapped list under prefers-reduced-motion.
 */
export function LogoCloud({ items, label, reverse = false, variant = "wordmark", speed = 40 }: LogoCloudProps) {
  return (
    <div
      className={[styles.cloud, styles[variant], reverse && styles.reverse].filter(Boolean).join(" ")}
      style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
    >
      <div className={styles.track}>
        <ul className={styles.list} aria-label={label}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              <span className={styles.glyph} aria-hidden="true">
                {item.charAt(0)}
              </span>
              {item}
            </li>
          ))}
        </ul>
        <ul className={`${styles.list} ${styles.clone}`} aria-hidden="true">
          {items.map((item) => (
            <li key={item} className={styles.item}>
              <span className={styles.glyph}>{item.charAt(0)}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

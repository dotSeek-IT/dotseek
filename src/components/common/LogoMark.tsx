import styles from "./LogoMark.module.css";

/**
 * The DotSeek mark: a signal-yellow "seek" ring with its orbit dot around a
 * centre dot. The same drawing is used by the site logo, the chat avatar, the
 * quotation letterhead and every loader (`spin`: the ring and orbit dot turn
 * around the steady centre, like the logo searching).
 */
export function LogoMark({
  size = 28,
  spin = false,
  className,
  label,
}: {
  size?: number;
  spin?: boolean;
  className?: string;
  /** Accessible name; without it the mark is decorative. */
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={[styles.mark, spin ? styles.spin : "", className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <g className={styles.orbit}>
        <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="52 20" strokeLinecap="round" />
        <circle cx="27.2" cy="8" r="2" fill="currentColor" />
      </g>
      <circle className={styles.core} cx="16" cy="16" r="4.4" fill="currentColor" />
    </svg>
  );
}

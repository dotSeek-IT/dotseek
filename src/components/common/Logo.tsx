import Link from "next/link";
import styles from "./Logo.module.css";

/** DotSeek wordmark: a signal-yellow "seek" ring around a dot, plus the name. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={[styles.logo, className].filter(Boolean).join(" ")} aria-label="DotSeek home">
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="52 20" strokeLinecap="round" />
        <circle cx="16" cy="16" r="4.4" fill="currentColor" />
        <circle cx="27.2" cy="8" r="2" fill="currentColor" />
      </svg>
      <span className={styles.word}>DotSeek</span>
    </Link>
  );
}

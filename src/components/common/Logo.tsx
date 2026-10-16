import Link from "next/link";
import { LogoMark } from "./LogoMark";
import styles from "./Logo.module.css";

/** DotSeek wordmark: a signal-yellow "seek" ring around a dot, plus the name. */
export function Logo({ className, target, href = "/", label = "DotSeek home" }: { className?: string; target?: "_top"; href?: string; label?: string }) {
  return (
    <Link href={href} target={target} className={[styles.logo, className].filter(Boolean).join(" ")} aria-label={label}>
      <LogoMark className={styles.mark} />
      <span className={styles.word}>DotSeek</span>
    </Link>
  );
}

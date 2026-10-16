import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

/**
 * DotSeek wordmark: a signal-yellow "seek" ring around a dot, plus the name. The mark is a real
 * image file (not an inline drawing) so search engines, including Google Images, can index it.
 */
export function Logo({ className, target, href = "/", label = "DotSeek home" }: { className?: string; target?: "_top"; href?: string; label?: string }) {
  return (
    <Link href={href} target={target} className={[styles.logo, className].filter(Boolean).join(" ")} aria-label={label}>
      <Image src="/dotseek-logo.png" alt="DotSeek logo" width={56} height={56} className={styles.mark} unoptimized priority />
      <span className={styles.word}>DotSeek</span>
    </Link>
  );
}

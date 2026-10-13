import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Button.module.css";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "sm";
  /** Trailing arrow; default on for primary. */
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
};

/**
 * Link-styled button. DotSeek CTAs navigate (anchors, routes, mailto/tel),
 * so this always renders an anchor: never nest it inside another link.
 */
export function Button({ href, children, variant = "primary", size = "md", arrow, className, onClick }: ButtonProps) {
  const showArrow = arrow ?? variant === "primary";
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span>{children}</span>
      {showArrow && <Icon name="arrow" className={styles.arrow} />}
    </>
  );
  const isInternal = href.startsWith("/") && !href.startsWith("//");

  return isInternal ? (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <a href={href} className={classes} onClick={onClick}>
      {content}
    </a>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type ButtonProps = {
  /** Navigates when set (route, anchor, mailto/tel). Without it, renders a <button>. */
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "sm";
  /** Trailing arrow; default on for primary. Nudges right on hover. */
  arrow?: boolean;
  /** Optional leading icon (static, does not animate). */
  icon?: IconName;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * The site's single button style. Renders a link when `href` is given and a
 * `<button type="button">` for in-page actions (e.g. opening the assistant),
 * so every call to action shares the same look, hover and focus states.
 * Never nest it inside another link or button.
 */
export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow,
  icon,
  className,
  onClick,
  disabled,
}: ButtonProps) {
  const showArrow = arrow ?? variant === "primary";
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  const content = (
    <>
      {icon && <Icon name={icon} className={styles.icon} />}
      <span>{children}</span>
      {showArrow && <Icon name="arrow" className={styles.arrow} />}
    </>
  );

  if (!href) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  }

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

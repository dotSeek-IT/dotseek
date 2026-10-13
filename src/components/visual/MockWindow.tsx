import type { ReactNode } from "react";
import styles from "./MockWindow.module.css";

type MockWindowProps = {
  title?: string;
  children: ReactNode;
  /** Right-side toolbar content (badges, actions). */
  toolbar?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * Product-UI frame used by every DotSeek interface mockup.
 * Mockups are decorative illustrations: the frame is aria-hidden by the
 * caller's figure and summarised with a visually hidden caption.
 */
export function MockWindow({ title, children, toolbar, className, bodyClassName }: MockWindowProps) {
  return (
    <div className={[styles.window, className].filter(Boolean).join(" ")}>
      <div className={styles.chrome}>
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
        {title && <span className={styles.title}>{title}</span>}
        <span className={styles.toolbar}>{toolbar}</span>
      </div>
      <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}

import type { ElementType, ReactNode } from "react";
import styles from "./Container.module.css";

type ContainerProps = {
  children: ReactNode;
  /** `narrow` caps content at --ds-container-narrow (FAQ, long-form text). */
  size?: "default" | "narrow";
  as?: ElementType;
  className?: string;
};

export function Container({ children, size = "default", as: Tag = "div", className }: ContainerProps) {
  return (
    <Tag className={[styles.container, size === "narrow" && styles.narrow, className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}

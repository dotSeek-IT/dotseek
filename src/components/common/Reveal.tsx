"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Direction / style of entry. */
  variant?: "up" | "scale" | "left" | "right" | "blur";
  /** Position in a staggered group; multiplied by --ds-stagger. */
  index?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Scroll reveal. Adds `is-visible` once the element enters the viewport.
 * Hidden state is only applied under `html.js-motion` (set in layout when
 * motion is allowed), so content is always visible without JS or with
 * prefers-reduced-motion.
 */
export function Reveal({ children, as: Tag = "div", variant = "up", index = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant === "up" ? "" : variant}
      className={className}
      style={{ ...style, "--reveal-index": index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

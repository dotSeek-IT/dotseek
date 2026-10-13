"use client";

import { useRef, type ElementType, type PointerEvent, type ReactNode } from "react";

type SpotlightGroupProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  role?: string;
};

/**
 * Tracks the pointer across a group of `.ds-spotlight` cards and writes each
 * card's local --mx/--my so its border glow follows the cursor. One listener
 * per group; no effect on touch devices (no hover).
 */
export function SpotlightGroup({ children, as: Tag = "div", className, role }: SpotlightGroupProps) {
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    for (const card of ref.current.querySelectorAll<HTMLElement>(".ds-spotlight")) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }
  };

  return (
    <Tag
      ref={ref}
      role={role}
      className={["ds-spotlight-group", className].filter(Boolean).join(" ")}
      onPointerMove={onPointerMove}
    >
      {children}
    </Tag>
  );
}

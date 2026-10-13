"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./HeroBackdrop.module.css";

/**
 * Animated banner pattern: hairline grid, light beams travelling along grid
 * lines, pulsing grid cells, a twinkling particle field and a pointer-follow
 * spotlight that brightens the grid. All positions snap to --ds-grid-size.
 * Purely decorative; motion stops under prefers-reduced-motion.
 */

type Beam = { axis: "h" | "v"; line: number; delay: number; duration: number; reverse?: boolean };

const beams: Beam[] = [
  { axis: "h", line: 3, delay: 0, duration: 7 },
  { axis: "h", line: 7, delay: 3.2, duration: 9, reverse: true },
  { axis: "h", line: 11, delay: 5.5, duration: 8 },
  { axis: "v", line: 4, delay: 1.4, duration: 6 },
  { axis: "v", line: 9, delay: 4.1, duration: 7.5 },
  { axis: "v", line: 17, delay: 0.8, duration: 6.5, reverse: true },
  { axis: "v", line: 22, delay: 2.6, duration: 8 },
];

const cells = [
  { col: 3, row: 2, delay: 0 },
  { col: 18, row: 3, delay: 1.6 },
  { col: 6, row: 6, delay: 3.1 },
  { col: 15, row: 8, delay: 4.4 },
  { col: 21, row: 5, delay: 2.2 },
  { col: 1, row: 9, delay: 5.3 },
];

// Deterministic pseudo-random particles (stable between server and client).
const particles = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  // Round so server and client serialise identical style strings.
  const fix = (n: number) => Math.round(n * 100) / 100;
  return {
    x: `${fix(r(1) * 26)}%`,
    y: `${fix(58 + r(2) * 40)}%`,
    size: `${fix(1 + r(3) * 2.4)}px`,
    delay: `${fix(r(4) * 6)}s`,
    duration: `${fix(2.5 + r(5) * 3.5)}s`,
  };
});

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    if (!node || !host || window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        node.style.setProperty("--my", `${event.clientY - rect.top}px`);
        node.dataset.active = "true";
      });
    };
    const onLeave = () => {
      node.dataset.active = "false";
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={styles.backdrop} aria-hidden="true">
      <div className={styles.grid} />
      <div className={styles.spotlight} />

      {cells.map((cell) => (
        <span
          key={`${cell.col}-${cell.row}`}
          className={styles.cell}
          style={{ "--col": cell.col, "--row": cell.row, animationDelay: `${cell.delay}s` } as CSSProperties}
        />
      ))}

      {beams.map((beam) => (
        <span
          key={`${beam.axis}-${beam.line}`}
          className={[styles.beam, styles[beam.axis], beam.reverse && styles.reverse].filter(Boolean).join(" ")}
          style={
            {
              "--line": beam.line,
              animationDelay: `${beam.delay}s`,
              animationDuration: `${beam.duration}s`,
            } as CSSProperties
          }
        />
      ))}

      <div className={styles.particles}>
        {particles.map((p, i) => (
          <span
            key={i}
            style={
              {
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.duration,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.vignette} />
    </div>
  );
}

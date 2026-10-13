"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { manifesto } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { Container } from "@/components/layout/Container";
import styles from "./ManifestoSection.module.css";

/**
 * Editorial statement whose words light up as the section scrolls through
 * the viewport. Progress (0–1) is written to --p; each word derives its own
 * opacity from its index, so only one scroll listener runs.
 */
export function ManifestoSection() {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = manifesto.text.split(" ");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the text top reaches 85% of the viewport, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = (start - rect.top) / (start - end + rect.height);
      node.style.setProperty("--p", String(Math.min(1, Math.max(0, progress))));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="manifesto-title">
      <Container className={styles.inner}>
        <Badge variant="eyebrow" dot>
          <span id="manifesto-title">{manifesto.eyebrow}</span>
        </Badge>
        <p ref={ref} className={styles.text} style={{ "--n": words.length } as CSSProperties}>
          {words.map((word, i) => (
            <span key={i} className={styles.word} style={{ "--i": i } as CSSProperties}>
              {word}{" "}
            </span>
          ))}
        </p>
      </Container>
    </section>
  );
}

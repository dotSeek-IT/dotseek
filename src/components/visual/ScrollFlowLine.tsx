"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import styles from "./ScrollFlowLine.module.css";

type Node = { y: number };

/**
 * Scroll-scrubbed "data flow" line. It starts on a grid line inside the hero
 * banner and draws down through every section as the page scrolls, then
 * retracts along the same path when scrolling back up. At each section heading
 * a node lights up and a connector joins the line to the content edge.
 *
 * Must be the first child of a `position: relative` wrapper around the
 * homepage sections. Sets --flow-x on <html> so HeroBackdrop's grid aligns
 * a grid line exactly under the flow line.
 */
export function ScrollFlowLine() {
  const rootRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const probe = probeRef.current;
    const wrapper = root?.parentElement;
    if (!root || !probe || !wrapper) return;

    let frame = 0;
    let start = 0;
    let end = 0;
    let nodeYs: number[] = [];

    const measure = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperTop = wrapperRect.top + window.scrollY;
      // X: centre of the gutter between page edge and content.
      const contentLeft = probe.getBoundingClientRect().left;
      const x = Math.round(contentLeft / 2);
      document.documentElement.style.setProperty("--flow-x", `${x}px`);
      root.style.setProperty("--flow-x", `${x}px`);
      root.style.setProperty("--connector", `${Math.max(0, contentLeft - x - 10)}px`);

      const sections = [...wrapper.children].filter((el) => el.tagName === "SECTION");
      const heroTitle = sections[0]?.querySelector("h1");
      start = heroTitle ? heroTitle.getBoundingClientRect().top + window.scrollY - wrapperTop - 40 : 120;
      end = wrapperRect.height - 48;

      nodeYs = sections.slice(1).map((section) => {
        const heading = section.querySelector("h2, [id$='-title']") ?? section;
        return Math.round(heading.getBoundingClientRect().top + window.scrollY - wrapperTop + 12);
      });
      root.style.setProperty("--start", `${start}px`);
      root.style.setProperty("--length", `${end - start}px`);
      setNodes(nodeYs.map((y) => ({ y })));
      update();
    };

    const update = () => {
      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      // Head follows a point 62% down the viewport, clamped to the track.
      const head = Math.min(end, Math.max(start, window.scrollY + window.innerHeight * 0.62 - wrapperTop));
      root.style.setProperty("--head", `${head - start}px`);
      root.querySelectorAll<HTMLElement>("[data-node]").forEach((node, i) => {
        node.toggleAttribute("data-lit", head >= nodeYs[i]);
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    measure();
    // Re-measure after fonts/images settle and whenever layout changes size.
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    resizeObserver.observe(wrapper);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <div className={styles.probe} aria-hidden="true">
        <Container>
          <span ref={probeRef} />
        </Container>
      </div>
      <div ref={rootRef} className={styles.flow} aria-hidden="true">
        <span className={styles.track} />
        <span className={styles.fill} />
        <span className={styles.head} />
        {nodes.map((node, i) => (
          <span key={i} data-node="" className={styles.node} style={{ top: node.y }}>
            <i className={styles.connector} />
          </span>
        ))}
      </div>
    </>
  );
}

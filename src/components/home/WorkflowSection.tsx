"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { workflow } from "@/content/home";
import { GradientText } from "@/components/common/GradientText";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import { WorkflowDiagram } from "@/components/visual/WorkflowDiagram";
import styles from "./WorkflowSection.module.css";

const AUTO_ADVANCE_MS = 7000;

/**
 * Numbered Capture → Measure storytelling as an ARIA tablist.
 * Auto-advances on wide screens while visible until the visitor interacts;
 * never on narrow screens or under prefers-reduced-motion.
 */
export function WorkflowSection() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stages = workflow.stages;

  useEffect(() => {
    // No auto-advance under reduced motion, or on narrow screens where the
    // stacked panel changes height and would shift the page while reading.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 959px)").matches
    ) {
      setAuto(false);
    }
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % stages.length), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [active, auto, inView, stages.length]);

  const select = (index: number, focus = false) => {
    setAuto(false);
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = stages.length - 1;
    const keys: Record<string, number> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowRight: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key], true);
    }
  };

  const stage = stages[active];

  return (
    <Section id="workflow" tone="raised" labelledBy="workflow-title">
      <SectionHeading
        id="workflow-title"
        eyebrow={workflow.eyebrow}
        title={
          <>
            From Incoming Request to <GradientText>Completed Outcome</GradientText>
          </>
        }
      />

      <Reveal className={styles.layout}>
        <div ref={rootRef} className={styles.tabs} role="tablist" aria-label="Automation stages" aria-orientation="vertical">
          {stages.map((item, index) => {
            const selected = index === active;
            return (
              <button
                key={item.number}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`stage-tab-${index}`}
                aria-selected={selected}
                aria-controls="stage-panel"
                tabIndex={selected ? 0 : -1}
                className={[styles.tab, selected && styles.tabActive].filter(Boolean).join(" ")}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className={styles.number}>{item.number}</span>
                <span className={styles.tabText}>
                  <span className={styles.tag}>{item.tag}</span>
                  <span className={styles.tabTitle}>{item.title}</span>
                </span>
                {selected && auto && inView && <span className={styles.progress} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${active}`} className={styles.panel}>
          <div key={stage.number} className={styles.panelInner}>
            <div className={styles.visualWell} aria-hidden="true">
              <div className={styles.glow} />
              <WorkflowDiagram stage={stage.visual} />
            </div>
            <div className={styles.panelText}>
              <h3 className={styles.panelTitle}>
                <span className={styles.panelNumber}>{stage.number}</span> {stage.title}
              </h3>
              <p>{stage.body}</p>
              <ul className={styles.points}>
                {stage.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

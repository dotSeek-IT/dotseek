"use client";

import { useEffect, useRef } from "react";
import { echarts, type ECharts, type EChartsCoreOption } from "./echarts";
import styles from "./Dashboard.module.css";

type Handler = (params: Record<string, unknown> & { name?: string; data?: unknown; dataIndex?: number }) => void;

/**
 * Thin React wrapper for a modular ECharts instance: resizes with its container,
 * updates smoothly when the option changes, and forwards events. `onReady`
 * exposes the instance for linked highlighting (dispatchAction).
 */
export function EChart({
  option,
  height,
  label,
  events,
  onReady,
  minWidth,
  replace = false,
}: {
  option: EChartsCoreOption;
  height: number;
  /** Accessible description of what the chart shows. */
  label: string;
  events?: Partial<Record<"click" | "mouseover" | "mouseout" | "globalout" | "datazoom", Handler>>;
  onReady?: (chart: ECharts | null) => void;
  /** Below this width the chart scrolls sideways instead of squashing its labels. */
  minWidth?: number;
  /** Replace the whole option instead of merging (for series that change shape). */
  replace?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);
  const handlers = useRef(events);
  handlers.current = events;
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    if (!el.current) return;
    const c = echarts.init(el.current, undefined, { renderer: "canvas" });
    chart.current = c;
    for (const name of ["click", "mouseover", "mouseout", "globalout", "datazoom"] as const) {
      c.on(name, (...args: unknown[]) => handlers.current?.[name]?.(args[0] as Parameters<Handler>[0]));
    }
    const ro = new ResizeObserver(([entry]) => {
      // Skip while hidden or mid layout (a zero size breaks map projections).
      if (!entry || entry.contentRect.width < 10 || entry.contentRect.height < 10 || c.isDisposed()) return;
      try {
        c.resize({ animation: { duration: 200 } });
      } catch {
        // A resize during an option update is retried on the next frame.
      }
    });
    ro.observe(el.current);
    ready.current?.(c);
    return () => {
      ro.disconnect();
      ready.current?.(null);
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: replace, lazyUpdate: true });
  }, [option, replace]);

  return (
    <div className={styles.chartScroll}>
      <div ref={el} className={styles.chart} style={{ height, minWidth }} role="img" aria-label={label} />
    </div>
  );
}

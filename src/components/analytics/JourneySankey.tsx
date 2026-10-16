"use client";

import { useEffect, useMemo, useRef } from "react";
import { fmtNumber, useAnalytics } from "./AnalyticsContext";
import { EChart } from "./EChart";
import type { ECharts } from "./echarts";
import { EmptyState } from "./Panel";
import { alpha, palette, tooltipBase } from "./theme";

const OUTCOME_STATUS: Record<string, "accepted" | "declined" | "awaiting"> = { "o:accepted": "accepted", "o:declined": "declined", "o:awaiting": "awaiting" };

/** Source → landing page → chat → estimate → request → sent → outcome, with every drop off shown. */
export function JourneySankey() {
  const { data, setFilter, hover, setHover } = useAnalytics();
  const chart = useRef<ECharts | null>(null);
  const lit = useRef<string | null>(null);
  const { journey } = data;
  const info = useMemo(() => new Map(journey.nodes.map((n) => [n.id, n])), [journey.nodes]);

  const option = useMemo(() => {
    const p = palette();
    const colour = (kind: string, id: string) =>
      kind === "source" ? p.info : kind === "landing" ? p.neutral : kind === "drop" ? p.borderStrong : kind === "outcome" ? (id === "o:accepted" ? p.success : id === "o:declined" ? p.warning : p.muted) : p.brand;
    const inflow = new Map<string, number>();
    for (const l of journey.links) inflow.set(l.target, (inflow.get(l.target) ?? 0) + l.value);
    const outflow = new Map<string, number>();
    for (const l of journey.links) outflow.set(l.source, (outflow.get(l.source) ?? 0) + l.value);
    const size = (id: string) => Math.max(inflow.get(id) ?? 0, outflow.get(id) ?? 0);
    return {
      tooltip: {
        ...tooltipBase(p),
        trigger: "item",
        formatter: (e: { dataType: string; name: string; data: { source?: string; target?: string; value?: number } }) => {
          if (e.dataType === "edge") {
            const from = info.get(e.data.source!);
            const to = info.get(e.data.target!);
            const share = size(e.data.source!) ? Math.round(((e.data.value ?? 0) / size(e.data.source!)) * 100) : 0;
            return `<strong>${from?.label} → ${to?.label}</strong><br/>${fmtNumber(e.data.value ?? 0)} visits <span style="color:${p.subtle}">(${share}% of ${from?.label})</span>`;
          }
          const n = info.get(e.name);
          const v = size(e.name);
          const share = journey.visits ? Math.round((v / journey.visits) * 100) : 0;
          const hint = n?.kind === "source" ? "Click to filter by this source" : n && OUTCOME_STATUS[n.id] ? "Click to filter by this outcome" : "";
          return `<strong>${n?.label}</strong><br/>${fmtNumber(v)} visits <span style="color:${p.subtle}">(${share}% of all visits)</span>${hint ? `<div style="margin-top:4px;color:${p.subtle};font-size:11px">${hint}</div>` : ""}`;
        },
      },
      series: [
        {
          type: "sankey",
          left: 8,
          right: 120,
          top: 12,
          bottom: 12,
          nodeWidth: 12,
          nodeGap: 12,
          nodeAlign: "left",
          layoutIterations: 48,
          draggable: false,
          emphasis: { focus: "trajectory", lineStyle: { opacity: 0.6 } },
          blur: { lineStyle: { opacity: 0.06 }, itemStyle: { opacity: 0.35 }, label: { opacity: 0.4 } },
          lineStyle: { color: "source", opacity: 0.22, curveness: 0.5 },
          label: {
            color: p.text,
            fontFamily: p.font,
            fontSize: 12,
            formatter: (e: { name: string }) => `${info.get(e.name)?.label ?? e.name}  {v|${fmtNumber(size(e.name))}}`,
            rich: { v: { color: p.subtle, fontSize: 11 } },
          },
          data: journey.nodes.map((n) => ({
            name: n.id,
            depth: n.level,
            itemStyle: { color: colour(n.kind, n.id), borderRadius: 3, opacity: n.kind === "drop" ? 0.7 : 1 },
            label: n.kind === "drop" ? { color: p.subtle } : undefined,
          })),
          links: journey.links.map((l) => ({ ...l, lineStyle: info.get(l.target)?.kind === "drop" ? { color: alpha(p.neutral, 0.5), opacity: 0.16 } : undefined })),
          animationDuration: 600,
        },
      ],
    };
  }, [journey, info]);

  // Linked highlighting: a source hovered elsewhere lights up its whole path here.
  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const next = hover?.dim === "source" && info.has(`s:${hover.value}`) ? `s:${hover.value}` : null;
    if (lit.current && lit.current !== next) c.dispatchAction({ type: "downplay", seriesIndex: 0, name: lit.current, dataType: "node" });
    if (next && next !== lit.current) c.dispatchAction({ type: "highlight", seriesIndex: 0, name: next, dataType: "node" });
    lit.current = next;
  }, [hover, info]);

  if (!journey.visits) return <EmptyState text="No visits recorded for this period yet. Journeys appear here as visitors arrive." />;
  const stages = journey.nodes.filter((n) => n.kind === "stage");
  return (
    <EChart
      option={option}
      height={Math.max(360, Math.min(560, 120 + journey.nodes.filter((n) => n.level === 0).length * 34))}
      minWidth={760}
      replace
      label={`Visitor journey across ${journey.visits} visits: ${stages.map((s) => s.label).join(", ")}`}
      onReady={(c) => (chart.current = c)}
      events={{
        click: (e) => {
          const n = e.name ? info.get(e.name) : undefined;
          if (n?.kind === "source") setFilter("source", n.label);
          else if (n && OUTCOME_STATUS[n.id]) setFilter("status", OUTCOME_STATUS[n.id]);
        },
        mouseover: (e) => {
          const n = e.name ? info.get(e.name) : undefined;
          if (n?.kind === "source") setHover({ dim: "source", value: n.label });
        },
        mouseout: () => setHover(null),
        globalout: () => setHover(null),
      }}
    />
  );
}

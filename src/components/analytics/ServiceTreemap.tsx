"use client";

import { useEffect, useMemo, useRef } from "react";
import { fmtMoney, fmtNumber, fmtPct, useAnalytics } from "./AnalyticsContext";
import { EChart } from "./EChart";
import type { ECharts } from "./echarts";
import { EmptyState } from "./Panel";
import { alpha, palette, tooltipBase } from "./theme";
import styles from "./Dashboard.module.css";

/** Services sized by quoted value and shaded by win rate; click a tile to filter the dashboard. */
export function ServiceTreemap() {
  const { data, setFilter, hover, setHover } = useAnalytics();
  const chart = useRef<ECharts | null>(null);
  const lit = useRef<string | null>(null);
  const cur = data.currency;
  const byValue = data.services.some((s) => s.value > 0);
  const rows = useMemo(() => (byValue ? data.services.filter((s) => s.value > 0) : data.services.filter((s) => s.enquiries > 0)), [data.services, byValue]);
  const byName = useMemo(() => new Map(rows.map((s) => [s.name, s])), [rows]);

  const option = useMemo(() => {
    const p = palette();
    return {
      tooltip: {
        ...tooltipBase(p),
        formatter: (e: { name: string }) => {
          const s = byName.get(e.name);
          if (!s) return "";
          const row = (k: string, v: string) => `<div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${p.muted}">${k}</span><strong>${v}</strong></div>`;
          return `<div style="min-width:210px"><strong>${s.name}</strong><div style="margin-top:6px">${row("Quotes sent", fmtNumber(s.quotes))}${row("Total quoted value", fmtMoney(s.value, cur))}${row("Average quote", fmtMoney(s.average, cur))}${row("Accepted", fmtNumber(s.accepted))}${row("Win rate", s.winRate === null ? "No decisions yet" : fmtPct(s.winRate, 0))}${row("Enquiries to quotes", s.conversion === null ? "No tracked enquiries" : fmtPct(s.conversion, 0))}</div><div style="margin-top:6px;color:${p.subtle};font-size:11px">Click to filter by this service</div></div>`;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          label: {
            show: true,
            color: p.sunken,
            fontFamily: p.font,
            fontSize: 12,
            formatter: (e: { name: string }) => {
              const s = byName.get(e.name);
              return s ? `{n|${s.name}}\n${byValue ? fmtMoney(s.value, cur) : `${fmtNumber(s.enquiries)} enquiries`}` : e.name;
            },
            rich: { n: { fontWeight: 600, fontSize: 13, lineHeight: 18 } },
            overflow: "truncate",
          },
          upperLabel: { show: false },
          itemStyle: { borderColor: p.surface, borderWidth: 3, gapWidth: 3, borderRadius: 8 },
          emphasis: { itemStyle: { borderColor: p.text, borderWidth: 2, shadowBlur: 12, shadowColor: alpha(p.brand, 0.35) } },
          blur: { itemStyle: { opacity: 0.45 } },
          data: rows.map((s) => ({
            name: s.name,
            value: byValue ? s.value : s.enquiries,
            itemStyle: { color: s.winRate === null ? alpha(p.brand, 0.55) : alpha(p.brand, 0.3 + 0.7 * s.winRate) },
          })),
          animationDurationUpdate: 500,
        },
      ],
    };
  }, [rows, byName, byValue, cur]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const next = hover?.dim === "service" ? (rows.find((x) => x.id === hover.value)?.name ?? null) : null;
    if (lit.current && lit.current !== next) c.dispatchAction({ type: "downplay", seriesIndex: 0, name: lit.current });
    if (next && next !== lit.current) c.dispatchAction({ type: "highlight", seriesIndex: 0, name: next });
    lit.current = next;
  }, [hover, rows]);

  if (!rows.length) return <EmptyState text="No service enquiries or quotes in this period yet." />;
  return (
    <>
      <EChart
        option={option}
        height={300}
        label={`Services by ${byValue ? "quoted value" : "enquiries"}: ${rows.slice(0, 4).map((s) => s.name).join(", ")}`}
        onReady={(c) => (chart.current = c)}
        events={{
          click: (e) => {
            const s = e.name ? byName.get(e.name) : undefined;
            if (s) setFilter("service", s.id);
          },
          mouseover: (e) => {
            const s = e.name ? byName.get(e.name) : undefined;
            if (s) setHover({ dim: "service", value: s.id });
          },
          mouseout: () => setHover(null),
          globalout: () => setHover(null),
        }}
      />
      <p className={styles.chartHint}>
        {byValue ? "Tile size is total quoted value; brighter tiles win more of their decided quotes." : "No quotes sent yet, so tiles show enquiries started per service."}
      </p>
    </>
  );
}

/** The old dashboard's useful lists: top pages, and devices with their conversion. */
export function PagesDevices() {
  const { data, setFilter, setHover, hover } = useAnalytics();
  const maxPage = Math.max(1, ...data.pages.map((p) => p.views));
  const maxDev = Math.max(1, ...data.devices.map((d) => d.visitors));
  if (!data.pages.length && !data.devices.length) return <EmptyState text="No page views in this period yet." />;
  return (
    <div className={styles.split}>
      <div>
        <h3 className={styles.subhead}>Top pages</h3>
        <ul className={styles.bars}>
          {data.pages.map((p) => (
            <li key={p.path}>
              <span className={styles.barFill} style={{ width: `${(p.views / maxPage) * 100}%` }} aria-hidden="true" />
              <span className={styles.barLabel}>{p.path === "/" ? "Home" : p.path}</span>
              <span className={styles.barValue}>
                {fmtNumber(p.views)} <small>{p.views === 1 ? "view" : "views"}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className={styles.subhead}>Devices</h3>
        <ul className={styles.bars}>
          {data.devices.map((d) => (
            <li key={d.device} data-active={hover?.dim === "device" && hover.value === d.device ? "" : undefined}>
              <span className={styles.barFill} style={{ width: `${(d.visitors / maxDev) * 100}%` }} aria-hidden="true" />
              <button
                type="button"
                className={styles.barButton}
                onClick={() => setFilter("device", d.device)}
                onMouseEnter={() => setHover({ dim: "device", value: d.device })}
                onMouseLeave={() => setHover(null)}
              >
                {d.label}
              </button>
              <span className={styles.barValue}>
                {fmtNumber(d.visitors)} <small>visitors · {fmtPct(d.conversion)} convert</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countryName, flagEmoji } from "@/lib/countries";
import { fmtMoney, fmtNumber, fmtPct, useAnalytics } from "./AnalyticsContext";
import { EChart } from "./EChart";
import { loadWorld, type ECharts } from "./echarts";
import { ChartSkeleton, EmptyState } from "./Panel";
import { alpha, palette, tooltipBase } from "./theme";
import styles from "./Dashboard.module.css";

/** Countries shaded by visitors; hover for the full picture, click to filter the whole dashboard. */
export function WorldMap() {
  const { data, setFilter, hover, setHover, query } = useAnalytics();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const chart = useRef<ECharts | null>(null);
  const lit = useRef<string | null>(null);
  const cur = data.currency;
  const byCode = useMemo(() => new Map(data.countries.map((c) => [c.code, c])), [data.countries]);

  useEffect(() => {
    loadWorld().then(
      () => setReady(true),
      () => setFailed(true),
    );
  }, []);

  const option = useMemo(() => {
    if (!ready) return {};
    const p = palette();
    const max = Math.max(1, ...data.countries.map((c) => c.visitors));
    return {
      tooltip: {
        ...tooltipBase(p),
        trigger: "item",
        formatter: (params: { name: string }) => {
          const c = byCode.get(params.name);
          const name = c?.name ?? countryName(params.name) ?? params.name;
          if (!c) return `<strong>${name}</strong><br/><span style="color:${p.subtle}">No visits in this period</span>`;
          const row = (k: string, v: string) => `<div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${p.muted}">${k}</span><span>${v}</span></div>`;
          return `<div style="min-width:190px"><strong style="font-size:13px">${flagEmoji(c.code)} ${name}</strong><div style="margin-top:6px;display:grid;gap:2px">${[
            row("Visitors", fmtNumber(c.visitors)),
            row("Enquiries", fmtNumber(c.enquiries)),
            row("Quotes", fmtNumber(c.quotes)),
            row("Sent", fmtNumber(c.sent)),
            row("Accepted", fmtNumber(c.accepted)),
            row("Conversion", fmtPct(c.conversion, 2)),
            row("Quoted value", fmtMoney(c.value, cur)),
          ].join("")}</div><div style="margin-top:6px;color:${p.subtle};font-size:11px">Click to filter the dashboard</div></div>`;
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max,
        show: false,
        inRange: { color: [alpha(p.brand, 0.14), alpha(p.brand, 0.55), p.brand] },
      },
      series: [
        {
          type: "map",
          map: "world",
          // Drag to pan; zoom with the buttons (the scroll wheel keeps scrolling the page).
          roam: "move",
          scaleLimit: { min: 1, max: 8 },
          layoutCenter: ["50%", "54%"],
          layoutSize: "185%",
          selectedMode: false,
          itemStyle: { areaColor: p.sunken, borderColor: p.borderStrong, borderWidth: 0.6 },
          emphasis: {
            focus: "self",
            label: { show: false },
            itemStyle: { areaColor: alpha(p.text, 0.18), borderColor: p.muted, borderWidth: 1 },
          },
          blur: { itemStyle: { opacity: 0.45 } },
          data: data.countries
            .filter((c) => c.code !== "XX")
            .map((c) => ({
              name: c.code,
              value: c.visitors,
              itemStyle: query.filters.country === c.code ? { borderColor: p.text, borderWidth: 1.4 } : undefined,
              emphasis: { itemStyle: { areaColor: p.brandStrong, borderColor: p.text, borderWidth: 1, shadowBlur: 14, shadowColor: alpha(p.brand, 0.45) } },
            })),
          animationDurationUpdate: 400,
        },
      ],
    };
  }, [ready, data.countries, byCode, cur, query.filters.country]);

  // Linked highlighting from other charts.
  useEffect(() => {
    const c = chart.current;
    if (!c || !ready) return;
    const next = hover?.dim === "country" ? hover.value : null;
    if (lit.current && lit.current !== next) c.dispatchAction({ type: "downplay", seriesIndex: 0, name: lit.current });
    if (next && next !== lit.current) c.dispatchAction({ type: "highlight", seriesIndex: 0, name: next });
    lit.current = next;
  }, [hover, ready]);

  const zoomBy = (factor: number | null) => {
    const c = chart.current;
    if (!c) return;
    if (factor === null) c.setOption({ series: [{ zoom: 1, center: null }] });
    else c.dispatchAction({ type: "geoRoam", componentType: "series", seriesIndex: 0, zoom: factor });
  };

  if (failed) return <EmptyState text="The world map couldn't load. The country list below still shows every location." />;
  const visible = data.countries.filter((c) => c.code !== "XX");
  return (
    <div className={styles.mapWrap}>
      {ready && (
        <div className={styles.mapZoom} role="group" aria-label="Map zoom">
          <button type="button" onClick={() => zoomBy(1.5)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={() => zoomBy(null)} aria-label="Reset map view">
            ⟲
          </button>
        </div>
      )}
      {ready ? (
        <EChart
          option={option}
          height={360}
          label={`World map of visitors by country. ${visible.slice(0, 5).map((c) => `${c.name} ${c.visitors}`).join(", ")}`}
          onReady={(c) => (chart.current = c)}
          events={{
            click: (e) => e.name && byCode.has(e.name) && setFilter("country", e.name),
            mouseover: (e) => e.name && setHover({ dim: "country", value: e.name }),
            mouseout: () => setHover(null),
            globalout: () => setHover(null),
          }}
        />
      ) : (
        <ChartSkeleton height={360} />
      )}
      <ol className={styles.rankList} aria-label="Top countries by visitors">
        {data.countries.slice(0, 6).map((c) => (
          <li key={c.code} data-active={hover?.dim === "country" && hover.value === c.code ? "" : undefined}>
            <button
              type="button"
              onClick={() => c.code !== "XX" && setFilter("country", c.code)}
              onMouseEnter={() => setHover({ dim: "country", value: c.code })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ dim: "country", value: c.code })}
              onBlur={() => setHover(null)}
              aria-pressed={query.filters.country === c.code}
            >
              <span className={styles.flag} aria-hidden="true">
                {flagEmoji(c.code)}
              </span>
              <span className={styles.rankName}>{c.name}</span>
              <span className={styles.rankValue}>
                {fmtNumber(c.visitors)} <small>{c.visitors === 1 ? "visitor" : "visitors"}</small>
              </span>
              <span className={styles.rankValue}>
                {fmtNumber(c.sent)} <small>sent</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

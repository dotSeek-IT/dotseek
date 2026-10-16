"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayLabel, fmtMoney, fmtNumber, useAnalytics } from "./AnalyticsContext";
import { EChart } from "./EChart";
import type { ECharts } from "./echarts";
import { EmptyState, MetricSwitch } from "./Panel";
import { alpha, palette, tooltipBase } from "./theme";
import styles from "./Dashboard.module.css";

type Metric = "visitors" | "sessions" | "enquiries" | "quotes" | "value" | "conversion";
const METRICS: { value: Metric; label: string }[] = [
  { value: "visitors", label: "Visitors" },
  { value: "sessions", label: "Sessions" },
  { value: "enquiries", label: "Enquiries" },
  { value: "quotes", label: "Quotes" },
  { value: "value", label: "Quote value" },
  { value: "conversion", label: "Conversions" },
];

/** Current period against the previous one, with an optional second metric, crosshair and zoom. */
export function TrendCompare() {
  const { data } = useAnalytics();
  const [metric, setMetric] = useState<Metric>("visitors");
  const [second, setSecond] = useState<Metric | "">("");
  const [zoomed, setZoomed] = useState(false);
  const chart = useRef<ECharts | null>(null);
  const { trend, range, currency } = data;
  const periodName = range.days === 1 ? "Selected day" : `Last ${range.days} days`;
  const prevName = range.days === 1 ? "Day before" : `Previous ${range.days} days`;

  const fmt = useCallback((m: Metric, v: number) => (m === "value" ? fmtMoney(v, currency) : m === "conversion" ? `${(v * 100).toFixed(1)}%` : fmtNumber(v)), [currency]);
  const label = (m: Metric) => METRICS.find((x) => x.value === m)!.label;

  const option = useMemo(() => {
    const p = palette();
    const labels = trend.current.map((b) => (trend.hourly ? `${b.key.padStart(2, "0")}:00` : dayLabel(b.key)));
    const val = (m: Metric) => (b: (typeof trend.current)[number]) => b[m];
    const axis = (m: Metric) => ({
      type: "value",
      minInterval: m === "conversion" ? undefined : 1,
      splitLine: { lineStyle: { color: p.border } },
      axisLabel: { color: p.subtle, fontSize: 11, formatter: (v: number) => (m === "value" ? fmtMoney(v, currency).replace(/\.00$/, "") : m === "conversion" ? `${Math.round(v * 100)}%` : fmtNumber(v)) },
    });
    return {
      animationDuration: 500,
      grid: { left: 8, right: second ? 8 : 16, top: 40, bottom: 56, containLabel: true },
      legend: {
        top: 0,
        right: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 4,
        textStyle: { color: p.muted, fontSize: 12, fontFamily: p.font },
        inactiveColor: p.borderStrong,
      },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: p.borderStrong, type: "dashed" }, label: { show: false } },
        formatter: (items: { seriesName: string; seriesIndex: number; dataIndex: number; value: number; color: string }[]) => {
          const i = items[0]?.dataIndex ?? 0;
          const prevKey = trend.previous[i]?.key;
          const head = trend.hourly ? `${labels[i]} to ${String((Number(trend.current[i]?.key) + 1) % 24).padStart(2, "0")}:00` : dayLabel(trend.current[i]!.key, { weekday: "short", day: "numeric", month: "short" });
          const lines = items.map((it) => {
            const isPrev = it.seriesIndex === 1;
            const m = it.seriesIndex === 2 && second ? second : metric;
            const when = isPrev && prevKey ? (trend.hourly ? " (day before)" : ` (${dayLabel(prevKey)})`) : "";
            return `<div style="display:flex;justify-content:space-between;gap:18px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${it.color}"></span>${it.seriesName}${when}</span><strong>${fmt(m, it.value)}</strong></div>`;
          });
          return `<div style="min-width:220px"><strong>${head}</strong><div style="margin-top:6px;display:grid;gap:3px">${lines.join("")}</div></div>`;
        },
      },
      xAxis: { type: "category", data: labels, boundaryGap: false, axisLine: { lineStyle: { color: p.borderStrong } }, axisTick: { show: false }, axisLabel: { color: p.subtle, fontSize: 11, hideOverlap: true } },
      yAxis: second ? [axis(metric), { ...axis(second), splitLine: { show: false } }] : [axis(metric)],
      toolbox: { show: false, feature: { dataZoom: { yAxisIndex: "none" } } },
      dataZoom: [
        { type: "inside", moveOnMouseMove: false, moveOnMouseWheel: false, zoomOnMouseWheel: "ctrl" },
        {
          type: "slider",
          height: 18,
          bottom: 6,
          borderColor: p.border,
          backgroundColor: p.sunken,
          fillerColor: alpha(p.brand, 0.12),
          handleStyle: { color: p.brand, borderColor: p.brand },
          moveHandleStyle: { color: p.borderStrong },
          dataBackground: { lineStyle: { color: p.neutral }, areaStyle: { color: alpha(p.neutral, 0.2) } },
          selectedDataBackground: { lineStyle: { color: p.brand }, areaStyle: { color: alpha(p.brand, 0.2) } },
          textStyle: { color: p.subtle, fontSize: 10 },
        },
      ],
      series: [
        {
          name: periodName,
          type: "line",
          smooth: 0.25,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2.5, color: p.brand },
          itemStyle: { color: p.brand, borderColor: p.surface, borderWidth: 2 },
          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: alpha(p.brand, 0.28) }, { offset: 1, color: alpha(p.brand, 0) }] } },
          emphasis: { focus: "series" },
          data: trend.current.map(val(metric)),
        },
        {
          name: prevName,
          type: "line",
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 1.5, type: "dashed", color: alpha(p.brand, 0.4) },
          itemStyle: { color: alpha(p.brand, 0.4) },
          emphasis: { focus: "series" },
          data: trend.previous.map(val(metric)),
        },
        ...(second
          ? [
              {
                name: `${label(second)} (${periodName.toLowerCase()})`,
                type: "line",
                yAxisIndex: 1,
                smooth: 0.25,
                showSymbol: false,
                lineStyle: { width: 2, color: p.info },
                itemStyle: { color: p.info },
                emphasis: { focus: "series" },
                data: trend.current.map(val(second)),
              },
            ]
          : []),
      ],
    };
  }, [trend, metric, second, currency, periodName, prevName, fmt]);

  // Keep drag to zoom active after every redraw.
  useEffect(() => {
    const id = requestAnimationFrame(() => chart.current?.dispatchAction({ type: "takeGlobalCursor", key: "dataZoomSelect", dataZoomSelectActive: true }));
    return () => cancelAnimationFrame(id);
  }, [option]);

  const enableBoxZoom = (c: ECharts | null) => {
    chart.current = c;
    // Drag across the chart to zoom into a range.
    c?.dispatchAction({ type: "takeGlobalCursor", key: "dataZoomSelect", dataZoomSelectActive: true });
  };

  const hasData = [...trend.current, ...trend.previous].some((b) => b[metric] > 0 || (second ? b[second] > 0 : false));

  return (
    <>
      <div className={styles.toolbarRow}>
        <MetricSwitch label="Trend metric" value={metric} options={METRICS} onChange={(m) => (setMetric(m), second === m && setSecond(""))} />
        <label className={styles.inlineSelect}>
          <span>Compare with</span>
          <select value={second} onChange={(e) => setSecond(e.target.value as Metric | "")}>
            <option value="">Nothing else</option>
            {METRICS.filter((m) => m.value !== metric).map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {zoomed && (
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => {
              chart.current?.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
              setZoomed(false);
            }}
          >
            Reset zoom
          </button>
        )}
      </div>
      {!hasData ? (
        <EmptyState text={`No ${label(metric).toLowerCase()} recorded in this period or the one before.`} />
      ) : (
      <EChart
        option={option}
        height={320}
        replace
        label={`${label(metric)} per ${trend.hourly ? "hour" : "day"}, ${periodName.toLowerCase()} against ${prevName.toLowerCase()}`}
        onReady={enableBoxZoom}
        events={{
          datazoom: () => {
            const opt = chart.current?.getOption() as { dataZoom?: { start?: number; end?: number }[] } | undefined;
            const z = opt?.dataZoom?.[0];
            setZoomed(Boolean(z && ((z.start ?? 0) > 0.5 || (z.end ?? 100) < 99.5)));
            chart.current?.dispatchAction({ type: "takeGlobalCursor", key: "dataZoomSelect", dataZoomSelectActive: true });
          },
        }}
      />
      )}
      {hasData && <p className={styles.chartHint}>Drag across the chart to zoom into dates (or Ctrl and scroll), and use the bar below to move.</p>}
    </>
  );
}

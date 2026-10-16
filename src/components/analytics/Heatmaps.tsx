"use client";

import { useMemo, useState } from "react";
import { dayLabel, fmtMoney, fmtNumber, fmtPct, useAnalytics } from "./AnalyticsContext";
import { EChart } from "./EChart";
import { EmptyState, MetricSwitch } from "./Panel";
import { alpha, palette, tooltipBase } from "./theme";
import styles from "./Dashboard.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

type HeatMetric = "visitors" | "enquiries" | "quotes" | "conversions";

/** Day of week against hour of day (UK time). */
export function ActivityHeatmap() {
  const { data } = useAnalytics();
  const [metric, setMetric] = useState<HeatMetric>("visitors");
  const grid = data.heat[metric];
  const max = Math.max(0, ...grid.flat());

  const option = useMemo(() => {
    const p = palette();
    const cells: [number, number, number][] = [];
    grid.forEach((row, d) => row.forEach((v, h) => cells.push([h, 6 - d, v])));
    return {
      grid: { left: 8, right: 8, top: 8, bottom: 30, containLabel: true },
      tooltip: {
        ...tooltipBase(p),
        formatter: (e: { value: [number, number, number] }) => {
          const [h, y] = e.value;
          const d = 6 - y;
          const row = (k: string, v: number) => `<div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${p.muted}">${k}</span><strong>${fmtNumber(v)}</strong></div>`;
          return `<div style="min-width:170px"><strong>${DAYS[d]}</strong><div style="color:${p.subtle};font-size:11px;margin-bottom:6px">${hh(h)} to ${hh((h + 1) % 24)} UK time</div>${row("Visitors", data.heat.visitors[d]![h]!)}${row("Enquiries", data.heat.enquiries[d]![h]!)}${row("Quotes", data.heat.quotes[d]![h]!)}${row("Conversions", data.heat.conversions[d]![h]!)}</div>`;
        },
      },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, h) => hh(h)), splitArea: { show: false }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: p.subtle, fontSize: 10, interval: 2 } },
      yAxis: { type: "category", data: [...DAYS].reverse().map((d) => d.slice(0, 3)), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: p.muted, fontSize: 11 } },
      visualMap: { show: false, min: 0, max: Math.max(1, max), inRange: { color: [p.sunken, alpha(p.brand, 0.35), p.brand] } },
      series: [
        {
          type: "heatmap",
          data: cells,
          itemStyle: { borderColor: p.surface, borderWidth: 3, borderRadius: 4 },
          emphasis: { itemStyle: { borderColor: p.text, borderWidth: 1.5, shadowBlur: 10, shadowColor: alpha(p.brand, 0.4) } },
          animationDuration: 400,
        },
      ],
    };
  }, [grid, max, data.heat]);

  const peak = useMemo(() => {
    let best: [number, number, number] = [0, 0, 0];
    grid.forEach((row, d) => row.forEach((v, h) => v > best[2] && (best = [d, h, v])));
    return best;
  }, [grid]);

  return (
    <>
      <div className={styles.toolbarRow}>
        <MetricSwitch
          label="Heatmap metric"
          value={metric}
          options={[
            { value: "visitors", label: "Visitors" },
            { value: "enquiries", label: "Enquiries" },
            { value: "quotes", label: "Quotes" },
            { value: "conversions", label: "Conversions" },
          ]}
          onChange={setMetric}
        />
        {max > 0 && (
          <p className={styles.chartHint}>
            Busiest: {DAYS[peak[0]]} {hh(peak[1])} to {hh((peak[1] + 1) % 24)} ({fmtNumber(peak[2])})
          </p>
        )}
      </div>
      {max === 0 ? (
        <EmptyState text={`No ${metric === "conversions" ? "quotes sent" : metric} in this period yet.`} />
      ) : (
        <EChart option={option} height={300} minWidth={640} label={`${metric} by weekday and hour, UK time. Busiest ${DAYS[peak[0]]} at ${hh(peak[1])}.`} />
      )}
    </>
  );
}

type CalMetric = "visitors" | "enquiries" | "quotes" | "value";

/** 90 days of activity, one square per day; click a day to filter the dashboard to it. */
export function CalendarHeat() {
  const { data, setRange } = useAnalytics();
  const [metric, setMetric] = useState<CalMetric>("visitors");
  const cur = data.currency;
  const days = data.calendar;
  const val = (d: (typeof days)[number]) => (metric === "value" ? d.value : metric === "quotes" ? d.quotes : d[metric]);
  const max = Math.max(0, ...days.map(val));

  const option = useMemo(() => {
    const p = palette();
    const byDay = new Map(days.map((d) => [d.day, d]));
    return {
      tooltip: {
        ...tooltipBase(p),
        formatter: (e: { value: [string, number] }) => {
          const d = byDay.get(e.value[0]);
          if (!d) return "";
          const row = (k: string, v: string) => `<div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${p.muted}">${k}</span><strong>${v}</strong></div>`;
          return `<div style="min-width:170px"><strong>${dayLabel(d.day, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</strong><div style="margin-top:6px">${row("Visitors", fmtNumber(d.visitors))}${row("Quotes", fmtNumber(d.quotes))}${row("Sent", fmtNumber(d.sent))}${row("Conversion", fmtPct(d.conversion))}${row("Quote value", fmtMoney(d.value, cur))}</div><div style="margin-top:6px;color:${p.subtle};font-size:11px">Click to view this day</div></div>`;
        },
      },
      visualMap: { show: false, min: 0, max: Math.max(1, max), inRange: { color: [p.sunken, alpha(p.brand, 0.4), p.brand] } },
      calendar: {
        range: [days[0]!.day, days.at(-1)!.day],
        top: 26,
        left: "center",
        cellSize: 24,
        orient: "horizontal",
        splitLine: { show: false },
        itemStyle: { color: p.sunken, borderColor: p.surface, borderWidth: 3 },
        yearLabel: { show: false },
        monthLabel: { color: p.muted, fontSize: 11, nameMap: "en" },
        dayLabel: { color: p.subtle, fontSize: 10, firstDay: 1, nameMap: ["S", "M", "T", "W", "T", "F", "S"] },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: days.map((d) => [d.day, val(d)]),
          itemStyle: { borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: p.text, borderWidth: 1.5 } },
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, metric, max, cur]);

  return (
    <>
      <div className={styles.toolbarRow}>
        <MetricSwitch
          label="Calendar metric"
          value={metric}
          options={[
            { value: "visitors", label: "Visitors" },
            { value: "enquiries", label: "Enquiries" },
            { value: "quotes", label: "Quotes" },
            { value: "value", label: "Quoted value" },
          ]}
          onChange={setMetric}
        />
      </div>
      {max === 0 ? (
        <EmptyState text="No activity in the last 90 days for these filters." />
      ) : (
        <EChart
          option={option}
          height={210}
          minWidth={400}
          label={`Daily ${metric} over the last 90 days`}
          events={{ click: (e) => Array.isArray(e.value) && typeof e.value[0] === "string" && setRange("custom", e.value[0], e.value[0]) }}
        />
      )}
    </>
  );
}

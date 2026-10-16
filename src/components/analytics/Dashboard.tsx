"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Dashboard as DashboardData } from "@/lib/analytics/engine";
import { PRESETS, type ParsedQuery, type Preset } from "@/lib/analytics/query";
import { flagEmoji } from "@/lib/countries";
import { AnalyticsProvider, change, dayLabel, fmtMoney, fmtNumber, useAnalytics, type FilterDim } from "./AnalyticsContext";
import { InsightsPanel, QuotesList } from "./Lists";
import { ChartSkeleton, Panel } from "./Panel";
import styles from "./Dashboard.module.css";

// Charts load on demand (ECharts never reaches the public site, and the KPIs show first).
const skeleton = (height: number) =>
  function Loading() {
    return <ChartSkeleton height={height} />;
  };
const WorldMap = dynamic(() => import("./WorldMap").then((m) => m.WorldMap), { ssr: false, loading: skeleton(400) });
const TrendCompare = dynamic(() => import("./TrendCompare").then((m) => m.TrendCompare), { ssr: false, loading: skeleton(360) });
const JourneySankey = dynamic(() => import("./JourneySankey").then((m) => m.JourneySankey), { ssr: false, loading: skeleton(380) });
const ActivityHeatmap = dynamic(() => import("./Heatmaps").then((m) => m.ActivityHeatmap), { ssr: false, loading: skeleton(330) });
const CalendarHeat = dynamic(() => import("./Heatmaps").then((m) => m.CalendarHeat), { ssr: false, loading: skeleton(240) });
const ServiceTreemap = dynamic(() => import("./ServiceTreemap").then((m) => m.ServiceTreemap), { ssr: false, loading: skeleton(320) });
const PagesDevices = dynamic(() => import("./ServiceTreemap").then((m) => m.PagesDevices), { ssr: false, loading: skeleton(320) });
const PivotTable = dynamic(() => import("./PivotTable").then((m) => m.PivotTable), { ssr: false, loading: skeleton(320) });

export function AnalyticsDashboard({ initial, initialQuery }: { initial: DashboardData; initialQuery: ParsedQuery }) {
  return (
    <AnalyticsProvider initial={initial} initialQuery={initialQuery}>
      <DashboardBody />
    </AnalyticsProvider>
  );
}

function DashboardBody() {
  const { data, loading, error, retry } = useAnalytics();
  const started = data.meta.started;
  const startedInRange = started && started.slice(0, 10) > data.range.from;
  return (
    <div className={styles.dashboard} aria-busy={loading || undefined}>
      <FilterBar />
      <ActiveFilters />
      {loading && <div className={styles.progress} role="status" aria-label="Updating analytics" />}
      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.ghostButton} onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {!data.meta.available && <p className={styles.notice}>Analytics storage isn&apos;t configured, so visits can&apos;t be counted. Quote figures still come from enquiries.</p>}
      {startedInRange && (
        <p className={styles.notice}>
          Visit tracking started on {dayLabel(started!.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}. Visitors, sessions and journeys before then show as
          empty; quotes sent, values and outcomes include every enquiry. Conversion rates only use quotes sent by tracked visits.
        </p>
      )}

      <Kpis />

      <div className={styles.gridMap}>
        <Panel id="map" title="Where visitors come from" description="Shaded by visitors. Hover a country for its full picture, click to filter everything.">
          <WorldMap />
        </Panel>
        <Panel id="insights" title="Insights" description="Calculated from your data, never estimated.">
          <InsightsPanel />
        </Panel>
      </div>

      <Panel id="trend" title="Trend" description={`${data.range.days === 1 ? "By hour, against the day before" : `Last ${data.range.days} days against the ${data.range.days} days before`}.`}>
        <TrendCompare />
      </Panel>

      <Panel id="journey" title="Visitor journey" description="From source to outcome. Grey streams are drop offs; hover any part to trace its full path, click a source or outcome to filter.">
        <JourneySankey />
      </Panel>

      <Panel id="activity" title="Busiest times" description="Day of week against hour of day, in UK time.">
        <ActivityHeatmap />
      </Panel>

      <div className={styles.grid2}>
        <Panel id="services" title="Service value" description="Which services generate the most commercial value. Click a tile to filter.">
          <ServiceTreemap />
        </Panel>
        <Panel id="pages" title="Pages and devices" description="What people read, and which devices convert.">
          <PagesDevices />
        </Panel>
      </div>

      <Panel id="calendar" title="Daily activity" description="The last 90 days, one square per day. Click a day to view it.">
        <CalendarHeat />
      </Panel>

      <Panel id="pivot" title="Pivot analysis" description="Choose rows, columns and a metric. Cells are shaded by value; export what you see as CSV.">
        <PivotTable />
      </Panel>

      <Panel id="quotes" title="Quotes" description="Recent and highest value quotes in this period.">
        <QuotesList />
      </Panel>
    </div>
  );
}

// ---------- Filters ----------

const FILTERS: { dim: FilterDim; label: string; all: string }[] = [
  { dim: "country", label: "Country", all: "All countries" },
  { dim: "service", label: "Service", all: "All services" },
  { dim: "source", label: "Traffic source", all: "All sources" },
  { dim: "device", label: "Device", all: "All devices" },
  { dim: "status", label: "Quote status", all: "Any status" },
  { dim: "currency", label: "Quote currency", all: "Any currency" },
];

const STATUS_OPTIONS = [
  { value: "none", label: "No quote sent" },
  { value: "awaiting", label: "Awaiting decision" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

function optionsFor(dim: FilterDim, data: DashboardData) {
  switch (dim) {
    case "country":
      return data.options.countries;
    case "service":
      return data.options.services;
    case "source":
      return data.options.sources;
    case "device":
      return data.options.devices;
    case "status":
      return STATUS_OPTIONS;
    default:
      return data.options.currencies;
  }
}

function FilterBar() {
  const { query, data, setFilter, setRange, setDisplay } = useAnalytics();
  const [from, setFrom] = useState(query.filters.from);
  const [to, setTo] = useState(query.filters.to);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className={styles.filterBar} role="group" aria-label="Dashboard filters">
      <div className={styles.dateGroup}>
        <label className={styles.field}>
          <span>Date range</span>
          <select
            value={query.preset}
            onChange={(e) => {
              const p = e.target.value as Preset;
              if (p === "custom") {
                // Start the custom range from the period currently shown.
                setFrom(query.filters.from);
                setTo(query.filters.to);
                setRange("custom", query.filters.from, query.filters.to);
              } else setRange(p);
            }}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {query.preset === "custom" && (
          <form
            className={styles.customRange}
            onSubmit={(e) => {
              e.preventDefault();
              setRange("custom", from, to);
            }}
          >
            <label className={styles.field}>
              <span>From</span>
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>To</span>
              <input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} required />
            </label>
            <button type="submit" className={styles.ghostButton}>
              Apply
            </button>
          </form>
        )}
        <p className={styles.rangeText}>
          {dayLabel(data.range.from, { day: "numeric", month: "short", year: "numeric" })}
          {data.range.from !== data.range.to ? ` to ${dayLabel(data.range.to, { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </p>
      </div>
      <div className={styles.filterGrid}>
        {FILTERS.map((f) => {
          const opts = optionsFor(f.dim, data);
          const value = query.filters[f.dim] ?? "";
          const list = value && !opts.some((o) => o.value === value) ? [...opts, { value, label: value }] : opts;
          return (
            <label key={f.dim} className={styles.field}>
              <span>{f.label}</span>
              <select value={value} onChange={(e) => setFilter(f.dim, e.target.value || undefined)}>
                <option value="">{f.all}</option>
                {list.map((o) => (
                  <option key={o.value} value={o.value}>
                    {f.dim === "country" ? `${flagEmoji(o.value)} ${o.label}` : o.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        <label className={styles.field}>
          <span>Show values in</span>
          <select value={data.currency.code} onChange={(e) => setDisplay(e.target.value)}>
            {data.options.displayCurrencies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function ActiveFilters() {
  const { query, data, setFilter, clearAll } = useAnalytics();
  const active = FILTERS.filter((f) => query.filters[f.dim]);
  if (!active.length) return null;
  return (
    <div className={styles.chipsRow} aria-label="Active filters">
      {active.map((f) => {
        const v = query.filters[f.dim]!;
        const label = optionsFor(f.dim, data).find((o) => o.value === v)?.label ?? v;
        return (
          <button key={f.dim} type="button" className={styles.filterChip} onClick={() => setFilter(f.dim, undefined)} aria-label={`Clear ${f.label} filter: ${label}`}>
            <span>{f.label}:</span> {f.dim === "country" ? `${flagEmoji(v)} ` : ""}
            {label}
            <span aria-hidden="true" className={styles.chipX}>
              ×
            </span>
          </button>
        );
      })}
      {active.length > 1 && (
        <button type="button" className={styles.clearAll} onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ---------- KPIs ----------

function Kpis() {
  const { data } = useAnalytics();
  const period = data.range.days === 1 ? "the day before" : `previous ${data.range.days} days`;
  const show = (v: number, f: "number" | "money" | "percent") => (f === "money" ? fmtMoney(v, data.currency) : f === "percent" ? `${(v * 100).toFixed(1)}%` : fmtNumber(v));
  return (
    <div className={styles.kpis}>
      {data.kpis.map((k) => {
        const c = change(k.value, k.previous, k.format);
        return (
          <div key={k.key} className={styles.kpi} data-highlight={k.key === "sent" && k.value > 0 ? "" : undefined}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <strong className={styles.kpiValue}>{show(k.value, k.format)}</strong>
            <span className={styles.kpiChange} data-dir={c.dir}>
              <span aria-hidden="true">{c.dir === "up" ? "↑" : c.dir === "down" ? "↓" : "→"}</span>
              <span className="sr-only">{c.dir === "up" ? "Up" : c.dir === "down" ? "Down" : "Unchanged"}</span>
              {c.text}
            </span>
            <small className={styles.kpiPrev}>
              vs {show(k.previous, k.format)}, {period}
            </small>
            <small className={styles.kpiHint}>{k.hint}</small>
          </div>
        );
      })}
    </div>
  );
}

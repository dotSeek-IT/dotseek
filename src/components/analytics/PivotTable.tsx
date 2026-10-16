"use client";

import { useEffect, useState } from "react";
import type { CurrencyInfo, PivotCols, PivotMetric, PivotRows } from "@/lib/analytics/engine";
import { fmtMoney, fmtNumber, useAnalytics, type FilterDim } from "./AnalyticsContext";
import { ChartSkeleton, EmptyState } from "./Panel";
import styles from "./Dashboard.module.css";

type PivotData = {
  query: { rows: PivotRows; cols: PivotCols; metric: PivotMetric; sort: string; dir: "asc" | "desc"; search: string; page: number };
  currency: CurrencyInfo;
  columns: { key: string; label: string }[];
  rows: { key: string; label: string; cells: (number | null)[]; total: number | null }[];
  totalRows: number;
  pages: number;
  max: number;
};

const ROWS: { value: PivotRows; label: string }[] = [
  { value: "country", label: "Country" },
  { value: "service", label: "Service" },
  { value: "source", label: "Traffic source" },
  { value: "device", label: "Device" },
  { value: "landing", label: "Landing page" },
  { value: "status", label: "Quote status" },
];
const METRICS: { value: PivotMetric; label: string }[] = [
  { value: "visitors", label: "Visitors" },
  { value: "enquiries", label: "Enquiries" },
  { value: "quotes", label: "Quotes" },
  { value: "value", label: "Quote value" },
  { value: "conversions", label: "Conversions" },
  { value: "rate", label: "Conversion rate" },
];
const FILTER_OF: Partial<Record<PivotRows, FilterDim>> = { country: "country", service: "service", source: "source", device: "device", status: "status" };
const HOVER_OF: Partial<Record<PivotRows, "country" | "service" | "source" | "device">> = { country: "country", service: "service", source: "source", device: "device" };

/** Configurable pivot: rows by a dimension, columns by period, cells shaded like a heatmap. */
export function PivotTable() {
  const { search, setFilter, hover, setHover } = useAnalytics();
  const [rows, setRows] = useState<PivotRows>("country");
  const [cols, setCols] = useState<PivotCols>("week");
  const [metric, setMetric] = useState<PivotMetric>("visitors");
  const [sort, setSort] = useState("total");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PivotData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams(search);
  Object.entries({ rows, cols, metric, sort, dir, q: term, page: String(page) }).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => (s === "ready" ? "ready" : "loading"));
    fetch(`/api/admin/analytics/pivot?${qs}`, { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: PivotData) => {
        setData(d);
        setState("ready");
      })
      .catch(() => !controller.signal.aborted && setState("error"));
    return () => controller.abort();
  }, [qs]);

  const reset = () => setPage(1);
  const fmt = (v: number | null, cur: CurrencyInfo) => (v === null ? "·" : metric === "value" ? fmtMoney(v, cur) : metric === "rate" ? `${(v * 100).toFixed(1)}%` : fmtNumber(v));
  const sortBy = (key: string) => {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir(key === "label" ? "asc" : "desc");
    }
    reset();
  };
  const ariaSort = (key: string) => (sort === key ? (dir === "asc" ? "ascending" : "descending") : "none");
  const rowLabel = ROWS.find((r) => r.value === rows)!.label;

  return (
    <>
      <div className={styles.toolbarRow}>
        <label className={styles.inlineSelect}>
          <span>Rows</span>
          <select value={rows} onChange={(e) => (setRows(e.target.value as PivotRows), setSort("total"), setDir("desc"), reset())}>
            {ROWS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.inlineSelect}>
          <span>Columns</span>
          <select value={cols} onChange={(e) => (setCols(e.target.value as PivotCols), setSort("total"), reset())}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>
        <label className={styles.inlineSelect}>
          <span>Metric</span>
          <select value={metric} onChange={(e) => (setMetric(e.target.value as PivotMetric), reset())}>
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.searchBox}>
          <span className="sr-only">Search rows</span>
          <input type="search" value={q} onChange={(e) => (setQ(e.target.value), reset())} placeholder={`Search ${rowLabel.toLowerCase()}`} />
        </label>
        <a className={styles.ghostButton} href={`/api/admin/analytics/pivot?${qs}&format=csv`} download>
          Export CSV
        </a>
      </div>

      {state === "error" && !data ? (
        <EmptyState text="The table couldn't load. Change a setting to try again." />
      ) : !data ? (
        <ChartSkeleton height={260} />
      ) : data.rows.length === 0 ? (
        <EmptyState text={term ? `Nothing matches "${term}".` : "No data for these filters in this period."} />
      ) : (
        <>
          <div className={styles.pivotScroll} data-loading={state === "loading" || undefined}>
            <table className={styles.pivot}>
              <thead>
                <tr>
                  <th scope="col" aria-sort={ariaSort("label")}>
                    <button type="button" onClick={() => sortBy("label")}>
                      {rowLabel}
                    </button>
                  </th>
                  {data.columns.map((c) => (
                    <th key={c.key} scope="col" aria-sort={ariaSort(c.key)}>
                      <button type="button" onClick={() => sortBy(c.key)}>
                        {c.label}
                      </button>
                    </th>
                  ))}
                  <th scope="col" aria-sort={ariaSort("total")}>
                    <button type="button" onClick={() => sortBy("total")}>
                      Total
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const hdim = HOVER_OF[data.query.rows];
                  const fdim = FILTER_OF[data.query.rows];
                  return (
                    <tr
                      key={r.key}
                      data-active={hdim && hover?.dim === hdim && hover.value === r.key ? "" : undefined}
                      onMouseEnter={() => hdim && r.key && setHover({ dim: hdim, value: r.key })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <th scope="row">
                        {fdim && r.key ? (
                          <button type="button" onClick={() => setFilter(fdim, r.key)} title={`Filter by ${r.label}`}>
                            {r.label}
                          </button>
                        ) : (
                          r.label
                        )}
                      </th>
                      {r.cells.map((v, i) => (
                        <td key={data.columns[i]!.key} style={{ ["--heat" as string]: data.max ? Math.min(1, (v ?? 0) / data.max) : 0 }}>
                          {fmt(v, data.currency)}
                        </td>
                      ))}
                      <td className={styles.pivotTotal}>{fmt(r.total, data.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.pager}>
            <span>
              {data.totalRows} {data.totalRows === 1 ? "row" : "rows"}
              {data.pages > 1 ? ` · page ${data.query.page} of ${data.pages}` : ""}
            </span>
            {data.pages > 1 && (
              <span className={styles.pagerButtons}>
                <button type="button" className={styles.ghostButton} disabled={data.query.page <= 1} onClick={() => setPage(data.query.page - 1)}>
                  Previous
                </button>
                <button type="button" className={styles.ghostButton} disabled={data.query.page >= data.pages} onClick={() => setPage(data.query.page + 1)}>
                  Next
                </button>
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
}

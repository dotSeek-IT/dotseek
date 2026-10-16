import { addDays, daysBetween, ukParts } from "./time";
import type { Filters, PivotCols, PivotMetric, PivotQuery, PivotRows, QuoteStatus } from "./engine";

/** Dashboard URL parameters: shared by the admin page and /api/admin/analytics so they always agree. */

export const PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "month", label: "This month" },
  { id: "prev-month", label: "Previous month" },
  { id: "custom", label: "Custom range" },
] as const;
export type Preset = (typeof PRESETS)[number]["id"];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

export function presetRange(preset: Preset, today = ukParts(new Date()).day): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "prev-month": {
      const last = addDays(`${today.slice(0, 7)}-01`, -1);
      return { from: `${last.slice(0, 7)}-01`, to: last };
    }
    default:
      return { from: addDays(today, -29), to: today };
  }
}

const pick = <T extends string>(v: string | null | undefined, allowed: readonly T[]) => (v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined);
const clean = (v: string | null | undefined, max = 60) => (v ? v.slice(0, max) : undefined);

export type ParsedQuery = { preset: Preset; filters: Filters; display?: string };

export function parseQuery(get: (k: string) => string | null | undefined): ParsedQuery {
  const today = ukParts(new Date()).day;
  let preset: Preset = pick(get("range"), PRESETS.map((p) => p.id)) ?? "30d";
  let { from, to } = presetRange(preset, today);
  if (preset === "custom") {
    const f = get("from");
    const t = get("to");
    if (f && t && DAY.test(f) && DAY.test(t)) {
      [from, to] = f <= t ? [f, t] : [t, f];
      if (to > today) to = today;
      if (daysBetween(from, to) >= MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1));
    } else preset = "30d";
  }
  const filters: Filters = {
    from,
    to,
    country: clean(get("country"), 2)?.toUpperCase(),
    service: clean(get("service"), 40),
    source: clean(get("source"), 40),
    device: pick(get("device"), ["desktop", "mobile", "tablet", "unknown"] as const),
    status: pick(get("status"), ["none", "awaiting", "accepted", "declined"] as QuoteStatus[]),
    currency: clean(get("currency"), 3)?.toUpperCase(),
  };
  return { preset, filters, display: clean(get("display"), 3)?.toUpperCase() };
}

export function parsePivot(get: (k: string) => string | null | undefined): PivotQuery {
  return {
    rows: pick(get("rows"), ["country", "service", "source", "device", "landing", "status"] as PivotRows[]) ?? "country",
    cols: pick(get("cols"), ["day", "week", "month"] as PivotCols[]) ?? "week",
    metric: pick(get("metric"), ["visitors", "enquiries", "quotes", "value", "conversions", "rate"] as PivotMetric[]) ?? "visitors",
    sort: clean(get("sort"), 12) ?? "total",
    dir: get("dir") === "asc" ? "asc" : "desc",
    search: clean(get("q"), 60) ?? "",
    page: Math.max(1, Number(get("page")) || 1),
    pageSize: 15,
  };
}

/** Back to URL parameters (only what differs from the defaults). */
export function toSearch(q: ParsedQuery): URLSearchParams {
  const s = new URLSearchParams();
  if (q.preset !== "30d") s.set("range", q.preset);
  if (q.preset === "custom") {
    s.set("from", q.filters.from);
    s.set("to", q.filters.to);
  }
  for (const k of ["country", "service", "source", "device", "status", "currency"] as const) {
    const v = q.filters[k];
    if (v) s.set(k, v);
  }
  if (q.display && q.display !== "GBP") s.set("display", q.display);
  return s;
}

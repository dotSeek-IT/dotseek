"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CurrencyInfo, Dashboard, Filters } from "@/lib/analytics/engine";
import { presetRange, toSearch, type ParsedQuery, type Preset } from "@/lib/analytics/query";

/**
 * Shared dashboard state: the global filters (mirrored in the URL), the loaded
 * data, and the linked hover. Clicking a chart applies a filter (one fetch for the
 * whole dashboard); hovering only highlights already loaded data.
 */

export type FilterDim = "country" | "service" | "source" | "device" | "status" | "currency";
export type Hover = { dim: "country" | "service" | "source" | "device"; value: string } | null;

type Ctx = {
  query: ParsedQuery;
  data: Dashboard;
  loading: boolean;
  error: string | null;
  setFilter: (dim: FilterDim, value: string | undefined) => void;
  setRange: (preset: Preset, from?: string, to?: string) => void;
  setDisplay: (code: string) => void;
  clearAll: () => void;
  retry: () => void;
  hover: Hover;
  setHover: (h: Hover) => void;
  /** URL parameters for the current filters (for the pivot and CSV export). */
  search: string;
};

const AnalyticsCtx = createContext<Ctx | null>(null);

export function useAnalytics() {
  const ctx = useContext(AnalyticsCtx);
  if (!ctx) throw new Error("useAnalytics outside AnalyticsProvider");
  return ctx;
}

export function AnalyticsProvider({ initial, initialQuery, children }: { initial: Dashboard; initialQuery: ParsedQuery; children: ReactNode }) {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHoverState] = useState<Hover>(null);
  const [attempt, setAttempt] = useState(0);
  const first = useRef(true);
  const search = useMemo(() => toSearch(query).toString(), [query]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/admin/analytics/all${search ? `?${search}` : ""}`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? "Couldn't load analytics.");
        setData((await r.json()) as Dashboard);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't load analytics.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, attempt]);

  const setFilter = useCallback((dim: FilterDim, value: string | undefined) => {
    setHoverState(null);
    setQuery((q) => ({ ...q, filters: { ...q.filters, [dim]: q.filters[dim] === value ? undefined : value } }));
  }, []);

  const setRange = useCallback((preset: Preset, from?: string, to?: string) => {
    setQuery((q) => {
      const range = preset === "custom" && from && to ? { from, to } : presetRange(preset);
      return { ...q, preset, filters: { ...q.filters, ...range } };
    });
  }, []);

  const setDisplay = useCallback((code: string) => setQuery((q) => ({ ...q, display: code })), []);

  const clearAll = useCallback(() => {
    setHoverState(null);
    setQuery((q) => ({ ...q, filters: { from: q.filters.from, to: q.filters.to } as Filters }));
  }, []);

  // Hover updates at most once per animation frame (smooth, never chatty).
  const frame = useRef(0);
  const setHover = useCallback((h: Hover) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      setHoverState((prev) => (prev?.dim === h?.dim && prev?.value === h?.value ? prev : h)),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({ query, data, loading, error, setFilter, setRange, setDisplay, clearAll, retry: () => setAttempt((n) => n + 1), hover, setHover, search }),
    [query, data, loading, error, setFilter, setRange, setDisplay, clearAll, hover, setHover, search],
  );
  return <AnalyticsCtx.Provider value={value}>{children}</AnalyticsCtx.Provider>;
}

// ---------- Formatting (display currency and locale aware) ----------

export const fmtNumber = (n: number) => Math.round(n).toLocaleString("en-GB");

export const fmtMoney = (n: number, cur: CurrencyInfo) =>
  new Intl.NumberFormat(cur.locale, { style: "currency", currency: cur.code, maximumFractionDigits: cur.decimals, minimumFractionDigits: cur.decimals }).format(n);

export const fmtPct = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? "No visits" : `${(n * 100).toFixed(digits)}%`);

/** Change against the previous period; safe with zeros, and in points for rates. */
export function change(current: number, previous: number, kind: "number" | "money" | "percent"): { text: string; dir: "up" | "down" | "flat" } {
  if (kind === "percent") {
    const pts = (current - previous) * 100;
    if (Math.abs(pts) < 0.05) return { text: "No change", dir: "flat" };
    return { text: `${pts > 0 ? "+" : ""}${pts.toFixed(1)} pts`, dir: pts > 0 ? "up" : "down" };
  }
  if (previous === 0) return current === 0 ? { text: "No change", dir: "flat" } : { text: "New", dir: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "No change", dir: "flat" };
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, dir: pct > 0 ? "up" : "down" };
}

export const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", opts);

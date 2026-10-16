import { isAdmin } from "@/lib/admin/auth";
import { buildDashboard, buildPivot, type Dashboard } from "@/lib/analytics/engine";
import { parsePivot, parseQuery } from "@/lib/analytics/query";

/**
 * GET /api/admin/analytics/{section}?range=30d&country=IN&service=website&source=Google&device=mobile&status=accepted&currency=INR&display=INR
 * Sections: all, summary, trends, countries, journey, activity-heatmap, calendar, services, quotes, insights, pivot.
 * Admin only. Every section is a slice of the same calculation (lib/analytics/engine.ts), so
 * figures always agree; the dashboard loads "all" once per filter change. Pivot also takes
 * rows, cols, metric, sort, dir, q, page and format=csv.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTIONS: Record<string, (d: Dashboard) => unknown> = {
  all: (d) => d,
  summary: (d) => ({ range: d.range, currency: d.currency, meta: d.meta, kpis: d.kpis }),
  trends: (d) => ({ range: d.range, currency: d.currency, trend: d.trend }),
  countries: (d) => ({ range: d.range, currency: d.currency, countries: d.countries }),
  journey: (d) => ({ range: d.range, journey: d.journey }),
  "activity-heatmap": (d) => ({ range: d.range, heat: d.heat, tz: d.meta.tz }),
  calendar: (d) => ({ range: d.range, currency: d.currency, calendar: d.calendar }),
  services: (d) => ({ range: d.range, currency: d.currency, services: d.services }),
  quotes: (d) => ({ range: d.range, currency: d.currency, quotes: d.quotes }),
  insights: (d) => ({ range: d.range, insights: d.insights }),
};

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request, { params }: { params: Promise<{ section: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { section } = await params;
  const url = new URL(request.url);
  const get = (k: string) => url.searchParams.get(k);
  const query = parseQuery(get);
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (section === "pivot") {
      const pivot = await buildPivot(query.filters, parsePivot(get), query.display);
      if (get("format") === "csv") {
        const lines = [
          ["Row", ...pivot.columns.map((c) => c.label), "Total"].map(csvCell).join(","),
          ...pivot.allRows.map((r) => [r.label, ...r.cells, r.total].map(csvCell).join(",")),
        ];
        return new Response(lines.join("\n"), {
          headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="dotseek-analytics-${pivot.query.rows}-${query.filters.from}-${query.filters.to}.csv"` },
        });
      }
      return Response.json({ ...pivot, allRows: undefined }, { headers });
    }
    const pickSection = SECTIONS[section];
    if (!pickSection) return Response.json({ error: "Unknown section." }, { status: 404 });
    return Response.json(pickSection(await buildDashboard(query.filters, query.display)), { headers });
  } catch (error) {
    console.error("[admin analytics]", error instanceof Error ? error.message : error);
    return Response.json({ error: "Analytics are unavailable right now." }, { status: 500, headers });
  }
}

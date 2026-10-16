import "server-only";
import { solutionById } from "@/content/solutions";
import type { Region } from "@/content/regions";
import { countryName } from "@/lib/countries";
import { getRegions } from "@/lib/currency/regions.server";
import { listEnquiries, type Enquiry } from "@/lib/enquiries/store";
import { analyticsAvailable, readSessions, trackingStarted, type SessionRecord } from "./store";
import { addDays, dayRange, daysBetween, ukParts } from "./time";

/**
 * The one analytics calculation layer. Every widget (KPIs, map, journey,
 * heatmaps, treemap, pivot, insights) aggregates the same "facts", so numbers
 * always agree with each other.
 *
 * A fact is one anonymous visit (session) with the furthest journey step it
 * reached, merged with its enquiry when it sent a quote (value, currency, outcome).
 * Enquiries without a visit record (sent before counting began) become quote only
 * facts, so quote history is never lost. Journey steps are cumulative: a sent
 * quote also counts as generated and requested, so funnel totals reconcile.
 */

export type QuoteStatus = "none" | "awaiting" | "accepted" | "declined";
export const QUOTE_STATUSES: QuoteStatus[] = ["none", "awaiting", "accepted", "declined"];
export const statusLabel: Record<QuoteStatus, string> = { none: "No quote sent", awaiting: "Awaiting decision", accepted: "Accepted", declined: "Declined" };

export type Filters = {
  from: string;
  to: string;
  country?: string;
  service?: string;
  source?: string;
  device?: string;
  status?: QuoteStatus;
  /** Quote currency (the currency the customer was quoted in). */
  currency?: string;
};

export type Fact = {
  kind: "visit" | "quote";
  day: string;
  hour: number;
  wd: number;
  country: string;
  device: string;
  browser: string;
  source: string;
  channel: string;
  landing: string;
  service: string | null;
  currency: string | null;
  visitor: number;
  session: number;
  pages: number;
  paths: Record<string, number>;
  chat: number;
  started: number;
  enquiry: number;
  budget: number;
  generated: number;
  viewed: number;
  requested: number;
  sent: number;
  accepted: number;
  declined: number;
  status: QuoteStatus;
  /** Sent quote value: commercial GBP, and the amount in the customer's own currency. */
  valueGbp: number;
  valueLocal: number | null;
  enquiryId?: string;
  ref?: string;
  name?: string;
  company?: string;
  sentAt?: string;
};

export type CurrencyInfo = { code: string; locale: string; decimals: number; perGbp: number };

// ---------- Loading (cached briefly per date window) ----------

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: Promise<{ facts: Fact[]; regions: Region[]; started: string | null }> }>();

function quoteValue(e: Enquiry) {
  const c = e.currency;
  const base = c?.baseGbp ?? e.plan?.estimate?.recommended ?? e.plan?.build ?? 0;
  return {
    gbp: Math.round(base * (c?.regionalFactor ?? 1)),
    local: c ? c.convertedAmount : null,
    currency: c?.customerCurrency ?? "GBP",
  };
}

const quoteStatus = (e: Enquiry): QuoteStatus => (e.outcome === "accepted" ? "accepted" : e.outcome === "declined" ? "declined" : "awaiting");

function fromSession(s: SessionRecord): Fact {
  const ev = s.ev ?? {};
  const sent = ev.quote_sent ? 1 : 0;
  const requested = sent || ev.quote_requested ? 1 : 0;
  const generated = requested || ev.quote_generated ? 1 : 0;
  const enquiry = generated || ev.service_selected ? 1 : 0;
  const started = enquiry || ev.chat_started ? 1 : 0;
  return {
    kind: "visit",
    day: s.day,
    hour: s.hour,
    wd: s.wd,
    country: s.country || "XX",
    device: s.device,
    browser: s.browser,
    source: s.source,
    channel: s.channel,
    landing: s.landing,
    service: s.service ?? null,
    currency: s.currency ?? null,
    visitor: s.nv ? 1 : 0,
    session: 1,
    pages: s.pages,
    paths: s.paths ?? {},
    chat: started || ev.chat_opened ? 1 : 0,
    started,
    enquiry,
    budget: ev.budget_selected || generated ? 1 : 0,
    generated,
    viewed: ev.quote_viewed ? 1 : 0,
    requested,
    sent,
    accepted: 0,
    declined: 0,
    status: sent ? "awaiting" : "none",
    valueGbp: 0,
    valueLocal: null,
    enquiryId: s.enquiry,
  };
}

function applyEnquiry(f: Fact, e: Enquiry) {
  const v = quoteValue(e);
  const status = quoteStatus(e);
  Object.assign(f, {
    service: e.solution && e.solution !== "unknown" ? e.solution : f.service,
    currency: v.currency,
    chat: 1,
    started: 1,
    enquiry: 1,
    budget: 1,
    generated: 1,
    requested: 1,
    sent: 1,
    accepted: status === "accepted" ? 1 : 0,
    declined: status === "declined" ? 1 : 0,
    status,
    valueGbp: v.gbp,
    valueLocal: v.local,
    enquiryId: e.id,
    ref: e.ref,
    name: e.answers.name,
    company: e.answers.company,
    sentAt: e.createdAt,
  });
}

function fromEnquiry(e: Enquiry): Fact {
  const { day, hour, wd } = ukParts(new Date(e.createdAt));
  const f: Fact = {
    kind: "quote",
    day,
    hour,
    wd,
    country: e.currency?.detectedCountry ?? "XX",
    device: "unknown",
    browser: "Unknown",
    source: "Before tracking",
    channel: "Unknown",
    landing: "Before tracking",
    service: null,
    currency: null,
    visitor: 0,
    session: 0,
    pages: 0,
    paths: {},
    chat: 0,
    started: 0,
    enquiry: 0,
    budget: 0,
    generated: 0,
    viewed: 0,
    requested: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    status: "none",
    valueGbp: 0,
    valueLocal: null,
  };
  applyEnquiry(f, e);
  return f;
}

async function loadWindow(from: string, to: string) {
  const key = `${from}|${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = (async () => {
    // A day either side, so visits around midnight still find their enquiry.
    const [sessions, enquiries, regions, started] = await Promise.all([
      readSessions(dayRange(addDays(from, -1), addDays(to, 1))),
      listEnquiries().catch(() => [] as Enquiry[]),
      getRegions(),
      trackingStarted(),
    ]);
    const byEnquiry = new Map(enquiries.map((e) => [e.id, e]));
    const linked = new Set<string>();
    const facts: Fact[] = [];
    for (const s of sessions) {
      const f = fromSession(s);
      const e = s.enquiry ? byEnquiry.get(s.enquiry) : undefined;
      if (e) {
        applyEnquiry(f, e);
        linked.add(e.id);
      }
      if (f.day >= from && f.day <= to) facts.push(f);
    }
    for (const e of enquiries) {
      if (linked.has(e.id)) continue;
      const f = fromEnquiry(e);
      if (f.day >= from && f.day <= to) facts.push(f);
    }
    return { facts, regions, started };
  })();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 30) cache.delete(cache.keys().next().value!);
  return value;
}

/** Clears cached windows (after an outcome changes, so the dashboard shows it at once). */
export const invalidateAnalytics = () => cache.clear();

// ---------- Filters, metrics and helpers ----------

export function matches(f: Fact, filters: Omit<Filters, "from" | "to">) {
  if (filters.country && f.country !== filters.country) return false;
  if (filters.service && f.service !== filters.service) return false;
  if (filters.source && f.source !== filters.source) return false;
  if (filters.device && f.device !== filters.device) return false;
  if (filters.currency && f.currency !== filters.currency) return false;
  if (filters.status && f.status !== filters.status) return false;
  return true;
}

export const serviceLabel = (id: string | null) => (id ? (solutionById(id)?.title ?? (id === "reference" ? "From a reference" : id)) : "Not chosen");
export const placeLabel = (code: string) => countryName(code) ?? "Unknown location";
export const deviceLabel = (d: string) => (d === "unknown" ? "Unknown" : d[0]!.toUpperCase() + d.slice(1));

export function currencyInfo(code: string | undefined, regions: Region[]): CurrencyInfo {
  if (!code || code === "GBP") return { code: "GBP", locale: "en-GB", decimals: 0, perGbp: 1 };
  const r = regions.find((x) => x.currency === code);
  return r ? { code, locale: r.locale, decimals: r.decimals, perGbp: r.perGbp } : { code: "GBP", locale: "en-GB", decimals: 0, perGbp: 1 };
}

/** A quote's value in the display currency: its own stored amount when quoted in it, else from GBP at the current rate. */
export const valueIn = (f: Fact, cur: CurrencyInfo) =>
  cur.code === "GBP" ? f.valueGbp : f.currency === cur.code && f.valueLocal !== null ? f.valueLocal : f.valueGbp * cur.perGbp;

export const formatMoney = (n: number, cur: CurrencyInfo) =>
  new Intl.NumberFormat(cur.locale, { style: "currency", currency: cur.code, maximumFractionDigits: cur.decimals, minimumFractionDigits: cur.decimals }).format(n);

type Totals = {
  visitors: number;
  sessions: number;
  enquiries: number;
  requests: number;
  generated: number;
  sent: number;
  accepted: number;
  declined: number;
  value: number;
  /** Quotes sent by tracked visits (the conversion rate compares like with like). */
  sentTracked: number;
  pages: number;
};

function totals(facts: Fact[], cur: CurrencyInfo): Totals {
  const t: Totals = { visitors: 0, sessions: 0, enquiries: 0, requests: 0, generated: 0, sent: 0, accepted: 0, declined: 0, value: 0, sentTracked: 0, pages: 0 };
  for (const f of facts) {
    t.visitors += f.visitor;
    t.sessions += f.session;
    t.enquiries += f.enquiry;
    t.requests += f.requested;
    t.generated += f.generated;
    t.sent += f.sent;
    t.accepted += f.accepted;
    t.declined += f.declined;
    t.pages += f.pages;
    if (f.sent) t.value += valueIn(f, cur);
    if (f.sent && f.kind === "visit") t.sentTracked += 1;
  }
  return t;
}

const rate = (part: number, whole: number) => (whole > 0 ? part / whole : null);

function groupBy<K extends string>(facts: Fact[], key: (f: Fact) => K | null): Map<K, Fact[]> {
  const m = new Map<K, Fact[]>();
  for (const f of facts) {
    const k = key(f);
    if (k === null) continue;
    const list = m.get(k);
    if (list) list.push(f);
    else m.set(k, [f]);
  }
  return m;
}

// ---------- Dashboard ----------

export type Kpi = { key: string; label: string; value: number; previous: number; format: "number" | "money" | "percent"; hint: string };
export type Insight = { id: string; tone: "up" | "down" | "info"; text: string; filter?: { dim: "country" | "service" | "source" | "device"; value: string } };

export async function buildDashboard(filters: Filters, display?: string) {
  const len = daysBetween(filters.from, filters.to) + 1;
  const prevTo = addDays(filters.from, -1);
  const prevFrom = addDays(filters.from, -len);
  const calFrom = addDays(filters.to, -89);
  const loadFrom = prevFrom < calFrom ? prevFrom : calFrom;
  const { facts: all, regions, started } = await loadWindow(loadFrom, filters.to);
  const cur = currencyInfo(display, regions);
  const scoped = all.filter((f) => matches(f, filters));
  const now = scoped.filter((f) => f.day >= filters.from && f.day <= filters.to);
  const before = scoped.filter((f) => f.day >= prevFrom && f.day <= prevTo);
  const t = totals(now, cur);
  const p = totals(before, cur);
  const conv = (x: Totals) => rate(x.sentTracked, x.visitors) ?? 0;

  const kpis: Kpi[] = [
    { key: "visitors", label: "Visitors", value: t.visitors, previous: p.visitors, format: "number", hint: `${t.pages.toLocaleString("en-GB")} page views` },
    { key: "sessions", label: "Sessions", value: t.sessions, previous: p.sessions, format: "number", hint: t.visitors ? `${(t.sessions / t.visitors).toFixed(1)} per visitor` : "Visits to the site" },
    { key: "enquiries", label: "Enquiries started", value: t.enquiries, previous: p.enquiries, format: "number", hint: "Chose a service in the chat" },
    { key: "requests", label: "Quote requests", value: t.requests, previous: p.requests, format: "number", hint: "Asked to send the quote" },
    { key: "generated", label: "Quotes generated", value: t.generated, previous: p.generated, format: "number", hint: "Saw an estimate" },
    { key: "sent", label: "Quotes sent", value: t.sent, previous: p.sent, format: "number", hint: "Enquiries received" },
    { key: "accepted", label: "Accepted quotes", value: t.accepted, previous: p.accepted, format: "number", hint: t.accepted + t.declined ? `${Math.round((t.accepted / (t.accepted + t.declined)) * 100)}% of decided quotes` : "Set on each enquiry" },
    { key: "conversion", label: "Conversion rate", value: conv(t), previous: conv(p), format: "percent", hint: "Visitors who sent a quote" },
    { key: "value", label: "Total quoted value", value: t.value, previous: p.value, format: "money", hint: "Recommended estimates sent" },
    { key: "average", label: "Average quote value", value: t.sent ? t.value / t.sent : 0, previous: p.sent ? p.value / p.sent : 0, format: "money", hint: "Per quote sent" },
  ];

  // Trend: hourly for a single day, otherwise daily; the previous period aligned by position.
  const hourly = len === 1;
  const bucketsOf = (facts: Fact[], from: string, to: string) => {
    const keys = hourly ? Array.from({ length: 24 }, (_, h) => String(h)) : dayRange(from, to);
    const by = groupBy(facts, (f) => (hourly ? String(f.hour) : f.day));
    return keys.map((k) => {
      const x = totals(by.get(k) ?? [], cur);
      return { key: k, visitors: x.visitors, sessions: x.sessions, enquiries: x.enquiries, quotes: x.generated, sent: x.sent, value: Math.round(x.value), conversion: rate(x.sentTracked, x.visitors) ?? 0 };
    });
  };
  const trend = { hourly, current: bucketsOf(now, filters.from, filters.to), previous: bucketsOf(before, prevFrom, prevTo) };

  // Countries.
  const countries = [...groupBy(now, (f) => f.country).entries()]
    .map(([code, fs]) => {
      const x = totals(fs, cur);
      return { code, name: placeLabel(code), visitors: x.visitors, enquiries: x.enquiries, quotes: x.generated, sent: x.sent, accepted: x.accepted, value: Math.round(x.value), conversion: rate(x.sentTracked, x.visitors) };
    })
    .sort((a, b) => b.visitors - a.visitors || b.sent - a.sent);

  // Journey (tracked visits only): source -> landing -> chat -> estimate -> request -> sent -> outcome.
  const visits = now.filter((f) => f.kind === "visit");
  const links = new Map<string, number>();
  const nodeInfo = new Map<string, { label: string; level: number; kind: "source" | "landing" | "stage" | "drop" | "outcome" }>();
  const node = (id: string, label: string, level: number, kind: "source" | "landing" | "stage" | "drop" | "outcome") => {
    if (!nodeInfo.has(id)) nodeInfo.set(id, { label, level, kind });
    return id;
  };
  const link = (a: string, b: string) => links.set(`${a}\u0000${b}`, (links.get(`${a}\u0000${b}`) ?? 0) + 1);
  for (const f of visits) {
    const src = node(`s:${f.source}`, f.source, 0, "source");
    const land = node(`l:${f.landing}`, f.landing, 1, "landing");
    link(src, land);
    if (!f.started) {
      link(land, node("d:browse", "Browsed only", 2, "drop"));
      continue;
    }
    const chat = node("j:chat", "Started chat", 2, "stage");
    link(land, chat);
    if (!f.generated) {
      link(chat, node("d:chat", "Left the chat", 3, "drop"));
      continue;
    }
    const est = node("j:est", "Estimate generated", 3, "stage");
    link(chat, est);
    if (!f.requested) {
      link(est, node("d:est", "Left at estimate", 4, "drop"));
      continue;
    }
    const req = node("j:req", "Quote requested", 4, "stage");
    link(est, req);
    if (!f.sent) {
      link(req, node("d:req", "Left at contact details", 5, "drop"));
      continue;
    }
    const sent = node("j:sent", "Quote sent", 5, "stage");
    link(req, sent);
    link(sent, f.status === "accepted" ? node("o:accepted", "Accepted", 6, "outcome") : f.status === "declined" ? node("o:declined", "Declined", 6, "outcome") : node("o:awaiting", "Awaiting decision", 6, "outcome"));
  }
  const journey = {
    visits: visits.length,
    nodes: [...nodeInfo.entries()].map(([id, n]) => ({ id, ...n })),
    links: [...links.entries()].map(([k, value]) => {
      const [source, target] = k.split("\u0000");
      return { source: source!, target: target!, value };
    }),
  };

  // Activity heatmap (UK time): 7 x 24 cells.
  const blank = () => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const heat = { visitors: blank(), enquiries: blank(), quotes: blank(), conversions: blank() };
  for (const f of now) {
    if (f.wd < 0 || f.wd > 6) continue;
    heat.visitors[f.wd]![f.hour]! += f.visitor;
    heat.enquiries[f.wd]![f.hour]! += f.enquiry;
    heat.quotes[f.wd]![f.hour]! += f.generated;
    heat.conversions[f.wd]![f.hour]! += f.sent;
  }

  // Calendar: the last 90 days ending at the range end (other filters still apply).
  const calFacts = scoped.filter((f) => f.day >= calFrom && f.day <= filters.to);
  const calBy = groupBy(calFacts, (f) => f.day);
  const calendar = dayRange(calFrom, filters.to).map((day) => {
    const x = totals(calBy.get(day) ?? [], cur);
    return { day, visitors: x.visitors, enquiries: x.enquiries, quotes: x.generated, sent: x.sent, value: Math.round(x.value), conversion: rate(x.sentTracked, x.visitors) };
  });

  // Services by quoted value.
  const services = [...groupBy(now, (f) => (f.service ? f.service : null)).entries()]
    .map(([id, fs]) => {
      const x = totals(fs, cur);
      return { id, name: serviceLabel(id), enquiries: x.enquiries, quotes: x.sent, value: Math.round(x.value), average: x.sent ? Math.round(x.value / x.sent) : 0, accepted: x.accepted, declined: x.declined, winRate: rate(x.accepted, x.accepted + x.declined), conversion: rate(x.sent, x.enquiries) };
    })
    .filter((s) => s.enquiries > 0 || s.quotes > 0)
    .sort((a, b) => b.value - a.value || b.enquiries - a.enquiries);

  // Quotes (recent and highest value), pages and devices.
  const sentFacts = now.filter((f) => f.sent && f.enquiryId);
  const quoteRow = (f: Fact) => ({
    id: f.enquiryId!,
    ref: f.ref ?? "",
    name: f.name ?? "",
    company: f.company ?? "",
    service: serviceLabel(f.service),
    country: f.country,
    countryName: placeLabel(f.country),
    source: f.source,
    device: deviceLabel(f.device),
    status: f.status,
    value: Math.round(valueIn(f, cur)),
    at: f.sentAt ?? `${f.day}T12:00:00Z`,
  });
  const quotes = {
    recent: [...sentFacts].sort((a, b) => (b.sentAt ?? b.day).localeCompare(a.sentAt ?? a.day)).slice(0, 8).map(quoteRow),
    top: [...sentFacts].sort((a, b) => valueIn(b, cur) - valueIn(a, cur)).slice(0, 8).map(quoteRow),
  };
  const pageViews = new Map<string, number>();
  for (const f of now) for (const [path, n] of Object.entries(f.paths)) pageViews.set(path, (pageViews.get(path) ?? 0) + n);
  const pages = [...pageViews.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, views]) => ({ path, views }));
  const devices = [...groupBy(visits, (f) => f.device).entries()]
    .map(([d, fs]) => {
      const x = totals(fs, cur);
      return { device: d, label: deviceLabel(d), visitors: x.visitors, sent: x.sent, conversion: rate(x.sentTracked, x.visitors) };
    })
    .sort((a, b) => b.visitors - a.visitors);

  // Filter options from the whole loaded window (so choices don't vanish when one is applied).
  const windowFacts = all.filter((f) => f.day >= prevFrom && f.day <= filters.to);
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))];
  const options = {
    countries: uniq(windowFacts.map((f) => f.country)).map((code) => ({ value: code, label: placeLabel(code) })).sort((a, b) => a.label.localeCompare(b.label)),
    services: uniq(windowFacts.map((f) => f.service)).map((id) => ({ value: id, label: serviceLabel(id) })).sort((a, b) => a.label.localeCompare(b.label)),
    sources: uniq(windowFacts.map((f) => f.source)).sort().map((s) => ({ value: s, label: s })),
    devices: uniq(windowFacts.map((f) => f.device)).map((d) => ({ value: d, label: deviceLabel(d) })),
    currencies: uniq(windowFacts.map((f) => f.currency)).sort().map((c) => ({ value: c, label: c })),
    displayCurrencies: uniq(["GBP", ...regions.map((r) => r.currency)]).map((c) => ({ value: c, label: c })),
  };

  return {
    filters,
    range: { from: filters.from, to: filters.to, days: len, previous: { from: prevFrom, to: prevTo } },
    currency: cur,
    meta: { available: analyticsAvailable(), started, tz: "UK time" },
    kpis,
    trend,
    countries,
    journey,
    heat,
    calendar,
    services,
    quotes,
    pages,
    devices,
    insights: insightsFor(now, before, t, p, cur, len),
    options,
  };
}

export type Dashboard = Awaited<ReturnType<typeof buildDashboard>>;

// ---------- Insights (deterministic, only when the data supports them) ----------

function insightsFor(now: Fact[], before: Fact[], t: Totals, p: Totals, cur: CurrencyInfo, len: number): Insight[] {
  const out: (Insight & { score: number })[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const period = `the previous ${len === 1 ? "day" : `${len} days`}`;

  // Traffic change.
  if (Math.max(t.visitors, p.visitors) >= 10 && p.visitors > 0) {
    const change = (t.visitors - p.visitors) / p.visitors;
    if (Math.abs(change) >= 0.1)
      out.push({ id: "visitors", tone: change > 0 ? "up" : "down", text: `Visitors ${change > 0 ? "increased" : "fell"} ${pct(Math.abs(change))} compared with ${period}.`, score: Math.abs(change) * 2 });
  }

  // Where quote requests come from.
  const requests = now.filter((f) => f.requested);
  if (requests.length >= 5) {
    const by = [...groupBy(requests, (f) => f.country).entries()].sort((a, b) => b[1].length - a[1].length);
    const [code, list] = by[0]!;
    const share = list.length / requests.length;
    if (by.length > 1 && share >= 0.3 && code !== "XX")
      out.push({ id: "country-share", tone: "info", text: `${placeLabel(code)} generated ${pct(share)} of all quote requests.`, filter: { dim: "country", value: code }, score: share * 2 });
  }

  // Device conversion.
  const visits = now.filter((f) => f.kind === "visit");
  const devConv = [...groupBy(visits, (f) => f.device).entries()]
    .map(([d, fs]) => ({ d, visitors: fs.reduce((n, f) => n + f.visitor, 0), sent: fs.reduce((n, f) => n + f.sent, 0) }))
    .filter((x) => x.visitors >= 30);
  const mobile = devConv.find((x) => x.d === "mobile");
  const desktop = devConv.find((x) => x.d === "desktop");
  if (mobile && desktop && mobile.sent + desktop.sent >= 4 && mobile.sent > 0 && desktop.sent > 0) {
    const mr = mobile.sent / mobile.visitors;
    const dr = desktop.sent / desktop.visitors;
    const ratio = Math.max(mr, dr) / Math.min(mr, dr);
    if (ratio >= 1.3)
      out.push({ id: "device", tone: "info", text: `${mr > dr ? "Mobile" : "Desktop"} visitors convert ${ratio.toFixed(1)}× better than ${mr > dr ? "desktop" : "mobile"} visitors.`, filter: { dim: "device", value: mr > dr ? "mobile" : "desktop" }, score: ratio });
  }

  // Service value leader, and hidden gems (little demand, much value).
  const sent = now.filter((f) => f.sent);
  const svc = [...groupBy(sent, (f) => f.service).entries()].map(([id, fs]) => ({ id, value: fs.reduce((n, f) => n + valueIn(f, cur), 0), count: fs.length })).sort((a, b) => b.value - a.value);
  if (svc.filter((s) => s.value > 0).length >= 2 && t.value > 0) {
    const top = svc[0]!;
    out.push({ id: "service-value", tone: "info", text: `${serviceLabel(top.id)} generated the highest quoted value (${formatMoney(top.value, cur)}, ${pct(top.value / t.value)} of the total).`, filter: { dim: "service", value: top.id }, score: 1.2 });
    const enquiriesBy = groupBy(now.filter((f) => f.enquiry), (f) => f.service);
    const totalEnq = now.filter((f) => f.enquiry).length;
    const gem = svc.find((s) => totalEnq >= 10 && (enquiriesBy.get(s.id)?.length ?? 0) / totalEnq < 0.15 && s.value / t.value >= 0.3);
    if (gem && gem.id !== top.id)
      out.push({ id: "service-gem", tone: "up", text: `${serviceLabel(gem.id)} has little demand but high value: under 15% of enquiries, ${pct(gem.value / t.value)} of quoted value.`, filter: { dim: "service", value: gem.id }, score: 1.6 });
  }

  // Busiest three hours for quote requests (UK time).
  if (requests.length >= 8) {
    const hours = Array.from({ length: 24 }, (_, h) => requests.filter((f) => f.hour === h).length);
    let best = 0;
    let at = 0;
    for (let h = 0; h < 24; h++) {
      const w = hours[h]! + hours[(h + 1) % 24]! + hours[(h + 2) % 24]!;
      if (w > best) [best, at] = [w, h];
    }
    const share = best / requests.length;
    const span = `${String(at).padStart(2, "0")}:00 and ${String((at + 3) % 24).padStart(2, "0")}:00`;
    if (share >= 0.3) out.push({ id: "hours", tone: "info", text: `${share >= 0.5 ? "Most" : `${pct(share)} of`} quote requests arrive between ${span} (UK time).`, score: share * 1.5 });
  }

  // Source conversion against direct traffic.
  const bySource = [...groupBy(visits, (f) => f.source).entries()]
    .map(([s, fs]) => ({ s, visitors: fs.reduce((n, f) => n + f.visitor, 0), sent: fs.reduce((n, f) => n + f.sent, 0) }))
    .filter((x) => x.visitors >= 50);
  const direct = bySource.find((x) => x.s === "Direct");
  // The biggest named source against direct traffic, only with enough quotes on both sides to mean something.
  const bestSource = bySource.filter((x) => x.s !== "Direct" && x.sent >= 3).sort((a, b) => b.visitors - a.visitors)[0];
  if (direct && bestSource && direct.sent >= 3) {
    const lift = bestSource.sent / bestSource.visitors / (direct.sent / direct.visitors) - 1;
    if (Math.abs(lift) >= 0.2)
      out.push({ id: "source", tone: lift > 0 ? "up" : "down", text: `${bestSource.s} traffic converts ${pct(Math.abs(lift))} ${lift > 0 ? "better" : "worse"} than direct traffic.`, filter: { dim: "source", value: bestSource.s }, score: Math.abs(lift) + 0.5 });
  }

  // Highest average quote by country.
  const avgByCountry = [...groupBy(sent, (f) => f.country).entries()]
    .filter(([code, fs]) => code !== "XX" && fs.length >= 3)
    .map(([code, fs]) => ({ code, avg: fs.reduce((n, f) => n + valueIn(f, cur), 0) / fs.length }))
    .sort((a, b) => b.avg - a.avg);
  if (avgByCountry.length >= 2)
    out.push({ id: "avg-country", tone: "info", text: `${placeLabel(avgByCountry[0]!.code)} visitors have the highest average quote value (${formatMoney(avgByCountry[0]!.avg, cur)}).`, filter: { dim: "country", value: avgByCountry[0]!.code }, score: 1 });

  // High traffic, poor conversion.
  const overall = t.visitors ? t.sentTracked / t.visitors : 0;
  if (t.visitors >= 50 && overall > 0) {
    const weak = [...groupBy(visits, (f) => f.country).entries()]
      .map(([code, fs]) => ({ code, visitors: fs.reduce((n, f) => n + f.visitor, 0), sent: fs.reduce((n, f) => n + f.sent, 0) }))
      .filter((x) => x.code !== "XX" && x.visitors / t.visitors >= 0.15 && x.sent / x.visitors < overall / 2)
      .sort((a, b) => b.visitors - a.visitors)[0];
    if (weak)
      out.push({ id: "weak-country", tone: "down", text: `${placeLabel(weak.code)} brings ${pct(weak.visitors / t.visitors)} of visitors but converts at ${((weak.sent / weak.visitors) * 100).toFixed(1)}% (overall ${(overall * 100).toFixed(1)}%).`, filter: { dim: "country", value: weak.code }, score: 1.7 });
  }

  // Biggest drop off in the journey.
  const steps: [string, number, string][] = [
    ["visit", visits.length, "visitors"],
    ["chat", visits.filter((f) => f.started).length, "start the chat"],
    ["estimate", visits.filter((f) => f.generated).length, "generate an estimate"],
    ["request", visits.filter((f) => f.requested).length, "request the quote"],
    ["sent", visits.filter((f) => f.sent).length, "send it"],
  ];
  let worst: { from: string; to: string; drop: number } | null = null;
  for (let i = 1; i < steps.length; i++) {
    const [, n0, l0] = steps[i - 1]!;
    const [, n1, l1] = steps[i]!;
    if (n0 >= 20) {
      const drop = 1 - n1 / n0;
      if (!worst || drop > worst.drop) worst = { from: l0, to: l1, drop };
    }
  }
  if (worst && worst.drop >= 0.5 && worst.from !== "visitors")
    out.push({ id: "dropoff", tone: "down", text: `The biggest drop off: ${pct(worst.drop)} of visitors who ${worst.from} leave before they ${worst.to}.`, score: worst.drop * 1.4 });

  // Win rate.
  if (t.accepted + t.declined >= 3)
    out.push({ id: "win", tone: t.accepted >= t.declined ? "up" : "down", text: `${pct(t.accepted / (t.accepted + t.declined))} of decided quotes were accepted (${t.accepted} of ${t.accepted + t.declined}).`, score: 0.9 });

  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((i): Insight => ({ id: i.id, tone: i.tone, text: i.text, ...(i.filter ? { filter: i.filter } : {}) }));
}

// ---------- Pivot ----------

export const PIVOT_ROWS = ["country", "service", "source", "device", "landing", "status"] as const;
export const PIVOT_COLS = ["day", "week", "month"] as const;
export const PIVOT_METRICS = ["visitors", "enquiries", "quotes", "value", "conversions", "rate"] as const;
export type PivotRows = (typeof PIVOT_ROWS)[number];
export type PivotCols = (typeof PIVOT_COLS)[number];
export type PivotMetric = (typeof PIVOT_METRICS)[number];
export type PivotQuery = { rows: PivotRows; cols: PivotCols; metric: PivotMetric; sort: string; dir: "asc" | "desc"; search: string; page: number; pageSize: number };

const weekStart = (day: string) => {
  const wd = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(day, -wd);
};

export async function buildPivot(filters: Filters, q: PivotQuery, display?: string) {
  const { facts: all, regions } = await loadWindow(filters.from, filters.to);
  const cur = currencyInfo(display, regions);
  const facts = all.filter((f) => matches(f, filters));
  const colKey = (day: string) => (q.cols === "day" ? day : q.cols === "week" ? weekStart(day) : day.slice(0, 7));
  const colKeys = [...new Set(dayRange(filters.from, filters.to).map(colKey))];
  const colLabel = (k: string) =>
    q.cols === "month"
      ? new Date(`${k}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
      : `${q.cols === "week" ? "w/c " : ""}${new Date(`${k}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  const rowKey = (f: Fact): string =>
    q.rows === "country" ? f.country : q.rows === "service" ? (f.service ?? "") : q.rows === "source" ? f.source : q.rows === "device" ? f.device : q.rows === "landing" ? f.landing : f.status;
  const rowLabel = (k: string) =>
    q.rows === "country" ? placeLabel(k) : q.rows === "service" ? serviceLabel(k || null) : q.rows === "device" ? deviceLabel(k) : q.rows === "status" ? statusLabel[k as QuoteStatus] : k;
  const measure = (fs: Fact[]): number | null => {
    const x = totals(fs, cur);
    if (q.metric === "visitors") return x.visitors;
    if (q.metric === "enquiries") return x.enquiries;
    if (q.metric === "quotes") return x.generated;
    if (q.metric === "conversions") return x.sent;
    if (q.metric === "value") return Math.round(x.value);
    return rate(x.sentTracked, x.visitors);
  };

  let rows = [...groupBy(facts, rowKey).entries()].map(([key, fs]) => {
    const byCol = groupBy(fs, (f) => colKey(f.day));
    return { key, label: rowLabel(key), cells: colKeys.map((c) => measure(byCol.get(c) ?? [])), total: measure(fs) };
  });
  const search = q.search.trim().toLowerCase();
  if (search) rows = rows.filter((r) => r.label.toLowerCase().includes(search));
  const sortVal = (r: (typeof rows)[number]) => (q.sort === "label" ? r.label : q.sort === "total" ? (r.total ?? -1) : (r.cells[colKeys.indexOf(q.sort)] ?? -1));
  rows.sort((a, b) => {
    const va = sortVal(a);
    const vb = sortVal(b);
    const c = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return q.dir === "asc" ? c : -c;
  });
  const max = Math.max(0, ...rows.flatMap((r) => r.cells.map((c) => c ?? 0)));
  const pages = Math.max(1, Math.ceil(rows.length / q.pageSize));
  const page = Math.min(Math.max(1, q.page), pages);
  return {
    query: { ...q, page },
    currency: cur,
    columns: colKeys.map((k) => ({ key: k, label: colLabel(k) })),
    rows: rows.slice((page - 1) * q.pageSize, page * q.pageSize),
    allRows: rows,
    totalRows: rows.length,
    pages,
    max,
  };
}

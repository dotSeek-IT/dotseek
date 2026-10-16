import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { JourneyEvent } from "./events";
import { browserOf, classifySource, deviceOf, landingLabel } from "./sources";
import { ukParts } from "./time";

/**
 * Privacy friendly analytics, kept on our own server: no cookies, nothing stored
 * on the visitor's device and no IP addresses kept.
 *
 * One anonymous record per visit (session). A visit is recognised on the server
 * through a one way hash of the UK date, IP address and browser: that hash only
 * lives in short lived keys (the active session for 30 minutes of inactivity, and
 * "seen today" for two days), never in the stored records. Records hold the
 * journey (when each step was first reached), the landing page, source, country,
 * device and the quote amounts, so every chart can be filtered and combined.
 *
 *   an:sd:YYYY-MM-DD   hash  session id -> JSON record (UK start day), kept 400 days
 *   an:act:<hash>      day|session id, expires after 30 minutes idle
 *   an:seen:YYYY-MM-DD set of visitor hashes for "new visitor today", 2 days
 *   an:started         ISO time counting began
 */

export type SessionRecord = {
  id: string;
  /** UK date, hour (0 to 23) and weekday (0 = Monday) the visit started. */
  day: string;
  at: string;
  hour: number;
  wd: number;
  country: string;
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  source: string;
  channel: string;
  /** Referrer host only (no paths), when it was another website. */
  refHost?: string;
  landing: string;
  pages: number;
  /** Page views per path (at most 20 paths). */
  paths: Record<string, number>;
  /** 1 when this was the visitor's first visit of the (UK) day. */
  nv: 0 | 1;
  /** First time each journey step was reached. */
  ev: Partial<Record<JourneyEvent, string>>;
  service?: string;
  /** Currency the estimate was shown in, and its value in GBP (engine base). */
  currency?: string;
  estimateGbp?: number;
  /** Enquiry saved from this visit (links the quote's value and outcome). */
  enquiry?: string;
};

export type VisitInput = { ip: string; ua: string; country: string | null; ownHost: string };

const SESSION_TTL = 30 * 60;
const SEEN_TTL = 2 * 86_400;
const DAY_TTL = 400 * 86_400;

interface Backend {
  getActive(hash: string): Promise<string | null>;
  setActive(hash: string, value: string): Promise<void>;
  /** True the first time this visitor hash is seen on this day. */
  firstVisit(day: string, hash: string): Promise<boolean>;
  getSession(day: string, id: string): Promise<SessionRecord | null>;
  putSession(record: SessionRecord): Promise<void>;
  readDays(days: string[]): Promise<SessionRecord[][]>;
  started(set?: string): Promise<string | null>;
}

function redisBackend(): Backend | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    getActive: (hash) => redis.get<string>(`an:act:${hash}`),
    setActive: async (hash, value) => {
      await redis.set(`an:act:${hash}`, value, { ex: SESSION_TTL });
    },
    firstVisit: async (day, hash) => {
      const key = `an:seen:${day}`;
      const added = await redis.sadd(key, hash);
      if (added) await redis.expire(key, SEEN_TTL);
      return added === 1;
    },
    getSession: async (day, id) => {
      const raw = await redis.hget<SessionRecord | string>(`an:sd:${day}`, id);
      return raw ? (typeof raw === "string" ? (JSON.parse(raw) as SessionRecord) : raw) : null;
    },
    putSession: async (record) => {
      const key = `an:sd:${record.day}`;
      const p = redis.pipeline();
      p.hset(key, { [record.id]: JSON.stringify(record) });
      p.expire(key, DAY_TTL);
      await p.exec();
    },
    readDays: async (days) => {
      if (!days.length) return [];
      const p = redis.pipeline();
      for (const d of days) p.hgetall(`an:sd:${d}`);
      const rows = (await p.exec()) as (Record<string, unknown> | null)[];
      return rows.map((row) =>
        row ? Object.values(row).map((v) => (typeof v === "string" ? (JSON.parse(v) as SessionRecord) : (v as SessionRecord))) : [],
      );
    },
    started: async (set) => {
      if (set) await redis.set("an:started", set, { nx: true });
      return redis.get<string>("an:started");
    },
  };
}

function fileBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "analytics.json");
  type Db = {
    sessions: Record<string, Record<string, SessionRecord>>;
    active: Record<string, { value: string; until: number }>;
    seen: Record<string, string[]>;
    started?: string;
  };
  const read = async (): Promise<Db> => {
    try {
      const db = JSON.parse(await fs.readFile(file, "utf8")) as Partial<Db>;
      return { sessions: db.sessions ?? {}, active: db.active ?? {}, seen: db.seen ?? {}, started: db.started };
    } catch {
      return { sessions: {}, active: {}, seen: {} };
    }
  };
  const write = async (db: Db) => {
    const now = Date.now();
    for (const [k, v] of Object.entries(db.active)) if (v.until < now) delete db.active[k];
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db));
  };
  return {
    getActive: async (hash) => {
      const a = (await read()).active[hash];
      return a && a.until > Date.now() ? a.value : null;
    },
    setActive: async (hash, value) => {
      const db = await read();
      db.active[hash] = { value, until: Date.now() + SESSION_TTL * 1000 };
      await write(db);
    },
    firstVisit: async (day, hash) => {
      const db = await read();
      const keep = new Set(Object.keys(db.seen).sort().slice(-2).concat(day));
      for (const d of Object.keys(db.seen)) if (!keep.has(d)) delete db.seen[d];
      const seen = (db.seen[day] ??= []);
      if (seen.includes(hash)) return false;
      seen.push(hash);
      await write(db);
      return true;
    },
    getSession: async (day, id) => (await read()).sessions[day]?.[id] ?? null,
    putSession: async (record) => {
      const db = await read();
      (db.sessions[record.day] ??= {})[record.id] = record;
      await write(db);
    },
    readDays: async (days) => {
      const db = await read();
      return days.map((d) => Object.values(db.sessions[d] ?? {}));
    },
    started: async (set) => {
      const db = await read();
      if (set && !db.started) {
        db.started = set;
        await write(db);
      }
      return db.started ?? null;
    },
  };
}

let cached: Backend | null | undefined;
function backend(): Backend | null {
  if (cached !== undefined) return cached;
  cached = redisBackend() ?? (process.env.VERCEL ? null : fileBackend());
  return cached;
}

export const analyticsAvailable = () => backend() !== null;

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|vercel/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);

const countryCode = (code: string | null) => (code && /^[A-Z]{2}$/.test(code) ? code : "XX");
const cleanPath = (p: string) => p.replace(/[^\w./-]/g, "").slice(0, 80) || "/";

function visitorHash(day: string, input: VisitInput) {
  const salt = process.env.ANALYTICS_SALT || process.env.ADMIN_PASSWORD || "dotseek";
  return createHash("sha256").update(`${salt}:${day}:${input.ip}:${input.ua}`).digest("hex").slice(0, 24);
}

let startedCache: string | null = null;

/**
 * The visitor's current session (refreshing its 30 minute idle timer), or a new
 * one. `start` describes the landing when this request begins a visit.
 */
async function resolveSession(
  db: Backend,
  input: VisitInput,
  start: { path: string; referrer: string | null; utm: string | null; quoteLink: boolean } | null,
): Promise<SessionRecord> {
  const now = new Date();
  const { day, hour, wd } = ukParts(now);
  const hash = visitorHash(day, input);
  const active = await db.getActive(hash);
  if (active) {
    const [sday, sid] = active.split("|");
    const existing = sday && sid ? await db.getSession(sday, sid) : null;
    if (existing) {
      await db.setActive(hash, active);
      return existing;
    }
  }
  const src = classifySource(start?.referrer ?? null, start?.utm ?? null, input.ownHost);
  const record: SessionRecord = {
    id: randomBytes(9).toString("base64url"),
    day,
    at: now.toISOString(),
    hour,
    wd,
    country: countryCode(input.country),
    device: deviceOf(input.ua),
    browser: browserOf(input.ua),
    source: src.source,
    channel: src.channel,
    ...(src.host ? { refHost: src.host } : {}),
    landing: start ? landingLabel(start.path, start.quoteLink) : "No page view",
    pages: 0,
    paths: {},
    nv: (await db.firstVisit(day, hash)) ? 1 : 0,
    ev: {},
  };
  await db.setActive(hash, `${day}|${record.id}`);
  if (!startedCache) startedCache = await db.started(now.toISOString());
  return record;
}

export async function recordView(input: VisitInput & { path: string; referrer: string | null; utm: string | null; quoteLink: boolean }) {
  const db = backend();
  if (!db) return;
  const record = await resolveSession(db, input, input);
  const p = cleanPath(input.path);
  record.pages += 1;
  if (record.paths[p] !== undefined || Object.keys(record.paths).length < 20) record.paths[p] = (record.paths[p] ?? 0) + 1;
  await db.putSession(record);
}

/** Marks a journey step (first time only) and any details it carries. */
export async function recordStep(
  input: VisitInput,
  step: JourneyEvent,
  data: { service?: string; currency?: string; estimateGbp?: number; enquiry?: string } = {},
): Promise<{ session: string; day: string } | null> {
  const db = backend();
  if (!db) return null;
  const record = await resolveSession(db, input, null);
  record.ev[step] ??= new Date().toISOString();
  if (data.service && (!record.service || step === "service_selected" || step === "quote_sent")) record.service = data.service.slice(0, 40);
  if (data.currency && /^[A-Z]{3}$/.test(data.currency)) record.currency = data.currency;
  if (typeof data.estimateGbp === "number" && Number.isFinite(data.estimateGbp) && data.estimateGbp >= 0) record.estimateGbp = Math.round(data.estimateGbp);
  if (data.enquiry) record.enquiry = data.enquiry;
  await db.putSession(record);
  return { session: record.id, day: record.day };
}

/** Session records for these UK days (oldest first). */
export async function readSessions(days: string[]): Promise<SessionRecord[]> {
  const db = backend();
  if (!db || !days.length) return [];
  return (await db.readDays(days).catch(() => [])).flat();
}

/** ISO time visit counting began, or null before the first visit. */
export async function trackingStarted(): Promise<string | null> {
  const db = backend();
  return db ? db.started().catch(() => null) : null;
}

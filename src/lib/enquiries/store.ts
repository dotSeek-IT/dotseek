import "server-only";
import type { CurrencySnapshot } from "@/lib/currency/money";
import { randomBytes, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { Answers } from "@/content/enquiryFlows";
import type { Plan, PlanChoices } from "@/lib/plan/build";
import type { ReferenceAnalysis } from "@/lib/plan/referenceFeatures";

/**
 * Enquiry storage. Production uses Upstash Redis (Vercel Marketplace / KV):
 * set KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN). Local development falls back to .data/enquiries.json.
 * On Vercel without Redis configured, storage is unavailable: enquiries are
 * still emailed, but the admin inbox and customer threads are disabled.
 */

export type EnquiryStatus = "new" | "in_progress" | "awaiting_customer" | "closed";
/** The customer's decision on the quotation, set by the team (absent = awaiting decision). */
export type QuoteOutcome = "accepted" | "declined";

export type ThreadMessage = {
  id: string;
  from: "customer" | "team" | "system";
  body: string;
  at: string;
  author?: string;
};

export type EnquirySummary = {
  title: string;
  recommendedSolution: string;
  overview: string;
  suggestedFeatures: string[];
  suggestedTechnology: string[];
  openQuestions: string[];
  architecture?: string;
  advice?: { item: string | null; action: "add" | "remove" | "info"; message: string }[];
};

export type Enquiry = {
  id: string;
  /** Short human reference shown to customers, e.g. DS-4K7Q2M. */
  ref: string;
  /** Secret for the customer's private enquiry link. Never shown in lists. */
  token: string;
  createdAt: string;
  updatedAt: string;
  status: EnquiryStatus;
  solution: string;
  answers: Answers;
  summary?: EnquirySummary;
  /** AI-generated indicative estimate + architecture, recalculated on the server at submit. */
  plan?: Plan;
  choices?: PlanChoices;
  consultation?: boolean;
  /** New-customer offer shown, and whether the email qualified as a first enquiry. */
  offer?: { label: string; price: number; standard: number; eligible: boolean };
  /** "Request a better price" / "Tell us your budget": never promised, reviewed by the team. */
  negotiation?: { preferredBudget?: number; note?: string };
  /** Reference website or app the customer shared (used for scope only, never copied). */
  reference?: ReferenceAnalysis;
  /** Currency the customer saw (and the rate used), so the quotation always shows exactly the same. */
  currency?: CurrencySnapshot;
  /** Quote outcome recorded by the team, and when (absent = awaiting decision). */
  outcome?: QuoteOutcome;
  outcomeAt?: string;
  /** AI chat before the enquiry, included with the visitor's consent. */
  transcript?: { role: "user" | "assistant"; content: string }[];
  thread: ThreadMessage[];
};

export type EnquiryInput = Pick<
  Enquiry,
  "solution" | "answers" | "summary" | "transcript" | "plan" | "choices" | "consultation" | "offer" | "negotiation" | "reference" | "currency"
>;

interface Backend {
  get(id: string): Promise<Enquiry | null>;
  put(enquiry: Enquiry): Promise<void>;
  ids(): Promise<string[]>;
  idForToken(token: string): Promise<string | null>;
  linkToken(token: string, id: string): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  putSetting(key: string, value: unknown): Promise<void>;
}

// ---------- Redis ----------

function redisBackend(): Backend | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    get: (id) => redis.get<Enquiry>(`enquiry:${id}`),
    put: async (e) => {
      await redis.set(`enquiry:${e.id}`, e);
      await redis.zadd("enquiries", { score: Date.parse(e.updatedAt), member: e.id });
    },
    ids: () => redis.zrange<string[]>("enquiries", 0, 199, { rev: true }),
    idForToken: (t) => redis.get<string>(`enquiry-token:${t}`),
    linkToken: async (t, id) => {
      await redis.set(`enquiry-token:${t}`, id);
    },
    getSetting: (key) => redis.get(`setting:${key}`),
    putSetting: async (key, value) => {
      await redis.set(`setting:${key}`, value);
    },
  };
}

// ---------- Local file (development only) ----------

function fileBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "enquiries.json");
  type Db = { enquiries: Record<string, Enquiry>; tokens: Record<string, string>; settings?: Record<string, unknown> };
  const read = async (): Promise<Db> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as Db;
    } catch {
      return { enquiries: {}, tokens: {} };
    }
  };
  const write = async (db: Db) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db, null, 2));
  };
  return {
    get: async (id) => (await read()).enquiries[id] ?? null,
    put: async (e) => {
      const db = await read();
      db.enquiries[e.id] = e;
      await write(db);
    },
    ids: async () =>
      Object.values((await read()).enquiries)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((e) => e.id),
    idForToken: async (t) => (await read()).tokens[t] ?? null,
    linkToken: async (t, id) => {
      const db = await read();
      db.tokens[t] = id;
      await write(db);
    },
    getSetting: async <T,>(key: string) => ((await read()).settings?.[key] as T | undefined) ?? null,
    putSetting: async (key, value) => {
      const db = await read();
      db.settings = { ...db.settings, [key]: value };
      await write(db);
    },
  };
}

let cached: Backend | null | undefined;

function backend(): Backend | null {
  if (cached !== undefined) return cached;
  cached = redisBackend() ?? (process.env.VERCEL ? null : fileBackend());
  return cached;
}

export const storeAvailable = () => backend() !== null;

// ---------- Public API ----------

const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newRef = () =>
  "DS-" + Array.from(randomBytes(6), (b) => REF_CHARS[b % REF_CHARS.length]).join("");

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry | null> {
  const db = backend();
  if (!db) return null;
  const now = new Date().toISOString();
  const enquiry: Enquiry = {
    ...input,
    id: randomUUID(),
    ref: newRef(),
    token: randomBytes(24).toString("base64url"),
    createdAt: now,
    updatedAt: now,
    status: "new",
    thread: [],
  };
  await db.put(enquiry);
  await db.linkToken(enquiry.token, enquiry.id);
  return enquiry;
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  return backend()?.get(id) ?? null;
}

export async function getEnquiryByToken(token: string): Promise<Enquiry | null> {
  const db = backend();
  if (!db || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const id = await db.idForToken(token);
  return id ? db.get(id) : null;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const db = backend();
  if (!db) return [];
  const ids = await db.ids();
  const all = await Promise.all(ids.map((id) => db.get(id)));
  return all.filter((e): e is Enquiry => e !== null);
}

export async function addMessage(
  id: string,
  message: Omit<ThreadMessage, "id" | "at">,
  status?: EnquiryStatus,
): Promise<Enquiry | null> {
  const db = backend();
  const enquiry = db ? await db.get(id) : null;
  if (!db || !enquiry) return null;
  const now = new Date().toISOString();
  enquiry.thread.push({ ...message, id: randomUUID(), at: now });
  enquiry.updatedAt = now;
  if (status) enquiry.status = status;
  await db.put(enquiry);
  return enquiry;
}

export async function setStatus(id: string, status: EnquiryStatus): Promise<Enquiry | null> {
  const db = backend();
  const enquiry = db ? await db.get(id) : null;
  if (!db || !enquiry) return null;
  enquiry.status = status;
  enquiry.updatedAt = new Date().toISOString();
  await db.put(enquiry);
  return enquiry;
}

export async function setOutcome(id: string, outcome: QuoteOutcome | null): Promise<Enquiry | null> {
  const db = backend();
  const enquiry = db ? await db.get(id) : null;
  if (!db || !enquiry) return null;
  if (outcome) {
    enquiry.outcome = outcome;
    enquiry.outcomeAt = new Date().toISOString();
  } else {
    delete enquiry.outcome;
    delete enquiry.outcomeAt;
  }
  enquiry.updatedAt = new Date().toISOString();
  await db.put(enquiry);
  return enquiry;
}

// ---------- Settings (admin-controlled, e.g. the new-customer offer) ----------

export async function getSetting<T>(key: string): Promise<T | null> {
  return (await backend()?.getSetting<T>(key)) ?? null;
}

export async function putSetting(key: string, value: unknown): Promise<boolean> {
  const db = backend();
  if (!db) return false;
  await db.putSetting(key, value);
  return true;
}

/** True when this email address has sent an enquiry before (for first-time offers). */
export async function hasPreviousEnquiry(email: string): Promise<boolean> {
  const target = email.trim().toLowerCase();
  return (await listEnquiries()).some((e) => (e.answers.email ?? "").trim().toLowerCase() === target);
}

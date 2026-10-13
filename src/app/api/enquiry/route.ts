import nodemailer from "nodemailer";
import { enquiryLabels, enquirySteps, type EnquiryAnswers, type EnquiryField } from "@/content/enquiry";
import { site } from "@/content/site";

/**
 * POST /api/enquiry
 * Body: { answers: Record<EnquiryField, string> }
 * Emails a chat enquiry to the DotSeek team (Reply-To: the visitor).
 * Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally
 * ENQUIRY_TO / ENQUIRY_FROM). Returns 503 when email isn't configured so the
 * chat can offer "send from my email app" instead.
 * ENQUIRY_DRY_RUN=1 logs the email instead of sending (local testing).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

/** Keeps only known fields, trims to each step's max length, checks required fields. */
function validate(body: unknown): EnquiryAnswers | null {
  if (!body || typeof body !== "object") return null;
  const input = (body as { answers?: Record<string, unknown> }).answers;
  if (!input || typeof input !== "object") return null;
  const answers: EnquiryAnswers = {};
  for (const step of enquirySteps) {
    const raw = input[step.id];
    const value = typeof raw === "string" ? raw.replace(/[\r\n]+/g, step.id === "details" ? "\n" : " ").trim() : "";
    if (!value) {
      if (!step.optional) return null;
      continue;
    }
    answers[step.id] = value.slice(0, step.maxLength ?? 300);
  }
  if (!answers.email || !EMAIL_PATTERN.test(answers.email)) return null;
  return answers;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function formatEmail(answers: EnquiryAnswers) {
  const rows = (Object.keys(enquiryLabels) as EnquiryField[])
    .filter((key) => answers[key])
    .map((key) => [enquiryLabels[key], answers[key]!] as const);
  const text = `New enquiry from the DotSeek Assistant\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n`;
  const html = `<h2 style="font-family:sans-serif">New enquiry from the DotSeek Assistant</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top">${escapeHtml(k)}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
  return { text, html };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const answers = validate(body);
  if (!answers) return Response.json({ error: "Please check your answers." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many enquiries. Please email us directly." }, { status: 429 });
  }

  const { text, html } = formatEmail(answers);
  const subject = `Website enquiry: ${answers.area ?? "Automation"}${answers.company ? ` (${answers.company})` : ""}`;

  if (process.env.ENQUIRY_DRY_RUN === "1") {
    console.info(`[enquiry] DRY RUN\nSubject: ${subject}\nReply-To: ${answers.email}\n${text}`);
    return Response.json({ ok: true });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return Response.json({ error: "Email is not configured." }, { status: 503 });
  }

  try {
    const port = Number(SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.ENQUIRY_FROM ?? `"DotSeek Website" <${SMTP_USER}>`,
      to: process.env.ENQUIRY_TO ?? site.email,
      replyTo: { name: answers.name ?? "", address: answers.email! },
      subject,
      text,
      html,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[enquiry] failed to send", error);
    return Response.json({ error: "Could not send the enquiry." }, { status: 502 });
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { site } from "@/content/site";
import { solutionById } from "@/content/solutions";
import { checkPassword, clearSession, createSession, isAdmin } from "@/lib/admin/auth";
import { createRateLimiter } from "@/lib/assistant/http";
import { invalidateAnalytics } from "@/lib/analytics/engine";
import { addMessage, getEnquiryByToken, setOutcome, setStatus, type EnquiryStatus, type QuoteOutcome } from "@/lib/enquiries/store";
import { emailHtml, escapeHtml, sendMail, siteOrigin, teamInbox } from "@/lib/mail";
import { saveOffer } from "@/lib/offers/store";
import { getRegions, refreshRates, saveRegion } from "@/lib/currency/regions.server";
import { solutionCatalogue } from "@/content/solutions";

/** Server actions for the admin inbox and the customer's private enquiry page. */

const loginLimited = createRateLimiter(15 * 60 * 1000, 8);
const replyLimited = createRateLimiter(60 * 60 * 1000, 20);
const STATUSES: EnquiryStatus[] = ["new", "in_progress", "awaiting_customer", "closed"];
const MAX_MESSAGE = 5000;

async function ip() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ---------- Admin session ----------

export async function loginAction(_: string | undefined, formData: FormData): Promise<string | undefined> {
  if (loginLimited(await ip())) return "Too many attempts. Please wait a few minutes.";
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return "That password isn't right.";
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}

// ---------- Team side ----------

export async function teamReplyAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_MESSAGE);
  const author = String(formData.get("author") ?? "").trim().slice(0, 80) || `${site.name} team`;
  if (!id || !body) return;

  const enquiry = await addMessage(id, { from: "team", body, author }, "awaiting_customer");
  if (!enquiry) return;

  const link = `${siteOrigin()}/enquiry/${enquiry.token}`;
  await sendMail({
    to: enquiry.answers.email,
    replyTo: { name: site.name, address: teamInbox() },
    subject: `${site.name} replied to your enquiry (${enquiry.ref})`,
    text: `Hi ${enquiry.answers.name},\n\n${author} replied to your enquiry ${enquiry.ref}:\n\n${body}\n\nView the conversation and reply here:\n${link}\n\n${site.name}`,
    html: emailHtml(
      `New reply to your enquiry (${enquiry.ref})`,
      `<p>Hi ${escapeHtml(enquiry.answers.name ?? "")},</p><p><b>${escapeHtml(author)}</b> replied:</p><blockquote style="border-left:3px solid #ecf15e;margin:0;padding:4px 12px;white-space:pre-wrap">${escapeHtml(body)}</blockquote><p><a href="${link}" style="display:inline-block;background:#ecf15e;color:#0b0c10;padding:10px 16px;border-radius:8px;text-decoration:none;margin-top:12px">View and reply</a></p>`,
    ),
  });
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
}

export async function statusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EnquiryStatus;
  if (!id || !STATUSES.includes(status)) return;
  await setStatus(id, status);
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
}

/** Records the customer's decision on the quotation (accepted, declined, or back to awaiting). */
export async function outcomeAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("outcome") ?? "");
  const outcome = (["accepted", "declined"] as QuoteOutcome[]).find((o) => o === raw) ?? null;
  if (!id) return;
  await setOutcome(id, outcome);
  invalidateAnalytics();
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
}

// ---------- Customer side ----------

export async function customerReplyAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_MESSAGE);
  if (!token || !body || replyLimited(await ip())) return;

  const current = await getEnquiryByToken(token);
  if (!current) return;
  const enquiry = await addMessage(current.id, { from: "customer", body, author: current.answers.name }, "in_progress");
  if (!enquiry) return;

  const adminLink = `${siteOrigin()}/admin/enquiries/${enquiry.id}`;
  const solution = solutionById(enquiry.solution);
  await sendMail({
    to: teamInbox(),
    replyTo: { name: enquiry.answers.name, address: enquiry.answers.email },
    subject: `[${enquiry.ref}] ${enquiry.answers.name} replied (${solution?.label ?? "enquiry"})`,
    text: `${enquiry.answers.name} replied to enquiry ${enquiry.ref}:\n\n${body}\n\nOpen in admin: ${adminLink}`,
    html: emailHtml(
      `${enquiry.answers.name} replied (${enquiry.ref})`,
      `<blockquote style="border-left:3px solid #ecf15e;margin:0;padding:4px 12px;white-space:pre-wrap">${escapeHtml(body)}</blockquote><p><a href="${adminLink}">Open in the admin inbox</a></p>`,
    ),
  });
  revalidatePath(`/enquiry/${token}`);
}

// ---------- New-customer offer (admin only) ----------

export async function saveOfferAction(_: string | undefined, formData: FormData): Promise<string | undefined> {
  if (!(await isAdmin())) redirect("/admin/login");
  const num = (key: string, max: number) => {
    const n = Number(String(formData.get(key) ?? "").replace(/[£,%\s]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.min(max, Math.round(n)) : undefined;
  };
  const expires = String(formData.get("expires") ?? "").trim();
  const ids = new Set(solutionCatalogue.map((s) => s.id as string));
  const ok = await saveOffer({
    active: formData.get("active") === "on",
    label: String(formData.get("label") ?? "").trim().slice(0, 80) || "New customer offer",
    discountPercent: num("discountPercent", 90),
    fixedPrice: num("fixedPrice", 1_000_000),
    expires: /^\d{4}-\d{2}-\d{2}$/.test(expires) ? expires : undefined,
    eligibleSolutions: formData.getAll("eligible").map(String).filter((id) => ids.has(id)),
  });
  revalidatePath("/admin/offers");
  return ok ? "Saved." : "Couldn't save: storage isn't configured.";
}

// ---------- Pricing regions (admin only) ----------

/** Save one region's currency, pricing, budget and tax settings. */
export async function saveRegionAction(_: string | undefined, formData: FormData): Promise<string | undefined> {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const current = (await getRegions()).find((r) => r.id === id);
  if (!current) return "Unknown region.";
  const text = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  const num = (k: string, min: number, max: number, fallback: number) => {
    const n = Number(String(formData.get(k) ?? "").replace(/[,\s]/g, ""));
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  const currency = text("currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return "Currency must be a three-letter code, e.g. INR.";
  const budgets = text("budgets", 2000)
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((p) => p.length >= 2 && p[0])
    .map(([label, min, max]) => ({ label: label!.slice(0, 60), min: Math.max(0, Number(min) || 0), max: max && max !== "+" && Number(max) > 0 ? Number(max) : null }));
  if (!budgets.length) return "Add at least one budget bracket (label | min | max).";
  const perGbp = num("perGbp", 0.0001, 100000, current.perGbp);
  const rateSource = (["fixed", "ecb", "usd-peg", "manual"] as const).find((s) => s === formData.get("rateSource")) ?? current.rateSource;
  const countries = text("countries", 400)
    .split(/[\s,]+/)
    .map((c) => c.toUpperCase())
    .filter((c) => /^[A-Z]{2}$|^\*$/.test(c));
  const ok = await saveRegion(id, {
    countries: countries.length ? countries : current.countries,
    currency,
    symbol: text("symbol", 6) || currency,
    locale: text("locale", 12) || current.locale,
    perGbp,
    rateSource,
    rateCheckedAt: perGbp !== current.perGbp ? new Date().toISOString() : current.rateCheckedAt,
    priceFactor: num("priceFactor", 0.1, 5, current.priceFactor),
    minProject: num("minProject", 0, 100000000, current.minProject),
    roundTo: num("roundTo", 1, 100000, current.roundTo),
    decimals: Math.round(num("decimals", 0, 2, current.decimals)),
    budgets,
    taxNote: text("taxNote", 300) || current.taxNote,
    invoiceCurrency: (text("invoiceCurrency", 3) || current.invoiceCurrency).toUpperCase(),
  });
  revalidatePath("/admin/regions");
  return ok ? `Saved ${current.name}.` : "Couldn't save: storage isn't configured.";
}

/** Update exchange rates from the provider (ECB via Frankfurter; AED and SAR from their US dollar pegs). */
export async function refreshRatesAction(): Promise<string | undefined> {
  if (!(await isAdmin())) redirect("/admin/login");
  const result = await refreshRates();
  revalidatePath("/admin/regions");
  return result.message;
}

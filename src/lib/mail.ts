import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/content/site";

/**
 * Sends email through the configured SMTP account (Zoho in production).
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ENQUIRY_FROM, ENQUIRY_TO.
 * ENQUIRY_DRY_RUN=1 logs instead of sending (local testing).
 */

export type MailResult = "sent" | "not_configured" | "failed";

type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: { name?: string; address: string };
};

export const teamInbox = () => process.env.ENQUIRY_TO ?? site.email;

export const mailConfigured = () =>
  process.env.ENQUIRY_DRY_RUN === "1" || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendMail(mail: Mail): Promise<MailResult> {
  if (process.env.ENQUIRY_DRY_RUN === "1") {
    console.info(`[mail] DRY RUN to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return "sent";
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return "not_configured";
  try {
    const port = Number(SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.ENQUIRY_FROM ?? `"${site.name}" <${SMTP_USER}>`,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return "sent";
  } catch (error) {
    console.error("[mail] failed to send", error);
    return "failed";
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal branded HTML wrapper for transactional emails. */
export function emailHtml(heading: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#16181c">
  <p style="font-size:18px;font-weight:bold;margin:0 0 4px">${escapeHtml(site.name)}</p>
  <h2 style="font-size:20px;font-weight:normal;margin:16px 0">${escapeHtml(heading)}</h2>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#777">${escapeHtml(site.name)} · ${escapeHtml(site.category)} · ${escapeHtml(site.location)}</p>
</div>`;
}

/** Absolute site origin for links in emails (env override for previews). */
export const siteOrigin = () => process.env.SITE_URL ?? site.url;

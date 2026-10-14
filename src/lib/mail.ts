import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { site } from "@/content/site";
import { EMAIL_LETTERHEAD_PATH, EMAIL_LOGO_CID, EMAIL_LOGO_PNG_BASE64 } from "@/lib/emailLogo";

/**
 * Sends email through the configured SMTP account (Zoho in production).
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ENQUIRY_FROM, ENQUIRY_TO.
 * ENQUIRY_DRY_RUN=1 logs instead of sending and saves the HTML to
 * .data/outbox/ so it can be previewed in a browser (local testing).
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
    const dir = path.join(process.cwd(), ".data", "outbox");
    const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${mail.to.replace(/[^a-z0-9]+/gi, "_")}.html`);
    await mkdir(dir, { recursive: true });
    // Previews open outside an email app and before deploy: inline the logo and letterhead art.
    const art = `${site.url}${EMAIL_LETTERHEAD_PATH}`;
    const artData = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public", EMAIL_LETTERHEAD_PATH))).toString("base64")}`;
    const html = mail.html
      .replaceAll(`cid:${EMAIL_LOGO_CID}`, `data:image/png;base64,${EMAIL_LOGO_PNG_BASE64}`)
      .replaceAll(art, artData);
    await writeFile(file, html.includes("<html") ? html : `<!doctype html><meta charset="utf-8"><title>${escapeHtml(mail.subject)}</title>${html}`);
    console.info(`[mail] DRY RUN to=${mail.to} subject=${mail.subject}\nSaved: ${file}\n${mail.text}`);
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
      // The DotSeek logo travels with the email (no remote image to block).
      attachments: mail.html.includes(`cid:${EMAIL_LOGO_CID}`)
        ? [{ filename: "dotseek.png", content: Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64"), cid: EMAIL_LOGO_CID, contentType: "image/png" }]
        : undefined,
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

import { z } from "zod";
import { answerRows, solutionOf, validateAnswers } from "@/content/enquiryFlows";
import { solutionById } from "@/content/solutions";
import { site } from "@/content/site";
import { clientIp, createRateLimiter, parseTurns, sameOrigin } from "@/lib/assistant/http";
import { createEnquiry, hasPreviousEnquiry, storeAvailable, type EnquirySummary } from "@/lib/enquiries/store";
import { getOffer } from "@/lib/offers/store";
import { offerFor } from "@/lib/plan/offer";
import { sanitizeReference } from "@/lib/plan/referenceFeatures";
import { emailHtml, escapeHtml, mailConfigured, sendMail, siteOrigin, teamInbox } from "@/lib/mail";
import { buildPlan, sanitizeChoices } from "@/lib/plan/build";
import { gbp } from "@/lib/plan/format";
import { planReportBody, planReportText } from "@/lib/plan/report";

/**
 * POST /api/enquiry
 * Body: { answers, choices?, summary?, consultation?, emailCopy?, transcript?, includeTranscript? }
 * Validates answers against the dynamic flows, recalculates the indicative
 * estimate and architecture from the pricing engine (client figures are never
 * trusted), stores the enquiry (when
 * storage is configured), emails the team, and emails the customer a link to
 * their private enquiry page where the conversation continues.
 * Returns 503 only when the enquiry can neither be stored nor emailed, so the
 * chat can offer "send from my email app".
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(60 * 60 * 1000, 5);

const SummarySchema = z.object({
  title: z.string().max(200),
  recommendedSolution: z.string().max(300),
  overview: z.string().max(2000),
  suggestedFeatures: z.array(z.string().max(300)).max(10),
  suggestedTechnology: z.array(z.string().max(300)).max(10),
  openQuestions: z.array(z.string().max(300)).max(10),
  architecture: z.string().max(2000).optional(),
  advice: z
    .array(z.object({ item: z.string().max(40).nullable(), action: z.enum(["add", "remove", "info"]), message: z.string().max(600) }))
    .max(6)
    .optional(),
});

function summaryText(summary?: EnquirySummary): string {
  if (!summary) return "";
  const list = (title: string, items: string[]) => (items.length ? `\n${title}:\n${items.map((i) => `- ${i}`).join("\n")}` : "");
  return `\nAI project brief: ${summary.title}\nRecommended: ${summary.recommendedSolution}\n${summary.overview}${list("Suggested features", summary.suggestedFeatures)}${list("Suggested technology", summary.suggestedTechnology)}${list("Questions to clarify", summary.openQuestions)}\n`;
}

function summaryHtml(summary?: EnquirySummary): string {
  if (!summary) return "";
  const list = (title: string, items: string[]) =>
    items.length ? `<p style="margin:12px 0 4px"><b>${title}</b></p><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
  return `<div style="background:#f6f7f2;border-radius:8px;padding:12px 16px;margin:16px 0">
<p style="margin:0"><b>AI project brief:</b> ${escapeHtml(summary.title)}</p>
<p style="margin:4px 0"><b>Recommended:</b> ${escapeHtml(summary.recommendedSolution)}</p>
<p>${escapeHtml(summary.overview)}</p>${list("Suggested features", summary.suggestedFeatures)}${list("Suggested technology", summary.suggestedTechnology)}${list("Questions to clarify", summary.openQuestions)}</div>`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    answers?: unknown;
    summary?: unknown;
    transcript?: unknown;
    includeTranscript?: unknown;
    choices?: unknown;
    consultation?: unknown;
    emailCopy?: unknown;
    negotiation?: unknown;
    reference?: unknown;
  } | null;
  const answers = validateAnswers(body?.answers);
  if (!answers) return Response.json({ error: "Please check your answers." }, { status: 400 });
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many enquiries. Please email us directly." }, { status: 429 });
  }

  const parsedSummary = SummarySchema.safeParse(body?.summary);
  const summary = parsedSummary.success ? parsedSummary.data : undefined;
  const transcript = body?.includeTranscript === true ? (parseTurns(body?.transcript, 30, 1500) ?? []) : [];
  const solution = solutionById(solutionOf(answers) ?? "");
  const choices = sanitizeChoices(body?.choices);
  const plan = buildPlan(answers, choices);
  const consultation = body?.consultation === true;
  const emailCopy = body?.emailCopy !== false;
  const rows = answerRows(answers);
  // New-customer offer: re-checked here (active, eligible service, first enquiry from this email).
  const quote = offerFor(await getOffer().catch(() => null), plan.solution, plan.build);
  const offer = quote ? { ...quote, eligible: !(await hasPreviousEnquiry(answers.email).catch(() => false)) } : undefined;
  // "Request a better price": saved for the team, never promised.
  const rawNegotiation = (body?.negotiation ?? {}) as { preferredBudget?: unknown; note?: unknown };
  const preferredBudget =
    typeof rawNegotiation.preferredBudget === "number" && rawNegotiation.preferredBudget > 0 && rawNegotiation.preferredBudget < 10_000_000
      ? Math.round(rawNegotiation.preferredBudget)
      : undefined;
  const note = typeof rawNegotiation.note === "string" ? rawNegotiation.note.trim().slice(0, 1000) || undefined : undefined;
  const negotiation = preferredBudget || note ? { preferredBudget, note } : undefined;
  const reference = sanitizeReference(body?.reference);
  const report = { plan, rows, brief: summary, solutionTitle: solution?.title ?? "Project", offer, negotiation, reference };

  if (!storeAvailable() && !mailConfigured()) {
    return Response.json({ error: "Enquiries are not configured." }, { status: 503 });
  }

  const enquiry = await createEnquiry({
    solution: solution?.id ?? "unknown",
    answers,
    summary,
    plan,
    choices,
    consultation,
    offer,
    negotiation,
    reference,
    transcript: transcript.length ? transcript : undefined,
  });
  const origin = siteOrigin();
  const customerLink = enquiry ? `${origin}/enquiry/${enquiry.token}` : null;
  const adminLink = enquiry ? `${origin}/admin/enquiries/${enquiry.id}` : null;
  const ref = enquiry?.ref ?? "";

  // ---------- Team notification ----------
  const rowsText = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
  const rowsHtml = `<table style="border-collapse:collapse">${rows
    .map(
      (r) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top">${escapeHtml(r.label)}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("")}</table>`;
  const transcriptText = transcript.length
    ? `\nChat before the enquiry:\n${transcript.map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.content}`).join("\n")}\n`
    : "";
  const subject = `${ref ? `[${ref}] ` : ""}${consultation ? "Consultation request: " : "New "}${solution?.label.toLowerCase() ?? "project"} enquiry${answers.company ? ` from ${answers.company}` : ""} (est. ${gbp(plan.build)})`;

  const teamResult = await sendMail({
    to: teamInbox(),
    replyTo: { name: answers.name, address: answers.email },
    subject,
    text: `New enquiry from the DotSeek website${ref ? ` (${ref})` : ""}${consultation ? "\nThe customer requested a consultation call." : ""}${reference ? `\nReference: ${reference.url}` : ""}${negotiation ? `\nPreferred budget: ${negotiation.preferredBudget ? gbp(negotiation.preferredBudget) : "not given"}${negotiation.note ? ` (${negotiation.note})` : ""}` : ""}${offer ? `\nOffer: ${offer.label} from ${gbp(offer.price)} (${offer.eligible ? "first enquiry from this email" : "not eligible: email has enquired before"})` : ""}\n${adminLink ? `Open in admin: ${adminLink}\n` : ""}${summaryText(summary)}\n${planReportText(report)}\n\nAnswers\n${rowsText}\n${transcriptText}`,
    html: emailHtml(
      `New ${solution?.title ?? "project"} enquiry${ref ? ` (${ref})` : ""}`,
      `${consultation ? `<p style="background:#ecf15e;color:#0b0c10;padding:8px 12px;border-radius:8px;display:inline-block"><b>Consultation call requested</b></p>` : ""}${adminLink ? `<p><a href="${adminLink}">Open this enquiry in the admin inbox</a></p>` : ""}${summaryHtml(summary)}${planReportBody({ ...report, ref })}<h3 style="font-weight:normal">Answers</h3>${rowsHtml}${
        transcript.length
          ? `<h3 style="font-weight:normal">Chat before the enquiry</h3>${transcript
              .map((t) => `<p><b>${t.role === "user" ? "Visitor" : "Assistant"}:</b> ${escapeHtml(t.content)}</p>`)
              .join("")}`
          : ""
      }`,
    ),
  });

  // Not stored and not emailed: let the visitor send it themselves.
  if (!enquiry && teamResult !== "sent") {
    return Response.json({ error: "Could not send the enquiry." }, { status: 502 });
  }

  // ---------- Customer confirmation (with their private link) ----------
  if (customerLink) {
    await sendMail({
      to: answers.email,
      replyTo: { name: site.name, address: teamInbox() },
      subject: `We've received your enquiry (${ref})`,
      text: `Hi ${answers.name},\n\nThank you for your enquiry about ${solution?.title.toLowerCase() ?? "your project"}. Your reference is ${ref}.${consultation ? " We'll be in touch to arrange your consultation call." : ""}\n\nYou can view your enquiry and continue the conversation with our team here:\n${customerLink}\n\nKeep this link private: anyone with it can view your enquiry.\n\n${emailCopy ? `${planReportText(report)}\n\n` : ""}${site.name}`,
      html: emailHtml(
        "We've received your enquiry",
        `<p>Hi ${escapeHtml(answers.name)},</p><p>Thank you for your enquiry about ${escapeHtml(solution?.title.toLowerCase() ?? "your project")}. Your reference is <b>${escapeHtml(ref)}</b>.${consultation ? " We'll be in touch to arrange your consultation call." : ""}</p><p><a href="${customerLink}" style="display:inline-block;background:#ecf15e;color:#0b0c10;padding:10px 16px;border-radius:8px;text-decoration:none">View your enquiry and reply</a></p><p style="font-size:13px;color:#555">Keep this link private: anyone with it can view your enquiry.</p>${
          emailCopy ? `<hr style="border:0;border-top:1px solid #e3e4e6;margin:28px 0">${planReportBody({ ...report, ref, offer: offer?.eligible ? offer : undefined })}` : ""
        }`,
      ),
    });
  }

  return Response.json({ ok: true, ref: ref || undefined, link: customerLink ?? undefined });
}

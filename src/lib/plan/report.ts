import { marketMeta, pricingMeta, quotationNotice, stageById, tierById, type ItemGroup } from "@/content/pricing";
import type { Plan } from "./build";
import { REFERENCE_FEATURES, REFERENCE_FEATURE_IDS, type ReferenceAnalysis } from "./referenceFeatures";
import { site } from "@/content/site";
import { gbp, gbpRange, moneyRange, perMonth, weeks } from "./format";

/**
 * Printable / emailable quotation and architecture report (inline styles, light
 * theme). Used for "Download quotation" (print to PDF) and the enquiry emails.
 */

export type ReportBrief = {
  title?: string;
  overview?: string;
  architecture?: string;
  advice?: { message: string }[];
};

export type ReportInput = {
  plan: Plan;
  offer?: { label: string; price: number; standard: number; eligible?: boolean };
  negotiation?: { preferredBudget?: number; note?: string };
  reference?: ReferenceAnalysis;
  rows: { label: string; value: string }[];
  brief?: ReportBrief;
  solutionTitle: string;
  ref?: string;
  date?: string;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const h2 = (t: string) => `<h2 style="font-size:16px;font-weight:600;margin:28px 0 8px;padding-bottom:6px;border-bottom:1px solid #e3e4e6">${esc(t)}</h2>`;
const p = (t: string) => `<p style="margin:6px 0;line-height:1.55">${esc(t)}</p>`;
const ul = (items: string[]) => (items.length ? `<ul style="margin:6px 0;padding-left:20px;line-height:1.6">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
const cell = "padding:7px 10px;border-bottom:1px solid #eceded;text-align:left;vertical-align:top";
const table = (head: string[], rows: string[][], alignRight: number[] = []) =>
  `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0"><thead><tr>${head
    .map((h, i) => `<th style="${cell};background:#f5f6f2;font-weight:600${alignRight.includes(i) ? ";text-align:right" : ""}">${esc(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td style="${cell}${alignRight.includes(i) ? ";text-align:right;white-space:nowrap" : ""}">${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

const labelsIn = (plan: Plan, groups: ItemGroup[]) => plan.services.filter((s) => s.selected && groups.includes(s.group)).map((s) => s.label);

/** The report body (no <html> wrapper), for emails. */
export function planReportBody({ plan, rows, brief, solutionTitle, ref, date, offer, negotiation, reference }: ReportInput): string {
  const tier = tierById(plan.tier)!;
  const recommended = tierById(plan.recommendedTier)!;
  const uk = plan.markets.find((m) => m.id === "uk")!;
  const stage = stageById(plan.stage)!;
  const optional = plan.services.filter((s) => !s.selected && ["product", "ai", "communication"].includes(s.group) && s.status !== "not_needed");
  const advice = [...plan.advice.map((a) => a.message), ...(brief?.advice ?? []).map((a) => a.message)];

  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#16181c;max-width:780px;margin:0 auto;font-size:14px">
  <div style="background:#0b0c10;background-image:radial-gradient(circle at 100% 0%, rgba(236,241,94,0.22) 0, rgba(236,241,94,0.22) 60px, transparent 61px, transparent 90px, rgba(236,241,94,0.08) 91px, rgba(236,241,94,0.08) 116px, transparent 117px),radial-gradient(120% 180% at 0% 0%, rgba(236,241,94,0.16), transparent 55%);border-bottom:3px solid #ecf15e;border-radius:8px 8px 0 0;padding:20px 24px;color:#ffffff">
    <table role="presentation" width="100%" style="border-collapse:collapse"><tr>
      <td style="vertical-align:middle">
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff"><span style="color:#ecf15e">&#9679;</span> DotSeek</p>
        <p style="margin:4px 0 0;color:#a3a3a3;font-size:12px">AI Business Automation &amp; Digital Solutions</p>
      </td>
      <td style="vertical-align:middle;text-align:right">
        <p style="margin:0;display:inline-block;background:#ecf15e;color:#0b0c10;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700">${esc(pricingMeta.label)}</p>
        <p style="margin:6px 0 0;color:#c9cbcf;font-size:12px">${ref ? `Ref ${esc(ref)} · ` : ""}${esc(date ?? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))}</p>
      </td>
    </tr></table>
  </div>
  <h1 style="font-size:24px;font-weight:400;margin:24px 0 4px">${esc(brief?.title || `${solutionTitle} plan`)}</h1>
  <p style="margin:0;color:#555">${esc(solutionTitle)} · Recommended stage: <b>${esc(stage.name)}</b> (${esc(stage.priceLabel)}) · ${esc(tier.name)} architecture</p>

  <div style="display:flex;flex-wrap:wrap;gap:10px;margin:20px 0">
    ${[
      ["Minimum estimate", gbp(plan.estimate.min)],
      ["Recommended estimate", gbp(plan.estimate.recommended)],
      ["Maximum estimate", gbp(plan.estimate.max)],
      ["Timeline", weeks(plan.weeks)],
      ["Infrastructure & usage", perMonth(plan.monthly.running)],
      ["Maintenance", perMonth(plan.monthly.maintenance)],
      ["Typical UK agency", gbpRange(uk.agencyGbp)],
      ...(offer ? [[esc(offer.label), `From ${gbp(offer.price)}`]] : []),
      ...(plan.target ? [["Your target price", gbp(plan.target)]] : []),
      ...(negotiation?.preferredBudget ? [["Your preferred budget", gbp(negotiation.preferredBudget)]] : []),
    ]
      .map(
        ([k, v]) =>
          `<div style="flex:1 1 140px;border:1px solid #e3e4e6;border-radius:8px;padding:10px 12px"><p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.04em">${k}</p><p style="margin:4px 0 0;font-size:16px;font-weight:600">${v}</p></div>`,
      )
      .join("")}
  </div>

  ${
    reference
      ? `${h2("Reference")}${p(`${reference.url}: ${reference.summary}`)}${p(`Features spotted: ${REFERENCE_FEATURE_IDS.filter((f) => reference.features[f]).map((f) => REFERENCE_FEATURES[f]).join(", ") || "none"}.`)}${reference.costDrivers ? p(reference.costDrivers) : ""}${p("The reference is used only to understand layout style, features and complexity. DotSeek builds an original solution with the customer's own branding, content and assets unless they own the reference or have permission to reuse it.")}`
      : ""
  }
  ${h2("Customer requirement")}
  ${brief?.overview ? p(brief.overview) : ""}
  ${table(["Question", "Answer"], rows.map((r) => [esc(r.label), esc(r.value)]))}

  ${h2("Recommended architecture")}
  ${p(`Recommended level: ${recommended.name} (level ${plan.level}). ${recommended.tagline}${plan.tier !== plan.recommendedTier ? ` Selected: ${tier.name}.` : ""}`)}
  ${brief?.architecture ? p(brief.architecture) : ""}
  ${p(`Architecture: ${plan.diagram.layers.map((l) => l.nodes.map((n) => n.label).join(" + ")).join("  →  ")}`)}
  ${table(
    ["Layer", "Included"],
    [
      ["Application", esc(labelsIn(plan, ["product"]).join(", "))],
      ["AI & automation", esc(labelsIn(plan, ["ai"]).join(", ") || "None")],
      ["Data & storage", esc(labelsIn(plan, ["data", "storage"]).join(", ") || "None")],
      ["Infrastructure", esc(labelsIn(plan, ["performance", "background", "devops"]).join(", "))],
      ["Security", esc(labelsIn(plan, ["security"]).join(", "))],
      ["Integrations & messaging", esc(labelsIn(plan, ["integrations", "communication"]).join(", ") || "None")],
    ],
  )}

  ${h2("Development estimate")}
  ${table(
    ["Item", "Range", "Recommended"],
    [
      ...plan.lines.map((l) => [esc(l.label), l.min === l.max ? gbp(l.cost) : `${gbp(l.min)}–${gbp(l.max)}`, gbp(l.cost)]),
      [`<b>Estimated total</b>`, `<b>${gbp(plan.estimate.min)}–${gbp(plan.estimate.max)}</b>`, `<b>${gbp(plan.estimate.recommended)}</b>`],
    ],
    [1, 2],
  )}
  ${offer ? p(`${offer.label}: from ${gbp(offer.price)} (standard estimate ${gbp(offer.standard)}). Applies to a customer's first enquiry and is confirmed by the DotSeek team.`) : ""}
  ${negotiation ? p(`Customer's preferred budget: ${negotiation.preferredBudget ? gbp(negotiation.preferredBudget) : "not given"}${negotiation.note ? `. Note: ${negotiation.note}` : ""}. DotSeek will review the scope and suggest whether the project can be adjusted or delivered in phases.`) : ""}
  ${p(`Estimated timeline: ${weeks(plan.weeks)}.`)}

  ${optional.length ? `${h2("Optional features")}${table(["Feature", "Adds about", "Monthly"], optional.map((o) => [esc(o.label), gbp(o.setupCost), o.monthly ? perMonth(o.monthly) : "None"]), [1, 2])}` : ""}

  ${h2("Hosting and recurring costs")}
  ${table(
    ["Item", "Estimated monthly"],
    [
      ...plan.monthly.items.map((i) => [esc(i.label + (i.usage ? " (usage based)" : "")), gbpRange(i.range)]),
      ["<b>Running costs</b>", `<b>${perMonth(plan.monthly.running)}</b>`],
      ["Support &amp; maintenance plan", perMonth(plan.monthly.maintenance)],
    ],
    [1],
  )}
  ${p(`Estimated first-year total (development, running costs and maintenance): ${gbpRange(plan.firstYear)}.`)}

  ${h2("Indicative Market Estimate")}
  ${table(
    ["Market", "Freelancer", "Agency", "Agency (GBP)"],
    [
      ["<b>DotSeek</b>", `<b>${gbp(plan.estimate.min)}–${gbp(plan.estimate.max)}</b>`, `<b>${gbp(plan.estimate.recommended)} recommended</b>`, ""],
      ...plan.markets.map((m) => [esc(m.name), moneyRange(m.freelancer, m.currency, m.locale), moneyRange(m.agency, m.currency, m.locale), gbpRange(m.agencyGbp)]),
    ],
    [1, 2, 3],
  )}
  ${plan.savings ? p(`Compared with a typical UK agency, the recommended estimate is ${plan.savings.percent[0]}% to ${plan.savings.percent[1]}% lower (${gbpRange(plan.savings.amount)}).`) : ""}

  ${h2("Package options")}
  ${table(["Package", "Development", "Running costs"], plan.packages.map((k) => [`<b>${esc(k.name)}</b><br><span style="color:#666">${esc(k.summary)}</span>`, gbp(k.build), perMonth(k.monthly)]), [1, 2])}

  ${h2("Architecture options")}
  ${table(
    ["Level", "Best for", "Infrastructure"],
    plan.tiers.map((t) => [`<b>${esc(t.name)}</b>${t.recommended ? " (recommended)" : ""}`, esc(t.bestFor.slice(0, 3).join(", ")), perMonth(t.monthly)]),
    [2],
  )}
  ${table(
    ["Cloud option", "Monthly estimate", "Management effort"],
    plan.providers.filter((x) => x.option).map((x) => [`Option ${x.option}: ${esc(x.name)}`, perMonth(x.monthly), esc(x.management)]),
    [1],
  )}

  ${h2("Recommended implementation phases")}
  ${plan.phases
    .map(
      (ph) =>
        `<p style="margin:10px 0 2px"><b>${esc(ph.name)}</b>${ph.cost ? ` · ${gbp(ph.cost)} (${gbp(ph.min)}–${gbp(ph.max)})` : ""}${ph.withinBudget === undefined ? "" : ph.withinBudget ? " · within your budget" : ""}</p>${p(ph.summary)}${ul(ph.items)}`,
    )
    .join("")}

  ${plan.upgradePath.length ? `${h2("Future upgrade path")}${plan.upgradePath.map((u) => `<p style="margin:8px 0 2px"><b>→ ${esc(u.tier)}</b> · ${perMonth(u.monthly)}</p>${ul(u.adds)}`).join("")}` : ""}

  ${advice.length ? `${h2("Consultant recommendations")}${ul(advice)}` : ""}

  ${p(`Quotation status: ${quotationNotice.status}.`)}
  ${h2("Notes and assumptions")}
  ${ul([
    "Prices come from DotSeek's price catalogue for the selected scope; the recommended estimate sits between the minimum and maximum.",
    "Stages are starting ranges (Basic from £100, Starter £300–£1,000+, Growth £1,000–£3,000+, Advanced £3,000–£10,000+, Scale / Enterprise by custom quote).",
    "Infrastructure and usage costs are monthly estimates and depend on the cloud provider and real usage.",
    "Content, copywriting, licences, domains and VAT are not included unless stated.",
  ])}

  <div style="margin-top:28px;padding:12px 14px;border-left:4px solid #ecf15e;background:#fbfbf8;border-radius:6px;font-size:12px;color:#4b4f56;line-height:1.55">
    ${quotationNotice.sections
      .map(
        (n) =>
          `<p style="margin:10px 0 4px;color:#0b0c10;font-weight:600;text-transform:uppercase;letter-spacing:.05em">${esc(n.heading)}</p>${
            n.steps ? `<p style="margin:0 0 4px">${n.steps.map(esc).join(" → ")}</p>` : ""
          }${n.body.map((t) => `<p style="margin:0 0 4px">${esc(t)}</p>`).join("")}${
            n.list ? `<ul style="margin:0 0 4px;padding-left:18px">${n.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""
          }${n.after ? `<p style="margin:0 0 4px">${esc(n.after)}</p>` : ""}`,
      )
      .join("")}
  </div>

  <div style="margin-top:16px;padding:12px 14px;background:#f5f6f2;border-radius:8px;font-size:12px;color:#555;line-height:1.55">
    <p style="margin:0 0 6px"><b>${esc(pricingMeta.label)}.</b> ${esc(pricingMeta.disclaimer)}</p>
    <p style="margin:0 0 6px">${esc(pricingMeta.marketDisclaimer)} Market data and exchange rates reviewed ${esc(marketMeta.reviewed)}.</p>
    <p style="margin:0">${esc(pricingMeta.infraDisclaimer)}</p>
  </div>
  <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#555">${esc(`${site.name} · ${site.location} · ${site.email}`)}</p>
</div>`;
}

/** A complete HTML document for printing or saving as PDF. */
export function planReportDocument(input: ReportInput): string {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
    input.brief?.title || "DotSeek estimate",
  )} | DotSeek</title><style>@page{margin:16mm}body{margin:24px;background:#fff}@media print{body{margin:0}}</style></head><body>${planReportBody(input)}</body></html>`;
}

/** Short plain-text summary for email text parts. */
export function planReportText({ plan, solutionTitle }: Pick<ReportInput, "plan" | "solutionTitle">): string {
  const uk = plan.markets.find((m) => m.id === "uk")!;
  return [
    `${pricingMeta.label}: ${solutionTitle}`,
    `Recommended architecture: ${tierById(plan.recommendedTier)!.name}${plan.tier !== plan.recommendedTier ? ` (selected: ${tierById(plan.tier)!.name})` : ""}`,
    ...plan.lines.map((l) => `- ${l.label}: ${gbp(l.cost)}`),
    `Estimate: minimum ${gbp(plan.estimate.min)}, recommended ${gbp(plan.estimate.recommended)}, maximum ${gbp(plan.estimate.max)} (${weeks(plan.weeks)})`,
    `Recommended stage: ${stageById(plan.stage)!.name}`,
    `Running costs: ${perMonth(plan.monthly.running)}; maintenance: ${perMonth(plan.monthly.maintenance)}`,
    `Typical UK agency range: ${gbpRange(uk.agencyGbp)}`,
    pricingMeta.disclaimer,
  ].join("\n");
}


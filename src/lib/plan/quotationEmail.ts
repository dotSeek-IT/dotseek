import { quotationNotice } from "@/content/pricing";
import { site } from "@/content/site";
import { EMAIL_LETTERHEAD_PATH, EMAIL_LOGO_CID } from "@/lib/emailLogo";
import type { Plan } from "./build";
import { solutionHeadline } from "./headline";
import { weeks } from "./format";
import { defaultRegions } from "@/content/regions";
import { formatRateDate, invoiceNote, makeMoney, rateText, type Money } from "@/lib/currency/money";
import type { ReferenceAnalysis } from "./referenceFeatures";

/**
 * The quotation document as email HTML: the same layout as the on-screen
 * quotation (QuotationView) rebuilt with tables and inline styles, so it
 * renders the same in Gmail, Outlook and Apple Mail. Colours mirror the
 * --ds-color-doc-* tokens.
 */

export type QuotationEmailInput = {
  plan: Plan;
  title: string;
  solutionTitle: string;
  overview?: string;
  contact: { name?: string; email: string; company?: string };
  ref?: string;
  offer?: { label: string; price: number };
  negotiation?: { preferredBudget?: number };
  reference?: Pick<ReferenceAnalysis, "host">;
  /** Optional call to action under the sheet (e.g. the private enquiry link). */
  cta?: { label: string; href: string };
  /** Customer copy: how to change the scope (private enquiry page) or start again (fresh quote link). */
  requote?: { enquiryHref: string; freshHref: string };
  /** The customer's currency (from the quotation's saved currency details); GBP when absent. */
  money?: Money;
  /** HTML shown above the sheet (greeting) and below it (team-only details). */
  intro?: string;
  after?: string;
  date?: Date;
};

const C = {
  page: "#0b0c10",
  brand: "#ecf15e",
  bg: "#ffffff",
  ink: "#0b0c10",
  text: "#16181c",
  muted: "#4b4f56",
  subtle: "#6b6f76",
  faint: "#9a9ea5",
  line: "#e6e7e9",
  lineSoft: "#eeeff1",
  lineStrong: "#d9dadd",
  tint: "#f6f7f2",
  tintSoft: "#fbfbf8",
  zebra: "#fafafa",
  accentInk: "#6d7210",
  bandText: "#c9cbcf",
};

const FONT = "Ubuntu,'Segoe UI',Helvetica,Arial,sans-serif";
const VALID_DAYS = 30;
const OVERHEAD = ["testing", "deployment", "management"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

const label = (t: string) =>
  `<p style="margin:0 0 6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.subtle};font-weight:600">${esc(t)}</p>`;
const heading = (t: string) =>
  `<p style="margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid ${C.ink};font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${C.ink};font-weight:700">${esc(t)}</p>`;
const section = (inner: string, pad = "28px 40px 0") => `<tr><td style="padding:${pad}">${inner}</td></tr>`;
const row = (dt: string, dd: string, extra = "") =>
  `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.lineSoft};font-size:13px;color:${C.muted}${extra}">${dt}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${C.lineSoft};font-size:13px;color:${C.text};font-weight:600;white-space:nowrap${extra}">${dd}</td></tr>`;

/** The full email HTML document (doctype included). */
export function quotationEmailHtml(input: QuotationEmailInput): string {
  const { plan, title, solutionTitle, overview, contact, ref, offer, negotiation, reference, cta, intro, after, requote } = input;
  const money = input.money ?? makeMoney(defaultRegions[0]!);
  const region = money.region;
  const contract = invoiceNote(region);
  const today = input.date ?? new Date();
  const valid = new Date(today.getTime() + VALID_DAYS * 86_400_000);
  const lines = [...plan.lines.filter((l) => !OVERHEAD.includes(l.id)), ...plan.lines.filter((l) => OVERHEAD.includes(l.id))];
  const description = (id: string) => plan.services.find((s) => s.id === id)?.summary ?? "";
  const headline = solutionHeadline(plan, solutionTitle);
  const fit = plan.budgetFit === "within" ? "Within budget" : plan.budgetFit === "above" ? "Phased plan suggested" : "Not given";

  // Same artwork as the on-screen letterhead (glow, dot grid, "seek" ring), as an image:
  // email apps can't draw it with CSS. Falls back to the plain dark band.
  const art = `${site.url}${EMAIL_LETTERHEAD_PATH}`;
  const letterhead = `<tr><td background="${art}" bgcolor="${C.page}" height="110" style="background:${C.page} url('${art}') left top / 680px 110px no-repeat;padding:26px 40px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="padding-right:10px"><img src="cid:${EMAIL_LOGO_CID}" width="30" height="30" alt="DotSeek" style="display:block;border:0"></td>
        <td valign="middle" style="font-size:24px;font-weight:600;color:#ffffff;letter-spacing:-.01em">${esc(site.name)}</td>
      </tr></table>
      <p style="margin:6px 0 0;font-size:12px;letter-spacing:.02em;color:#a3a3a3">${esc(site.category)}</p>
    </td>
    <td valign="middle" align="right" style="font-size:12px;line-height:1.5;color:${C.bandText}">
      <span style="color:${C.brand};font-weight:600">${esc(site.url.replace("https://", ""))}</span><br>${esc(site.email)}<br>${esc(site.location)}
    </td>
  </tr></table>
</td></tr>
<tr><td height="3" bgcolor="${C.brand}" style="height:3px;line-height:3px;font-size:0;background:${C.brand};background-image:linear-gradient(90deg, ${C.brand}, rgba(236,241,94,0.15))">&nbsp;</td></tr>`;

  const meta = [
    ["Reference", ref ? esc(ref) : "Draft"],
    ["Date", fmtDate(today)],
    ["Valid until", fmtDate(valid)],
    ["Status", esc(quotationNotice.status)],
    ["Currency", esc(region.currency)],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:3px 16px 3px 0;font-size:12px;color:${C.subtle};white-space:nowrap">${k}</td><td align="right" style="padding:3px 0;font-size:12px;color:${C.text};font-weight:600">${v}</td></tr>`,
    )
    .join("");

  const titleRow = section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="top">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${C.brand};color:${C.page};font-size:11px;font-weight:700">${esc(plan.label)}</span>
        <p style="margin:12px 0 4px;font-size:34px;line-height:1.1;letter-spacing:.04em;text-transform:uppercase;color:${C.ink};font-weight:400">Quotation</p>
        <p style="margin:0;font-size:14px;color:${C.muted}">${esc(title)}</p>
      </td>
      <td valign="top" align="right" style="padding-left:16px"><table role="presentation" cellpadding="0" cellspacing="0">${meta}</table></td>
    </tr></table>`,
    "32px 40px 0",
  );

  const party = (t: string, strong: string, rest: string[]) =>
    `<td valign="top" width="33%" style="padding:16px 18px">${label(t)}<p style="margin:0;font-size:13px;color:${C.ink};font-weight:600">${esc(strong)}</p>${rest
      .map((r) => `<p style="margin:2px 0 0;font-size:12px;color:${C.muted}">${esc(r)}</p>`)
      .join("")}</td>`;
  const parties = section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:8px"><tr>
      ${party("Prepared for", contact.name || contact.email, [contact.company ?? "", contact.email].filter(Boolean))}
      ${party("Prepared by", site.name, [site.email])}
      ${party("Solution", headline.name, [headline.detail])}
    </tr></table>`,
  );

  const scope =
    overview || reference
      ? section(
          `${heading("Scope summary")}${overview ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${C.text}">${esc(overview)}</p>` : ""}${
            reference
              ? `<p style="margin:0;font-size:12px;line-height:1.6;color:${C.subtle}">Reference: ${esc(reference.host)}. Used only to understand layout style, features and complexity; your solution is original, with your own branding, content and assets.</p>`
              : ""
          }`,
        )
      : "";

  const th = (t: string, right = false) =>
    `<th align="${right ? "right" : "left"}" style="padding:8px 8px 8px 0;border-bottom:1px solid ${C.lineStrong};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.subtle};font-weight:600">${t}</th>`;
  const items = lines
    .map((l, i) => {
      const bg = i % 2 ? C.zebra : C.bg;
      const desc = description(l.id);
      return `<tr style="background:${bg}">
        <td valign="top" style="padding:10px 8px;border-bottom:1px solid ${C.lineSoft};font-size:12px;color:${C.faint};width:24px">${i + 1}</td>
        <td valign="top" style="padding:10px 8px 10px 0;border-bottom:1px solid ${C.lineSoft}"><p style="margin:0;font-size:13px;color:${C.ink};font-weight:600">${esc(l.label)}</p>${
          desc ? `<p style="margin:2px 0 0;font-size:12px;color:${C.subtle}">${esc(desc)}</p>` : ""
        }</td>
        <td valign="top" align="right" style="padding:10px 8px 10px 0;border-bottom:1px solid ${C.lineSoft};font-size:12px;color:${C.subtle};white-space:nowrap">${l.min === l.max ? "" : `${money.fmt(l.min)}–${money.fmt(l.max)}`}</td>
        <td valign="top" align="right" style="padding:10px 0;border-bottom:1px solid ${C.lineSoft};font-size:13px;color:${C.text};font-weight:600;white-space:nowrap">${money.fmt(l.cost)}</td>
      </tr>`;
    })
    .join("");

  const totals = `<table role="presentation" align="right" cellpadding="0" cellspacing="0" style="width:300px;margin-top:16px">
      ${row("Minimum estimate", money.total(plan.estimate.min))}
      ${row("Maximum estimate", money.total(plan.estimate.max))}
      ${offer ? row(`${esc(offer.label)} (first enquiry)`, `From ${money.fmt(offer.price)}`, `;color:${C.accentInk}`) : ""}
      <tr><td style="padding:12px 14px;background:${C.page};border-radius:6px 0 0 6px;font-size:13px;color:#ffffff">Recommended estimate</td><td align="right" style="padding:12px 14px;background:${C.page};border-radius:0 6px 6px 0;font-size:18px;color:${C.brand};font-weight:700;white-space:nowrap">${money.total(plan.estimate.recommended)}</td></tr>
    </table>`;

  const development = section(
    `${heading("Development")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <thead><tr>${th("#")}${th("Item")}${th("Range", true)}${th("Amount", true)}</tr></thead>
      <tbody>${items}</tbody>
    </table>
    ${totals}
    <div style="clear:both"></div>
    ${
      money.isGbp
        ? ""
        : `<p style="margin:12px 0 0;font-size:12px;color:${C.subtle}">Reference value: approximately ${esc(money.ref(plan.estimate.recommended)?.replace("≈ ", "") ?? "")} · Exchange rate used: ${esc(rateText(region))} · Rate checked: ${esc(formatRateDate(region.rateCheckedAt))}</p>`
    }
    <p style="margin:${money.isGbp ? 12 : 4}px 0 0;font-size:12px;color:${C.subtle}">Prices in ${esc(region.currency)}. ${esc(region.taxNote)} Estimated timeline ${esc(weeks(plan.weeks))}.</p>${
      contract ? `<p style="margin:4px 0 0;font-size:12px;color:${C.subtle}">${esc(contract)}</p>` : ""
    }`,
  );

  const budgetRows = [
    plan.budget ? row("Stated budget", Number.isFinite(plan.budget[1]) ? `Up to ${money.fmt(plan.budget[1])}` : `Over ${money.fmt(plan.budget[0])}`) : "",
    negotiation?.preferredBudget ? row("Preferred budget", money.fmt(negotiation.preferredBudget)) : "",
    row("Fit", fit),
  ].join("");
  const twoCol = section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="top" width="48%">${heading("Running costs")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row(
        "Infrastructure &amp; usage",
        money.perMonth(plan.monthly.running),
      )}${row("Support &amp; maintenance", money.perMonth(plan.monthly.maintenance))}</table></td>
      <td width="4%"></td>
      <td valign="top" width="48%">${heading("Your budget")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${budgetRows}</table></td>
    </tr></table>`,
  );

  const phases =
    plan.phases.length > 1
      ? section(
          `${heading("Implementation plan")}${plan.phases
            .map(
              (ph) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px"><tr><td style="border-left:3px solid ${C.brand};padding:4px 0 4px 12px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:${C.ink};font-weight:600">${esc(ph.name)}</td><td align="right" style="font-size:13px;color:${C.text};font-weight:600">${ph.cost > 0 ? money.fmt(ph.cost) : ""}</td></tr></table>
                <p style="margin:2px 0 0;font-size:12px;color:${C.subtle}">${esc(ph.items.join(" · "))}</p>
              </td></tr></table>`,
            )
            .join("")}`,
        )
      : "";

  const terms = section(
    `${heading("Notes and terms")}<ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.7;color:${C.muted}">
      <li>This is an AI generated indicative estimate based on your answers and DotSeek's price catalogue. It is not a binding quotation or offer.</li>
      <li>The final commercial quotation is confirmed by the DotSeek team after reviewing your complete requirements.</li>
      <li>Running costs depend on the cloud provider and real usage. Content, licences and domains are excluded unless stated. ${esc(region.taxNote)}</li>
      <li>Valid for ${VALID_DAYS} days from the date above.</li>
    </ul>`,
  );

  // Notice: two columns of blocks (the last spans both), lists split into two columns, as on screen.
  const para = (t: string) => `<p style="margin:0 0 4px;font-size:12px;line-height:1.55;color:${C.muted}">${esc(t)}</p>`;
  const twoColList = (items: string[]) => {
    const half = Math.ceil(items.length / 2);
    const col = (xs: string[]) =>
      `<ul style="margin:0;padding-left:16px;font-size:12px;line-height:1.55;color:${C.muted}">${xs.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0"><tr><td valign="top" width="50%">${col(items.slice(0, half))}</td><td valign="top" width="50%">${col(items.slice(half))}</td></tr></table>`;
  };
  const block = (n: (typeof quotationNotice.sections)[number]) =>
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${C.ink};font-weight:600">${esc(n.heading)}</p>${
      n.steps
        ? `<p style="margin:4px 0 8px;line-height:2">${n.steps
            .map(
              (st, i) =>
                `<span style="display:inline-block;margin:0 4px 4px 0;padding:3px 8px;border-radius:999px;background:${C.ink};color:${C.bg};font-size:11px;white-space:nowrap">${
                  i ? `<span style="color:${C.brand}">&rarr;</span> ` : ""
                }${esc(st)}</span>`,
            )
            .join("")}</p>`
        : ""
    }${n.body.map(para).join("")}${n.list ? twoColList(n.list) : ""}${n.after ? para(n.after) : ""}`;
  const blocks = quotationNotice.sections;
  const last = blocks[blocks.length - 1];
  const pairs: string[] = [];
  for (let i = 0; i < blocks.length - 1; i += 2) {
    const right = i + 1 < blocks.length - 1 ? blocks[i + 1] : undefined;
    pairs.push(
      `<tr><td valign="top" width="50%" style="padding:0 12px 16px 0">${block(blocks[i]!)}</td><td valign="top" width="50%" style="padding:0 0 16px 12px">${right ? block(right) : ""}</td></tr>`,
    );
  }
  const notice = section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tintSoft};border:1px solid ${C.line};border-left:4px solid ${C.brand};border-radius:6px"><tr><td style="padding:20px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pairs.join("")}<tr><td colspan="2" valign="top">${last ? block(last) : ""}</td></tr></table>
    </td></tr></table>`,
  );

  const footer = `<tr><td style="padding:28px 40px 32px"><p style="margin:0;padding-top:16px;border-top:1px solid ${C.line};text-align:center;font-size:11px;color:${C.faint}">${esc(
    `${site.name} · ${site.location} · ${site.email}`,
  )}</p></td></tr>`;

  const requoteBox = requote
    ? `<tr><td style="padding:24px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141617;border:1px solid #2a2c30;border-radius:10px"><tr><td style="padding:22px 24px">
        <p style="margin:0 0 6px;font-size:16px;color:#ffffff;font-weight:600">Your enquiry, and changing your quote</p>
        <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#b5b7bb">Reply to the team and follow the conversation on your private enquiry page. To add, remove or change services, tell the team there what to adjust and they'll send a revised quotation. To price something different, start a fresh quote with the DotSeek Assistant. There's no account or password: your private link is your access, so keep it safe.</p>
        <a href="${esc(requote.enquiryHref)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:8px;background:${C.brand};color:${C.page};font-size:14px;font-weight:600;text-decoration:none">View or adjust my quote &rarr;</a><a href="${esc(requote.freshHref)}" style="display:inline-block;margin:0 0 8px;padding:9px 17px;border-radius:8px;border:1px solid #4a4d52;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Start a fresh quote</a>
      </td></tr></table></td></tr>`
    : "";

  const button = cta
    ? `<tr><td align="center" style="padding:24px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${C.brand};color:${C.page};font-size:14px;font-weight:600;text-decoration:none">${esc(cta.label)} &rarr;</a></td></tr>`
    : "";

  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(
    `Quotation${ref ? ` ${ref}` : ""} | ${site.name}`,
  )}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 12px">
  ${intro ? `<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px"><tr><td style="padding:0 4px 24px;font-size:15px;line-height:1.6;color:#e7e8ea">${intro}</td></tr></table>` : ""}
  <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background:${C.bg};border-radius:10px;overflow:hidden;font-family:${FONT};color:${C.text}">
    ${letterhead}${titleRow}${parties}${scope}${development}${twoCol}${phases}${terms}${notice}${footer}
  </table>
  <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px">${button}${requoteBox}</table>
  ${after ? `<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin-top:24px;background:${C.bg};border-radius:10px"><tr><td style="padding:28px 40px;font-size:13px;line-height:1.6;color:${C.text}">${after}</td></tr></table>` : ""}
</td></tr></table>
</body></html>`;
}

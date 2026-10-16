import { quotationNotice } from "@/content/pricing";
import { site } from "@/content/site";
import type { Plan } from "@/lib/plan/build";
import { weeks } from "@/lib/plan/format";
import { solutionHeadline } from "@/lib/plan/headline";
import type { OfferQuote } from "@/lib/plan/offer";
import type { ReferenceAnalysis } from "@/lib/plan/referenceFeatures";
import { LogoMark } from "@/components/common/LogoMark";
import { useRegion } from "@/components/currency/useRegion";
import { formatRateDate, invoiceNote, rateText, type Money } from "@/lib/currency/money";
import styles from "./Quotation.module.css";

export type QuotationContact = { name?: string; email?: string; company?: string };

export type QuotationDocumentProps = {
  plan: Plan;
  title: string;
  solutionTitle: string;
  overview?: string;
  contact: QuotationContact;
  offer?: OfferQuote | null;
  negotiation?: { preferredBudget?: number; note?: string };
  reference?: ReferenceAnalysis;
};

const VALID_DAYS = 30;

const formatDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Stable draft number for this estimate (same scope gives the same number). */
function draftRef(plan: Plan) {
  const seed = `${plan.solution}-${[...plan.selected].sort().join(",")}-${plan.estimate.recommended}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `DQ-${h.toString(36).toUpperCase().slice(0, 6).padStart(6, "0")}`;
}

/**
 * The quotation document (letterhead, parties, itemised costs, terms and the
 * Quotation Notice). Shown in the quotation modal and, live, in the chat's
 * quote workspace. Without an email yet, "Prepared for" says so.
 */
export function QuotationDocument(props: QuotationDocumentProps & { money?: Money }) {
  // The visitor's currency in the chat; a stored quotation passes its own Money.
  const live = useRegion().money;
  return <Document {...props} money={props.money ?? live} />;
}

function Document({ plan, title, solutionTitle, overview, contact, offer, negotiation, reference, money }: QuotationDocumentProps & { money: Money }) {
  const region = money.region;
  const contract = invoiceNote(region);
  const email = contact.email;
  const today = new Date();
  const valid = new Date(today.getTime() + VALID_DAYS * 86_400_000);
  const work = plan.lines.filter((l) => !["testing", "deployment", "management"].includes(l.id));
  const overhead = plan.lines.filter((l) => ["testing", "deployment", "management"].includes(l.id));
  const description = (id: string) => plan.services.find((s) => s.id === id)?.summary ?? "";
  const headline = solutionHeadline(plan, solutionTitle);

  return (
    <article className={styles.sheet}>
      <header className={styles.letterhead}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <LogoMark size={30} />
            {site.name}
          </span>
          <p>{site.category}</p>
        </div>
        <address className={styles.company}>
          <span>{site.url.replace("https://", "")}</span>
          <span>{site.email}</span>
          <span>{site.location}</span>
        </address>
      </header>

      <div className={styles.titleRow}>
        <div>
          <p className={styles.badge}>{plan.label}</p>
          <h1 className={styles.docTitle}>Quotation</h1>
          <p className={styles.project}>{title}</p>
        </div>
        <dl className={styles.meta}>
          <div>
            <dt>Reference</dt>
            <dd>{draftRef(plan)} (draft)</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(today)}</dd>
          </div>
          <div>
            <dt>Valid until</dt>
            <dd>{formatDate(valid)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{quotationNotice.status}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{region.currency}</dd>
          </div>
        </dl>
      </div>

      <section className={styles.parties}>
        <div>
          <p className={styles.label}>Prepared for</p>
          <p className={styles.strong}>{contact.name || email || "You"}</p>
          {contact.company && <p>{contact.company}</p>}
          <p>{email ?? "Your contact details are added when you send the enquiry."}</p>
        </div>
        <div>
          <p className={styles.label}>Prepared by</p>
          <p className={styles.strong}>{site.name}</p>
          <p>{site.email}</p>
        </div>
        <div>
          <p className={styles.label}>Solution</p>
          <p className={styles.strong}>{headline.name}</p>
          <p>{headline.detail}</p>
        </div>
      </section>

      {(overview || reference) && (
        <section className={styles.section}>
          <h2>Scope summary</h2>
          {overview && <p>{overview}</p>}
          {reference && (
            <p className={styles.muted}>
              Reference: {reference.host}. Used only to understand layout style, features and complexity; your solution is original, with your own
              branding, content and assets.
            </p>
          )}
        </section>
      )}

      <section className={styles.section}>
        <h2>Development</h2>
        <table className={styles.items}>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Item</th>
              <th scope="col" className={styles.num}>
                Range
              </th>
              <th scope="col" className={styles.num}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {[...work, ...overhead].map((l, i) => (
              <tr key={l.id}>
                <td className={styles.index}>{i + 1}</td>
                <td>
                  <span className={styles.strong}>{l.label}</span>
                  {description(l.id) && <span className={styles.desc}>{description(l.id)}</span>}
                </td>
                <td className={`${styles.num} ${styles.muted}`}>{l.min === l.max ? "" : `${money.fmt(l.min)}–${money.fmt(l.max)}`}</td>
                <td className={styles.num}>{money.fmt(l.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className={styles.totals}>
          <div>
            <dt>Minimum estimate</dt>
            <dd>{money.total(plan.estimate.min)}</dd>
          </div>
          <div>
            <dt>Maximum estimate</dt>
            <dd>{money.total(plan.estimate.max)}</dd>
          </div>
          {offer && (
            <div className={styles.offerRow}>
              <dt>{offer.label} (first enquiry)</dt>
              <dd>From {money.fmt(offer.price)}</dd>
            </div>
          )}
          <div className={styles.grand}>
            <dt>Recommended estimate</dt>
            <dd>{money.total(plan.estimate.recommended)}</dd>
          </div>
        </dl>
        {!money.isGbp && (
          <p className={styles.muted}>
            Reference value: approximately {money.ref(plan.estimate.recommended)?.replace("≈ ", "")} · Exchange rate used: {rateText(region)} · Rate checked:{" "}
            {formatRateDate(region.rateCheckedAt)}
          </p>
        )}
        <p className={styles.muted}>
          Prices in {region.currency}. {region.taxNote} Estimated timeline {weeks(plan.weeks)}.
        </p>
        {contract && <p className={styles.muted}>{contract}</p>}
      </section>

      <section className={styles.twoCol}>
        <div>
          <h2>Running costs</h2>
          <dl className={styles.list}>
            <div>
              <dt>Infrastructure & usage</dt>
              <dd>{money.perMonth(plan.monthly.running)}</dd>
            </div>
            <div>
              <dt>Support & maintenance</dt>
              <dd>{money.perMonth(plan.monthly.maintenance)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2>Your budget</h2>
          <dl className={styles.list}>
            {plan.budget && (
              <div>
                <dt>Stated budget</dt>
                <dd>{Number.isFinite(plan.budget[1]) ? `Up to ${money.fmt(plan.budget[1])}` : `Over ${money.fmt(plan.budget[0])}`}</dd>
              </div>
            )}
            {negotiation?.preferredBudget && (
              <div>
                <dt>Preferred budget</dt>
                <dd>{money.fmt(negotiation.preferredBudget)}</dd>
              </div>
            )}
            <div>
              <dt>Fit</dt>
              <dd>{plan.budgetFit === "within" ? "Within budget" : plan.budgetFit === "above" ? "Phased plan suggested" : "Not given"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {plan.phases.length > 1 && (
        <section className={styles.section}>
          <h2>Implementation plan</h2>
          <ol className={styles.phases}>
            {plan.phases.map((ph) => (
              <li key={ph.name}>
                <p className={styles.phaseHead}>
                  <span className={styles.strong}>{ph.name}</span>
                  {ph.cost > 0 && <span>{money.fmt(ph.cost)}</span>}
                </p>
                <p className={styles.muted}>{ph.items.join(" · ")}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={styles.section}>
        <h2>Notes and terms</h2>
        <ul className={styles.terms}>
          <li>This is an AI-generated indicative estimate based on your answers and DotSeek&apos;s price catalogue. It is not a binding quotation or offer.</li>
          <li>The final commercial quotation is confirmed by the DotSeek team after reviewing your complete requirements.</li>
          <li>Running costs depend on the cloud provider and real usage. Content, licences and domains are excluded unless stated. {region.taxNote}</li>
          <li>Valid for {VALID_DAYS} days from the date above.</li>
        </ul>
      </section>

      <section className={styles.notice} aria-label="Quotation notice">
        {quotationNotice.sections.map((n) => (
          <div key={n.heading} className={styles.noticeBlock}>
            <h2>{n.heading}</h2>
            {n.steps && (
              <ol className={styles.steps}>
                {n.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {n.body.map((para) => (
              <p key={para}>{para}</p>
            ))}
            {n.list && (
              <ul>
                {n.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {n.after && <p>{n.after}</p>}
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        {site.name} · {site.location} · {site.email}
      </footer>
    </article>
  );
}

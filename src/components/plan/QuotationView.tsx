"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { quotationNotice } from "@/content/pricing";
import { site } from "@/content/site";
import type { Plan } from "@/lib/plan/build";
import { gbp, perMonth, weeks } from "@/lib/plan/format";
import { solutionHeadline } from "@/lib/plan/headline";
import type { OfferQuote } from "@/lib/plan/offer";
import type { ReferenceAnalysis } from "@/lib/plan/referenceFeatures";
import { Icon } from "@/components/common/Icon";
import styles from "./Quotation.module.css";

type Contact = { name?: string; email?: string; company?: string };

type QuotationViewProps = {
  plan: Plan;
  title: string;
  solutionTitle: string;
  overview?: string;
  contact: Contact;
  offer?: OfferQuote | null;
  negotiation?: { preferredBudget?: number; note?: string };
  reference?: ReferenceAnalysis;
  /** Email (and optional name) are required to view the quotation; they join the enquiry. */
  onContact: (contact: { email: string; name?: string }) => void;
  onSend?: () => void;
  onConsult?: () => void;
  onClose: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
 * The final quotation as a document in a modal. It is shown only after the
 * customer gives an email address, and it is view-only: no download.
 */
export function QuotationView(props: QuotationViewProps) {
  const { contact, onClose } = props;
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    // Start in the email field when it's needed (showModal focuses the close button by default).
    dialog?.querySelector<HTMLInputElement>("#quote-email")?.focus();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${contact.email ? "" : styles.dialogGate}`}
      aria-label="Your quotation"
      onCancel={(event) => {
        // Nested inside the estimate dialog: React passes cancel up the tree, so stop it here
        // or one Esc would close both.
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close quotation">
        <Icon name="close" />
      </button>
      {contact.email ? <Quotation {...props} email={contact.email} /> : <EmailGate onContact={props.onContact} defaultName={contact.name} />}
    </dialog>
  );
}

function EmailGate({ onContact, defaultName }: { onContact: QuotationViewProps["onContact"]; defaultName?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(defaultName ?? "");
  const [error, setError] = useState<string>();
  return (
    <form
      className={styles.gate}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = email.trim();
        if (!EMAIL.test(value)) return setError("Please enter a valid email address.");
        onContact({ email: value, name: name.trim() || undefined });
      }}
    >
      <p className={styles.gateKicker}>Your quotation is ready</p>
      <h2 className={styles.gateTitle}>Where should we send updates about it?</h2>
      <p className={styles.gateText}>
        Enter your email to view your quotation. It&apos;s added to your enquiry so the DotSeek team can confirm the final price with you.
      </p>
      <label htmlFor="quote-email">Email</label>
      <input
        id="quote-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(undefined);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "quote-email-error" : undefined}
        placeholder="you@company.com"
      />
      {error && (
        <p id="quote-email-error" className={styles.gateError} role="alert">
          {error}
        </p>
      )}
      <label htmlFor="quote-name">Name (optional)</label>
      <input id="quote-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className={styles.gateButton}>
        View my quotation <Icon name="arrow" />
      </button>
      <p className={styles.gateNote}>
        We use your email only for this enquiry, as described in our{" "}
        <Link href="/privacy" target="_blank" rel="noopener">
          Privacy policy<span className="sr-only"> (opens in a new tab)</span>
        </Link>
        .
      </p>
    </form>
  );
}

function Quotation({
  plan,
  title,
  solutionTitle,
  overview,
  contact,
  email,
  offer,
  negotiation,
  reference,
  onSend,
  onConsult,
}: QuotationViewProps & { email: string }) {
  const today = new Date();
  const valid = new Date(today.getTime() + VALID_DAYS * 86_400_000);
  const work = plan.lines.filter((l) => !["testing", "deployment", "management"].includes(l.id));
  const overhead = plan.lines.filter((l) => ["testing", "deployment", "management"].includes(l.id));
  const description = (id: string) => plan.services.find((s) => s.id === id)?.summary ?? "";
  const headline = solutionHeadline(plan, solutionTitle);

  return (
    <div className={styles.scroll}>
      <article className={styles.sheet}>
        <header className={styles.letterhead}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false">
                <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="52 20" strokeLinecap="round" />
                <circle cx="16" cy="16" r="4.4" fill="currentColor" />
                <circle cx="27.2" cy="8" r="2" fill="currentColor" />
              </svg>
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
          </dl>
        </div>

        <section className={styles.parties}>
          <div>
            <p className={styles.label}>Prepared for</p>
            <p className={styles.strong}>{contact.name || email}</p>
            {contact.company && <p>{contact.company}</p>}
            <p>{email}</p>
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
                  <td className={`${styles.num} ${styles.muted}`}>{l.min === l.max ? "" : `${gbp(l.min)}–${gbp(l.max)}`}</td>
                  <td className={styles.num}>{gbp(l.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className={styles.totals}>
            <div>
              <dt>Minimum estimate</dt>
              <dd>{gbp(plan.estimate.min)}</dd>
            </div>
            <div>
              <dt>Maximum estimate</dt>
              <dd>{gbp(plan.estimate.max)}</dd>
            </div>
            {offer && (
              <div className={styles.offerRow}>
                <dt>{offer.label} (first enquiry)</dt>
                <dd>From {gbp(offer.price)}</dd>
              </div>
            )}
            <div className={styles.grand}>
              <dt>Recommended estimate</dt>
              <dd>{gbp(plan.estimate.recommended)}</dd>
            </div>
          </dl>
          <p className={styles.muted}>Prices in GBP, excluding VAT. Estimated timeline {weeks(plan.weeks)}.</p>
        </section>

        <section className={styles.twoCol}>
          <div>
            <h2>Running costs</h2>
            <dl className={styles.list}>
              <div>
                <dt>Infrastructure & usage</dt>
                <dd>{perMonth(plan.monthly.running)}</dd>
              </div>
              <div>
                <dt>Support & maintenance</dt>
                <dd>{perMonth(plan.monthly.maintenance)}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2>Your budget</h2>
            <dl className={styles.list}>
              {plan.budget && (
                <div>
                  <dt>Stated budget</dt>
                  <dd>{Number.isFinite(plan.budget[1]) ? `Up to ${gbp(plan.budget[1])}` : `Over ${gbp(plan.budget[0])}`}</dd>
                </div>
              )}
              {negotiation?.preferredBudget && (
                <div>
                  <dt>Preferred budget</dt>
                  <dd>{gbp(negotiation.preferredBudget)}</dd>
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
                    {ph.cost > 0 && <span>{gbp(ph.cost)}</span>}
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
            <li>Running costs depend on the cloud provider and real usage. Content, licences, domains and VAT are excluded unless stated.</li>
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

      {(onSend || onConsult) && (
        <div className={styles.actions}>
          {onSend && (
            <button type="button" className={styles.primary} onClick={onSend}>
              Send to DotSeek for confirmation <Icon name="arrow" />
            </button>
          )}
          {onConsult && (
            <button type="button" className={styles.secondary} onClick={onConsult}>
              Request a consultation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

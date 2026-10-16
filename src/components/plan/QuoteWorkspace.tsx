"use client";

import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/lib/plan/build";
import { gbp, weeks } from "@/lib/plan/format";
import type { OfferQuote } from "@/lib/plan/offer";
import type { ReferenceAnalysis } from "@/lib/plan/referenceFeatures";
import { Icon } from "@/components/common/Icon";
import { QuotationDocument, type QuotationContact } from "./QuotationDocument";
import styles from "./QuoteWorkspace.module.css";

/**
 * What the quote panel shows: nothing started, answers coming in, a quote that already exists but is
 * still loading (e.g. after a refresh: no replay of the generation steps), or a generated quote.
 */
export type WorkspaceStatus = "idle" | "collecting" | "preparing" | "ready";

type QuoteWorkspaceProps = {
  status: WorkspaceStatus;
  plan?: Plan;
  title: string;
  solutionTitle: string;
  overview?: string;
  contact: QuotationContact;
  offer?: OfferQuote | null;
  negotiation?: { preferredBudget?: number; note?: string };
  reference?: ReferenceAnalysis;
  /** The customer's answers so far (shown while the quote is being prepared). */
  rows: { id: string; label: string; value: string }[];
  onStart: () => void;
  /** After sending: the enquiry's reference and a way to open it (the idle state confirms it was sent). */
  sent?: { ref?: string; onView?: () => void };
  onOpenEstimate: () => void;
  onContinue?: () => void;
};

const STEPS = [
  "Reading your requirement",
  "Choosing the right architecture",
  "Pricing each item from the DotSeek catalogue",
  "Comparing UK and market rates",
  "Preparing your quotation",
];

/**
 * The right-hand side of the expanded chat: the quote builds up while the
 * customer answers, is "generated" step by step when it is ready, and then
 * stays live as a document that updates with every change.
 */
export function QuoteWorkspace(props: QuoteWorkspaceProps) {
  const { status, plan } = props;
  const existing = status === "ready" || status === "preparing";
  const [step, setStep] = useState(existing ? STEPS.length : -1);
  const [updating, setUpdating] = useState(false);
  const wasReady = useRef(existing);
  const lastBuild = useRef(plan?.build);

  // First time a quote is ready: walk through the generation steps, then reveal the document.
  useEffect(() => {
    if (status === "preparing") wasReady.current = true;
    if (status !== "ready" || wasReady.current) return;
    wasReady.current = true;
    const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = fast ? 120 : 520;
    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), delay * (i + 1)));
    setStep(0);
    return () => timers.forEach(window.clearTimeout);
  }, [status]);

  // Later changes (answers, versions, the price slider): a short "Updating" state.
  useEffect(() => {
    if (!plan || step < STEPS.length) return;
    if (lastBuild.current !== undefined && lastBuild.current !== plan.build) {
      setUpdating(true);
      const id = window.setTimeout(() => setUpdating(false), 700);
      lastBuild.current = plan.build;
      return () => window.clearTimeout(id);
    }
    lastBuild.current = plan.build;
  }, [plan, plan?.build, step]);

  const generating = status === "ready" && step < STEPS.length;

  return (
    <aside className={styles.workspace} aria-label="Your quote">
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>{status === "ready" && !generating ? "Live quote" : "Quote workspace"}</p>
          <h2 className={styles.title}>
            {status === "ready" || status === "preparing"
              ? props.title
              : status === "collecting"
                ? "Your quote is being prepared"
                : props.sent
                  ? "Quote sent"
                  : "Your quote appears here"}
          </h2>
        </div>
        {status === "ready" && plan && !generating && (
          <div className={styles.total} data-updating={updating || undefined} aria-live="polite">
            <span>{updating ? "Updating" : "Recommended"}</span>
            <strong>{gbp(plan.estimate.recommended)}</strong>
            <small>
              {gbp(plan.estimate.min)}–{gbp(plan.estimate.max)} · {weeks(plan.weeks)}
            </small>
          </div>
        )}
      </header>

      <div className={styles.body}>
        {status === "idle" && props.sent && (
          <div className={styles.empty} role="status">
            <Icon name="check" />
            <p>
              <strong>Your quote{props.sent.ref ? ` ${props.sent.ref}` : ""} is with the DotSeek team.</strong> We&apos;ve emailed you a private link to
              follow the conversation; the team confirms the final quotation after reviewing your requirements.
            </p>
            <div className={styles.emptyActions}>
              {props.sent.onView && (
                <button type="button" className={styles.primary} onClick={props.sent.onView}>
                  View your enquiry <Icon name="arrow" />
                </button>
              )}
              <button type="button" className={styles.secondary} onClick={props.onStart}>
                Start another enquiry
              </button>
            </div>
          </div>
        )}

        {status === "idle" && !props.sent && (
          <div className={styles.empty}>
            <Icon name="document" />
            <p>Answer a few questions in the chat, or paste a website or app link, and your quotation builds up here as you go.</p>
            <button type="button" className={styles.primary} onClick={props.onStart}>
              Start an enquiry <Icon name="arrow" />
            </button>
          </div>
        )}

        {status === "collecting" && <Collecting rows={props.rows} />}

        {status === "preparing" && <Skeleton />}

        {generating && <Generating step={step} />}

        {status === "ready" && plan && !generating && (
          <div className={styles.docWrap} data-updating={updating || undefined}>
            <QuotationDocument
              plan={plan}
              title={props.title}
              solutionTitle={props.solutionTitle}
              overview={props.overview}
              contact={props.contact}
              offer={props.offer}
              negotiation={props.negotiation}
              reference={props.reference}
            />
          </div>
        )}
      </div>

      {status === "ready" && !generating && (
        <footer className={styles.foot}>
          <button type="button" className={styles.secondary} onClick={props.onOpenEstimate}>
            Adjust services and price
          </button>
          {props.onContinue && (
            <button type="button" className={styles.primary} onClick={props.onContinue}>
              Continue to send enquiry <Icon name="arrow" />
            </button>
          )}
        </footer>
      )}
    </aside>
  );
}

/** While answers come in: the requirement so far, and the document taking shape. */
function Collecting({ rows }: { rows: QuoteWorkspaceProps["rows"] }) {
  return (
    <div className={styles.collecting}>
      <p className={styles.status} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        Gathering your requirement: {rows.length} {rows.length === 1 ? "answer" : "answers"} so far
      </p>
      {rows.length > 0 && (
        <dl className={styles.rows}>
          {rows.map((r) => (
            <div key={r.id}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Skeleton />
    </div>
  );
}

/** The generation sequence, step by step, over a skeleton of the document. */
function Generating({ step }: { step: number }) {
  return (
    <div className={styles.generating}>
      <ol className={styles.steps} aria-live="polite">
        {STEPS.map((label, i) => (
          <li key={label} data-state={i < step ? "done" : i === step ? "active" : "waiting"}>
            <span className={styles.stepIcon} aria-hidden="true">
              {i < step ? <Icon name="check" /> : i === step ? <span className={styles.spinner} /> : null}
            </span>
            {label}
            {i === step && <span className={styles.dots} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <Skeleton />
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skBand} />
      <div className={styles.skRow}>
        <span style={{ width: "28%" }} />
        <span style={{ width: "18%" }} />
      </div>
      <div className={styles.skBlock} />
      {[72, 64, 80, 58, 70].map((w, i) => (
        <div key={i} className={styles.skRow}>
          <span style={{ width: `${w}%` }} />
          <span style={{ width: "12%" }} />
        </div>
      ))}
      <div className={styles.skTotal} />
    </div>
  );
}

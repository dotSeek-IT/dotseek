"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/lib/plan/build";
import type { OfferQuote } from "@/lib/plan/offer";
import type { ReferenceAnalysis } from "@/lib/plan/referenceFeatures";
import { Icon } from "@/components/common/Icon";
import { QuotationDocument } from "./QuotationDocument";
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
  return (
    <div className={styles.scroll}>
      <QuotationDocument
        plan={plan}
        title={title}
        solutionTitle={solutionTitle}
        overview={overview}
        contact={{ ...contact, email }}
        offer={offer}
        negotiation={negotiation}
        reference={reference}
      />

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

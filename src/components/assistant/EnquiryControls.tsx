"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { EnquiryStep } from "@/content/enquiryFlows";
import type { Solution, SolutionId } from "@/content/solutions";
import { Icon } from "@/components/common/Icon";
import type { EnquiryPhase, Recommendation } from "./useEnquiry";
import styles from "./DotSeekAssistant.module.css";

type EnquiryControlsProps = {
  phase: EnquiryPhase;
  step?: EnquiryStep;
  editing: boolean;
  solutions: Solution[];
  recommendation?: Recommendation;
  hasTranscript: boolean;
  includeTranscript: boolean;
  hasPlan: boolean;
  emailCopy: boolean;
  consultation: boolean;
  error?: string;
  mailtoHref: string;
  onAnswer: (value: string) => void;
  onChoose: (solution: SolutionId) => void;
  onSend: () => void;
  onRestart: () => void;
  onCancel: () => void;
  onCancelEdit: () => void;
  onToggleTranscript: (value: boolean) => void;
  onToggleEmailCopy: (value: boolean) => void;
  onToggleConsultation: (value: boolean) => void;
  onOpenPlan: () => void;
  onContinue: () => void;
  onConsult: () => void;
  onReference: (url: string) => void;
  onSkipReference: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Replaces the chat input during an enquiry. The parent remounts it per step
 * (key), so local state always starts fresh: no flash of the previous step.
 */
export function EnquiryControls(props: EnquiryControlsProps) {
  const { phase, onCancel } = props;

  if (phase === "recommending") {
    return (
      <div className={styles.enquiry}>
        <p className={styles.thinkingRow} role="status">
          <span className={styles.typingInline} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Finding the best solution for your business…
        </p>
      </div>
    );
  }

  if (phase === "choosing") return <ChooseSolution {...props} />;
  if (phase === "reference") return <ReferenceInput onSubmit={props.onReference} onSkip={props.onSkipReference} onCancel={onCancel} />;
  if (phase === "analysing") {
    return (
      <div className={styles.enquiry}>
        <p className={styles.thinkingRow} role="status">
          <span className={styles.typingInline} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Analysing the reference: pages, features and complexity…
        </p>
      </div>
    );
  }
  if (phase === "plan") {
    return (
      <div className={styles.enquiry}>
        <div className={styles.enquiryActions}>
          <button type="button" className={styles.primaryAction} onClick={props.onContinue}>
            Continue to send enquiry <Icon name="arrow" />
          </button>
        </div>
        <div className={styles.enquiryActions}>
          <button type="button" className={styles.textAction} onClick={props.onConsult}>
            Request a consultation
          </button>
          <button type="button" className={styles.textAction} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  if (phase === "review" || phase === "sending") return <ReviewActions {...props} />;

  if (phase === "failed") {
    return (
      <div className={styles.enquiry}>
        {props.error && <p className={styles.fieldError}>{props.error}</p>}
        <div className={styles.enquiryActions}>
          <a href={props.mailtoHref} className={styles.primaryAction}>
            Send from my email app <Icon name="mail" />
          </a>
          <button type="button" className={styles.textAction} onClick={props.onSend}>
            Try again
          </button>
          <button type="button" className={styles.textAction} onClick={onCancel}>
            Cancel enquiry
          </button>
        </div>
      </div>
    );
  }

  return props.step ? <AskStep {...props} step={props.step} /> : null;
}

function AskStep({ step, editing, onAnswer, onCancel, onCancelEdit }: EnquiryControlsProps & { step: EnquiryStep }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const isChoice = step.kind === "choice" || step.kind === "multi";
  const needsField = !isChoice || otherOpen;
  const longText = step.kind === "longtext" || (otherOpen && step.kind !== "multi");

  useEffect(() => {
    if (needsField) inputRef.current?.focus({ preventScroll: true });
  }, [needsField]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value) {
      if (step.optional && !otherOpen) return onAnswer("");
      return setInvalid(isChoice ? "Please type your answer, or choose one of the options." : "Please enter an answer.");
    }
    if (step.kind === "email" && !EMAIL.test(value)) {
      return setInvalid("That email address doesn't look quite right. Could you check it?");
    }
    if (step.kind === "multi") return onAnswer([...selected, value].join(", "));
    onAnswer(value);
  };

  const toggle = (option: string) =>
    setSelected((list) => (list.includes(option) ? list.filter((o) => o !== option) : [...list, option]));

  const fieldId = `enquiry-${step.id}`;

  return (
    <div className={styles.enquiry}>
      {isChoice && (
        <div className={styles.options} role={step.kind === "multi" ? "group" : undefined} aria-label={step.question}>
          {step.options?.map((option) =>
            step.kind === "multi" ? (
              <button
                key={option}
                type="button"
                className={styles.option}
                aria-pressed={selected.includes(option)}
                onClick={() => toggle(option)}
              >
                {selected.includes(option) && <Icon name="check" />}
                {option}
              </button>
            ) : (
              <button key={option} type="button" className={styles.option} onClick={() => onAnswer(option)}>
                {option}
              </button>
            ),
          )}
          {step.other && (
            <button
              type="button"
              className={styles.option}
              aria-pressed={otherOpen}
              aria-expanded={otherOpen}
              onClick={() => setOtherOpen((open) => !open)}
            >
              {otherOpen ? <Icon name="check" /> : <Icon name="plus" />}
              Other
            </button>
          )}
        </div>
      )}

      {needsField && (
        <form className={styles.enquiryField} onSubmit={submit} noValidate>
          <label htmlFor={fieldId} className="sr-only">
            {otherOpen ? `${step.question} (other)` : step.question}
          </label>
          {longText ? (
            <textarea
              id={fieldId}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className={`${styles.input} ${styles.textarea}`}
              value={text}
              rows={3}
              maxLength={step.maxLength ?? 1500}
              placeholder={otherOpen ? "Tell us in your own words" : step.placeholder || (step.optional ? "Optional" : undefined)}
              aria-invalid={Boolean(invalid)}
              onChange={(event) => {
                setText(event.target.value);
                setInvalid(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
            />
          ) : (
            <input
              id={fieldId}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className={styles.input}
              type={step.kind === "email" ? "email" : step.kind === "tel" ? "tel" : "text"}
              autoComplete={
                step.kind === "email" ? "email" : step.kind === "tel" ? "tel" : step.id === "name" ? "name" : step.id === "company" ? "organization" : "off"
              }
              value={text}
              maxLength={otherOpen ? 200 : step.maxLength}
              placeholder={otherOpen ? "Tell us in your own words" : step.placeholder || (step.optional ? "Optional" : undefined)}
              aria-invalid={Boolean(invalid)}
              aria-describedby={invalid ? `${fieldId}-error` : undefined}
              onChange={(event) => {
                setText(event.target.value);
                setInvalid(undefined);
              }}
            />
          )}
          <button type="submit" className={styles.send} aria-label="Submit answer">
            <Icon name="arrow" />
          </button>
        </form>
      )}
      {invalid && (
        <p id={`${fieldId}-error`} className={styles.fieldError} role="alert">
          {invalid}
        </p>
      )}

      <div className={styles.enquiryActions}>
        {step.kind === "multi" && !otherOpen && (
          <button
            type="button"
            className={styles.primaryAction}
            disabled={!selected.length}
            onClick={() => onAnswer(selected.join(", "))}
          >
            Continue <Icon name="arrow" />
          </button>
        )}
        {step.optional && !isChoice && (
          <button type="button" className={styles.textAction} onClick={() => onAnswer("")}>
            Skip this question
          </button>
        )}
        {editing ? (
          <button type="button" className={styles.textAction} onClick={onCancelEdit}>
            Keep current answer
          </button>
        ) : (
          <button type="button" className={styles.textAction} onClick={onCancel}>
            Cancel enquiry
          </button>
        )}
      </div>
    </div>
  );
}

function ChooseSolution({ solutions, recommendation, onChoose, onCancel }: EnquiryControlsProps) {
  const others = solutions.filter((s) => s.id !== recommendation?.solution);
  const recommended = solutions.find((s) => s.id === recommendation?.solution);
  return (
    <div className={styles.enquiry}>
      {recommended && (
        <div className={styles.enquiryActions}>
          <button type="button" className={styles.primaryAction} onClick={() => onChoose(recommended.id)}>
            Continue with {recommended.title} <Icon name="arrow" />
          </button>
        </div>
      )}
      <p className={styles.consent}>{recommended ? "Or choose a different solution:" : "Choose a solution:"}</p>
      <div className={styles.options}>
        {others.map((s) => (
          <button key={s.id} type="button" className={styles.option} onClick={() => onChoose(s.id)}>
            {s.title}
          </button>
        ))}
      </div>
      <div className={styles.enquiryActions}>
        <button type="button" className={styles.textAction} onClick={onCancel}>
          Cancel enquiry
        </button>
      </div>
    </div>
  );
}

function ReviewActions({
  phase,
  hasTranscript,
  includeTranscript,
  hasPlan,
  emailCopy,
  consultation,
  onToggleEmailCopy,
  onToggleConsultation,
  onOpenPlan,
  onToggleTranscript,
  onSend,
  onRestart,
  onCancel,
}: EnquiryControlsProps) {
  const sending = phase === "sending";
  return (
    <div className={styles.enquiry}>
      {hasTranscript && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={includeTranscript}
            onChange={(event) => onToggleTranscript(event.target.checked)}
            disabled={sending}
          />
          Include our chat so the team has the full context
        </label>
      )}
      {hasPlan && (
        <label className={styles.checkbox}>
          <input type="checkbox" checked={emailCopy} onChange={(event) => onToggleEmailCopy(event.target.checked)} disabled={sending} />
          Email me a copy of my estimate
        </label>
      )}
      <label className={styles.checkbox}>
        <input type="checkbox" checked={consultation} onChange={(event) => onToggleConsultation(event.target.checked)} disabled={sending} />
        I&apos;d like a free consultation call
      </label>
      <p className={styles.consent}>
        By sending, you agree that DotSeek may use these details to reply to your enquiry, as described in our{" "}
        <Link href="/privacy" target="_blank" rel="noopener">
          Privacy policy<span className="sr-only"> (opens in a new tab)</span>
        </Link>
        .
      </p>
      <div className={styles.enquiryActions}>
        <button type="button" className={styles.primaryAction} onClick={onSend} disabled={sending}>
          {sending ? "Sending your enquiry…" : "Send enquiry"}
          {!sending && <Icon name="arrow" />}
        </button>
        {hasPlan && (
          <button type="button" className={styles.textAction} onClick={onOpenPlan} disabled={sending}>
            View estimate
          </button>
        )}
        <button type="button" className={styles.textAction} onClick={onRestart} disabled={sending}>
          Start again
        </button>
        <button type="button" className={styles.textAction} onClick={onCancel} disabled={sending}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReferenceInput({ onSubmit, onSkip, onCancel }: { onSubmit: (url: string) => void; onSkip: () => void; onCancel: () => void }) {
  const [url, setUrl] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className={styles.enquiry}>
      <form
        className={styles.enquiryField}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const value = url.trim();
          if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(value)) return setInvalid("Please paste a website address, for example example.com.");
          onSubmit(value);
        }}
      >
        <label htmlFor="enquiry-reference" className="sr-only">
          Reference website or app link
        </label>
        <input
          id="enquiry-reference"
          ref={inputRef}
          className={styles.input}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
          maxLength={500}
          value={url}
          aria-invalid={Boolean(invalid)}
          aria-describedby={invalid ? "enquiry-reference-error" : undefined}
          onChange={(event) => {
            setUrl(event.target.value);
            setInvalid(undefined);
          }}
        />
        <button type="submit" className={styles.send} aria-label="Analyse this reference">
          <Icon name="arrow" />
        </button>
      </form>
      {invalid && (
        <p id="enquiry-reference-error" className={styles.fieldError} role="alert">
          {invalid}
        </p>
      )}
      <div className={styles.enquiryActions}>
        <button type="button" className={styles.textAction} onClick={onSkip}>
          Continue without a reference
        </button>
        <button type="button" className={styles.textAction} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

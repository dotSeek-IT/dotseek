"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { enquiryCopy, type EnquiryStep } from "@/content/enquiry";
import { Icon } from "@/components/common/Icon";
import styles from "./DotSeekAssistant.module.css";

export type EnquiryPhase = "asking" | "review" | "sending" | "failed" | "sent";

type EnquiryControlsProps = {
  step: EnquiryStep | undefined;
  phase: EnquiryPhase;
  error?: string;
  mailtoHref: string;
  onAnswer: (value: string) => void;
  onSend: () => void;
  onRestart: () => void;
  onCancel: () => void;
  onNavigate: () => void;
};

/**
 * Inline controls for the chat enquiry: option buttons, multi-select with
 * Continue, an "Other" text field, text/email inputs with Skip, and the
 * review/send actions. Rendered in place of the normal chat input.
 */
export function EnquiryControls({
  step,
  phase,
  error,
  mailtoHref,
  onAnswer,
  onSend,
  onRestart,
  onCancel,
  onNavigate,
}: EnquiryControlsProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // The parent remounts this component per step (key), so state starts fresh
  // without a post-paint reset that would flash the previous step's state.
  const needsField = phase === "asking" && step && (step.kind === "text" || step.kind === "email" || otherOpen);
  useEffect(() => {
    // preventScroll stops mobile browsers jumping the page behind the sheet.
    if (needsField) inputRef.current?.focus({ preventScroll: true });
  }, [needsField]);

  if (phase === "review" || phase === "sending") {
    return (
      <div className={styles.enquiry}>
        <p className={styles.consent}>
          {enquiryCopy.consent.replace("Privacy policy.", "")}
          <Link href="/privacy" onClick={onNavigate}>
            Privacy policy
          </Link>
          .
        </p>
        <div className={styles.enquiryActions}>
          <button type="button" className={styles.primaryAction} onClick={onSend} disabled={phase === "sending"}>
            {phase === "sending" ? enquiryCopy.sending : enquiryCopy.send}
            {phase !== "sending" && <Icon name="arrow" />}
          </button>
          <button type="button" className={styles.textAction} onClick={onRestart} disabled={phase === "sending"}>
            {enquiryCopy.restart}
          </button>
          <button type="button" className={styles.textAction} onClick={onCancel} disabled={phase === "sending"}>
            {enquiryCopy.cancel}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className={styles.enquiry}>
        {error && <p className={styles.fieldError}>{error}</p>}
        <div className={styles.enquiryActions}>
          <a href={mailtoHref} className={styles.primaryAction}>
            {enquiryCopy.emailApp} <Icon name="mail" />
          </a>
          <button type="button" className={styles.textAction} onClick={onSend}>
            Try again
          </button>
          <button type="button" className={styles.textAction} onClick={onCancel}>
            {enquiryCopy.cancel}
          </button>
        </div>
      </div>
    );
  }

  if (phase !== "asking" || !step) return null;

  const submitText = (event?: FormEvent) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value) {
      if (step.optional && !otherOpen) return onAnswer("");
      return setInvalid(enquiryCopy.required);
    }
    if (step.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return setInvalid(enquiryCopy.invalidEmail);
    }
    if (step.kind === "multi") return onAnswer([...selected, value].join(", "));
    onAnswer(value);
  };

  const toggle = (option: string) =>
    setSelected((list) => (list.includes(option) ? list.filter((o) => o !== option) : [...list, option]));

  const isChoice = step.kind === "choice" || step.kind === "multi";

  return (
    <div className={styles.enquiry}>
      {isChoice && (
        <div
          className={styles.options}
          role={step.kind === "multi" ? "group" : undefined}
          aria-label={step.question}
        >
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
              {enquiryCopy.other}
            </button>
          )}
        </div>
      )}

      {needsField && (
        <form className={styles.enquiryField} onSubmit={submitText} noValidate>
          <label htmlFor={`enquiry-${step.id}`} className="sr-only">
            {otherOpen ? `${step.question} (other)` : step.question}
          </label>
          {step.id === "details" ? (
            <textarea
              id={`enquiry-${step.id}`}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className={`${styles.input} ${styles.textarea}`}
              value={text}
              rows={3}
              maxLength={step.maxLength}
              placeholder={step.placeholder}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submitText(event);
              }}
            />
          ) : (
            <input
              id={`enquiry-${step.id}`}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className={styles.input}
              type={step.kind === "email" ? "email" : step.id === "phone" ? "tel" : "text"}
              autoComplete={
                step.kind === "email" ? "email" : step.id === "name" ? "name" : step.id === "phone" ? "tel" : step.id === "company" ? "organization" : "off"
              }
              value={text}
              maxLength={otherOpen ? 200 : step.maxLength}
              placeholder={otherOpen ? step.placeholder : step.placeholder}
              aria-invalid={Boolean(invalid)}
              aria-describedby={invalid ? `enquiry-${step.id}-error` : undefined}
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
        <p id={`enquiry-${step.id}-error`} className={styles.fieldError} role="alert">
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
            {enquiryCopy.continue} <Icon name="arrow" />
          </button>
        )}
        {step.optional && !isChoice && (
          <button type="button" className={styles.textAction} onClick={() => onAnswer("")}>
            {enquiryCopy.skip}
          </button>
        )}
        <button type="button" className={styles.textAction} onClick={onCancel}>
          {enquiryCopy.cancel}
        </button>
      </div>
    </div>
  );
}
